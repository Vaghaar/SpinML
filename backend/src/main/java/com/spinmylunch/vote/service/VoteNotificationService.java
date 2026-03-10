package com.spinmylunch.vote.service;

import com.spinmylunch.domain.group.GroupMemberRepository;
import com.spinmylunch.domain.roulette.Roulette;
import com.spinmylunch.domain.vote.*;
import com.spinmylunch.roulette.dto.RouletteUpdateMessage;
import com.spinmylunch.vote.dto.LiveVoteUpdate;
import com.spinmylunch.vote.dto.SpinSyncMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

/**
 * Centralise tous les broadcasts WebSocket du domaine votes et spin.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VoteNotificationService {

    private final SimpMessagingTemplate    messagingTemplate;
    private final VoteRepository           voteRepository;
    private final GroupMemberRepository    groupMemberRepository;

    // ─── Topics ───────────────────────────────────────────────────────────────

    private static String voteTopic(UUID groupId) {
        return "/topic/group/" + groupId + "/vote";
    }

    private static String spinTopic(UUID groupId) {
        return "/topic/group/" + groupId + "/spin";
    }

    private static String rouletteSpinTopic(UUID rouletteId) {
        return "/topic/roulette/" + rouletteId + "/spin";
    }

    private static String rouletteTopic(UUID groupId) {
        return "/topic/group/" + groupId + "/roulette";
    }

    // ─── Vote live update ─────────────────────────────────────────────────────

    /**
     * Diffuse les résultats mis à jour à tous les membres du groupe.
     * Appelé après chaque vote ou fermeture de session.
     */
    public void broadcastVoteUpdate(VoteSession session, LiveVoteUpdate.TiebreakerResult winner) {
        UUID groupId = session.getGroup().getId();

        List<Vote> allVotes = voteRepository.findBySessionId(session.getId());
        int totalVoters     = (int) voteRepository.countDistinctVotersBySessionId(session.getId());
        int eligible        = groupMemberRepository.countByGroupId(groupId);

        List<LiveVoteUpdate.OptionResult> results = computeOptionResults(
                session.getOptions(), allVotes, session.getMode());

        LiveVoteUpdate update = new LiveVoteUpdate(
                session.getId(),
                groupId,
                session.getMode(),
                session.getStatus(),
                results,
                totalVoters,
                eligible,
                session.getQuorumPercent(),
                winner,
                Instant.now()
        );

        messagingTemplate.convertAndSend(voteTopic(groupId), update);
        log.debug("Vote update broadcasté → {} (session={})", voteTopic(groupId), session.getId());
    }

    // ─── Spin sync ────────────────────────────────────────────────────────────

    /**
     * Diffuse une mise à jour de roulette (proposition, retrait, démarrage).
     */
    public void broadcastRouletteUpdate(Roulette roulette, String event) {
        if (roulette.getGroup() == null) return;
        UUID groupId = roulette.getGroup().getId();

        List<RouletteUpdateMessage.SegmentInfo> segInfos = roulette.getSegments().stream()
                .map(s -> new RouletteUpdateMessage.SegmentInfo(
                        s.getId(),
                        s.getLabel(),
                        s.getColor(),
                        s.getPosition(),
                        s.getProposedBy() != null ? s.getProposedBy().getId() : null,
                        s.getProposedBy() != null ? s.getProposedBy().getName() : null
                ))
                .toList();

        RouletteUpdateMessage msg = new RouletteUpdateMessage(
                roulette.getId(),
                groupId,
                event,
                roulette.getName(),
                roulette.getStatus().name(),
                segInfos,
                Instant.now()
        );

        messagingTemplate.convertAndSend(rouletteTopic(groupId), msg);
        log.debug("Roulette update broadcasté → {} (event={})", rouletteTopic(groupId), event);
    }

    /**
     * Diffuse le résultat d'un spin à tous les membres du groupe.
     * Tous reçoivent le même serverAngle et animent simultanément.
     */
    public void broadcastSpinResult(UUID groupId, SpinSyncMessage message) {
        // Broadcast au topic groupe (overlay sur la page groupe)
        messagingTemplate.convertAndSend(spinTopic(groupId), message);
        // Broadcast au topic roulette (animation directe sur la page roulette)
        messagingTemplate.convertAndSend(rouletteSpinTopic(message.rouletteId()), message);
        log.debug("Spin sync broadcasté → {} et {} (angle={})",
                spinTopic(groupId), rouletteSpinTopic(message.rouletteId()), message.serverAngle());
    }

    // ─── Calcul des résultats ─────────────────────────────────────────────────

    public List<LiveVoteUpdate.OptionResult> computeOptionResults(
            List<VoteOption> options, List<Vote> votes, VoteMode mode) {

        // Regrouper les votes par option
        Map<UUID, List<Vote>> votesByOption = new HashMap<>();
        for (VoteOption opt : options) votesByOption.put(opt.getId(), new ArrayList<>());
        for (Vote v : votes) votesByOption.computeIfAbsent(v.getOption().getId(), k -> new ArrayList<>()).add(v);

        // Score total pour calculer les pourcentages
        double totalScore = switch (mode) {
            case MAJORITY  -> votesByOption.values().stream().mapToLong(List::size).sum();
            case APPROVAL  -> votesByOption.values().stream().mapToLong(List::size).sum();
            case POINTS    -> votes.stream().mapToInt(Vote::getPoints).sum();
        };

        List<LiveVoteUpdate.OptionResult> results = new ArrayList<>();
        for (VoteOption opt : options) {
            List<Vote> optVotes = votesByOption.getOrDefault(opt.getId(), List.of());
            int count      = optVotes.size();
            int totalPts   = optVotes.stream().mapToInt(Vote::getPoints).sum();

            double score   = (mode == VoteMode.POINTS) ? totalPts : count;
            BigDecimal pct = totalScore > 0
                    ? BigDecimal.valueOf((score / totalScore) * 100).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            results.add(new LiveVoteUpdate.OptionResult(opt.getId(), opt.getLabel(), count, totalPts, pct));
        }
        return results;
    }

    /**
     * Trouve les options ex-aequo (score maximum partagé).
     */
    public List<VoteOption> findTiedOptions(VoteSession session, List<Vote> votes) {
        List<LiveVoteUpdate.OptionResult> results =
                computeOptionResults(session.getOptions(), votes, session.getMode());

        double maxScore = switch (session.getMode()) {
            case POINTS   -> results.stream().mapToDouble(r -> r.totalPoints()).max().orElse(0);
            default       -> results.stream().mapToDouble(r -> r.voteCount()).max().orElse(0);
        };

        List<UUID> tiedIds = results.stream()
                .filter(r -> {
                    double score = (session.getMode() == VoteMode.POINTS) ? r.totalPoints() : r.voteCount();
                    return score == maxScore && maxScore > 0;
                })
                .map(LiveVoteUpdate.OptionResult::optionId)
                .toList();

        return session.getOptions().stream()
                .filter(o -> tiedIds.contains(o.getId()))
                .toList();
    }
}
