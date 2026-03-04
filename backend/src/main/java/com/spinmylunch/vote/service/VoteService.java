package com.spinmylunch.vote.service;

import com.spinmylunch.common.exception.AppException;
import com.spinmylunch.common.exception.ErrorCode;
import com.spinmylunch.common.ratelimit.RateLimitService;
import com.spinmylunch.domain.group.Group;
import com.spinmylunch.domain.group.GroupMemberRepository;
import com.spinmylunch.domain.group.GroupRepository;
import com.spinmylunch.domain.roulette.Roulette;
import com.spinmylunch.domain.roulette.RouletteMode;
import com.spinmylunch.domain.roulette.RouletteRepository;
import com.spinmylunch.domain.roulette.Segment;
import com.spinmylunch.domain.user.User;
import com.spinmylunch.domain.user.UserRepository;
import com.spinmylunch.domain.vote.*;
import com.spinmylunch.gamification.service.GamificationService;
import com.spinmylunch.roulette.service.SpinService;
import com.spinmylunch.vote.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class VoteService {

    private final VoteSessionRepository   voteSessionRepository;
    private final VoteOptionRepository    voteOptionRepository;
    private final VoteRepository          voteRepository;
    private final GroupRepository         groupRepository;
    private final GroupMemberRepository   groupMemberRepository;
    private final RouletteRepository      rouletteRepository;
    private final UserRepository          userRepository;
    private final SpinService             spinService;
    private final GamificationService     gamificationService;
    private final VoteNotificationService notificationService;
    private final RateLimitService        rateLimitService;

    // ─── Créer une session de vote ────────────────────────────────────────────

    @Transactional
    public VoteSessionResponse createSession(CreateVoteSessionRequest req, User creator) {
        rateLimitService.checkAndIncrementVoteSessions(creator.getId());

        Group group = groupRepository.findById(req.groupId())
                .orElseThrow(() -> AppException.of(ErrorCode.GROUP_NOT_FOUND));
        requireMember(group.getId(), creator.getId());

        Roulette roulette = null;
        if (req.rouletteId() != null) {
            roulette = rouletteRepository.findById(req.rouletteId())
                    .orElseThrow(() -> AppException.of(ErrorCode.ROULETTE_NOT_FOUND));
        }

        VoteSession session = voteSessionRepository.save(
                VoteSession.builder()
                        .group(group)
                        .roulette(roulette)
                        .mode(req.mode())
                        .status(VoteStatus.ACTIVE)
                        .quorumPercent(req.quorumPercent())
                        .timeoutAt(req.timeoutAt())
                        .build()
        );

        // Créer les options
        List<VoteOption> options = new ArrayList<>();
        for (var optReq : req.options()) {
            Segment segment = null;
            if (optReq.segmentId() != null) {
                // Lier à un segment existant si fourni
                segment = roulette != null
                        ? roulette.getSegments().stream()
                              .filter(s -> s.getId().equals(optReq.segmentId()))
                              .findFirst().orElse(null)
                        : null;
            }
            options.add(voteOptionRepository.save(
                    VoteOption.builder()
                            .session(session)
                            .label(optReq.label())
                            .segment(segment)
                            .build()
            ));
        }
        session.getOptions().addAll(options);

        return toSessionResponse(session);
    }

    // ─── Voter ────────────────────────────────────────────────────────────────

    @Transactional
    public LiveVoteUpdate castVote(UUID sessionId, CastVoteRequest req, User voter) {
        VoteSession session = findActiveSession(sessionId);
        requireMember(session.getGroup().getId(), voter.getId());

        VoteOption option = voteOptionRepository.findById(req.optionId())
                .filter(o -> o.getSession().getId().equals(sessionId))
                .orElseThrow(() -> AppException.of(ErrorCode.VALIDATION_ERROR,
                        "Option introuvable dans cette session"));

        validateVoteConstraint(session, voter, option, req);

        voteRepository.save(Vote.builder()
                .session(session)
                .option(option)
                .user(voter)
                .points(req.points())
                .build());

        // Gamification : +5 XP
        gamificationService.awardXpAndCheckBadges(voter, GamificationService.XP_VOTE, null);

        // Vérifier si le quorum est atteint → fermeture automatique
        checkAndCloseIfQuorumReached(session);

        // Broadcast les résultats mis à jour
        notificationService.broadcastVoteUpdate(session, null);

        return buildLiveUpdate(session, null);
    }

    // ─── Résultats ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public LiveVoteUpdate getResults(UUID sessionId, User requester) {
        VoteSession session = voteSessionRepository.findByIdWithOptions(sessionId)
                .orElseThrow(() -> AppException.of(ErrorCode.VOTE_SESSION_NOT_FOUND));
        requireMember(session.getGroup().getId(), requester.getId());
        return buildLiveUpdate(session, null);
    }

    // ─── Fermeture manuelle ───────────────────────────────────────────────────

    @Transactional
    public LiveVoteUpdate closeSession(UUID sessionId, User requester) {
        VoteSession session = findActiveSession(sessionId);
        requireAdmin(session.getGroup().getId(), requester.getId());
        return closeAndAnnounceWinner(session);
    }

    // ─── Tâche planifiée : auto-close des sessions expirées ──────────────────

    @Scheduled(fixedDelay = 30_000) // toutes les 30 secondes
    @Transactional
    public void autoCloseExpiredSessions() {
        List<VoteSession> expired = voteSessionRepository.findExpiredActiveSessions(Instant.now());
        for (VoteSession session : expired) {
            log.info("Session de vote expirée, fermeture automatique : {}", session.getId());
            closeAndAnnounceWinner(session);
        }
    }

    // ─── Fermeture + tiebreaker ───────────────────────────────────────────────

    private LiveVoteUpdate closeAndAnnounceWinner(VoteSession session) {
        session.setStatus(VoteStatus.CLOSED);
        voteSessionRepository.save(session);

        List<Vote> votes = voteRepository.findBySessionId(session.getId());
        List<VoteOption> tied = notificationService.findTiedOptions(session, votes);

        LiveVoteUpdate.TiebreakerResult winner;

        if (tied.isEmpty()) {
            // Aucun vote du tout — pas de gagnant
            winner = null;

        } else if (tied.size() == 1) {
            // Gagnant clair
            winner = new LiveVoteUpdate.TiebreakerResult(
                    tied.get(0).getId(), tied.get(0).getLabel(), false, null);

        } else {
            // Ex-aequo → mini-spin automatique entre les options à égalité
            winner = resolveTieWithSpin(tied);
            log.info("Tiebreaker déclenché entre {} options pour session {}",
                    tied.size(), session.getId());
        }

        notificationService.broadcastVoteUpdate(session, winner);
        return buildLiveUpdate(session, winner);
    }

    /**
     * Mini-spin automatique entre les options ex-aequo.
     * Crée des Segments temporaires (non persistés) depuis les VoteOptions.
     */
    private LiveVoteUpdate.TiebreakerResult resolveTieWithSpin(List<VoteOption> tied) {
        // Créer des segments éphémères pour le spin (pondération égale)
        List<Segment> tempSegments = IntStream.range(0, tied.size())
                .mapToObj(i -> {
                    Segment s = new Segment();
                    s.setId(tied.get(i).getId()); // ID = ID de l'option pour mapping retour
                    s.setLabel(tied.get(i).getLabel());
                    s.setPosition(i);
                    java.math.BigDecimal one = java.math.BigDecimal.ONE;
                    s.setWeight(one);
                    s.setColor("#FF6B35");
                    return s;
                })
                .toList();

        SpinService.SpinResult spinResult = spinService.computeSpin(tempSegments, RouletteMode.EQUAL);
        Segment winnerSeg = spinResult.winner();

        // Retrouver l'option correspondante (ID = option ID)
        VoteOption winnerOption = tied.stream()
                .filter(o -> o.getId().equals(winnerSeg.getId()))
                .findFirst()
                .orElse(tied.get(0));

        return new LiveVoteUpdate.TiebreakerResult(
                winnerOption.getId(),
                winnerOption.getLabel(),
                true,
                spinResult.serverAngle()
        );
    }

    // ─── Validation vote ─────────────────────────────────────────────────────

    private void validateVoteConstraint(VoteSession session, User voter,
                                        VoteOption option, CastVoteRequest req) {
        switch (session.getMode()) {
            case MAJORITY -> {
                // Un seul vote par session
                if (voteRepository.existsBySessionIdAndUserId(session.getId(), voter.getId())) {
                    throw AppException.of(ErrorCode.ALREADY_VOTED);
                }
            }
            case APPROVAL -> {
                // Un vote par option (mais peut voter plusieurs options)
                if (voteRepository.existsBySessionIdAndUserIdAndOptionId(
                        session.getId(), voter.getId(), option.getId())) {
                    throw AppException.of(ErrorCode.ALREADY_VOTED,
                            "Vous avez déjà approuvé cette option");
                }
            }
            case POINTS -> {
                // Peut revoter / modifier — géré librement, pas de contrainte unique
            }
        }
    }

    // ─── Quorum ──────────────────────────────────────────────────────────────

    private void checkAndCloseIfQuorumReached(VoteSession session) {
        int eligible    = groupMemberRepository.countByGroupId(session.getGroup().getId());
        long voters     = voteRepository.countDistinctVotersBySessionId(session.getId());
        double reached  = eligible > 0 ? (double) voters / eligible * 100 : 0;

        if (reached >= session.getQuorumPercent()) {
            log.info("Quorum atteint ({}/{}%) pour session {}", (int) reached,
                    session.getQuorumPercent(), session.getId());
            closeAndAnnounceWinner(session);
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private VoteSession findActiveSession(UUID sessionId) {
        VoteSession session = voteSessionRepository.findByIdWithOptions(sessionId)
                .orElseThrow(() -> AppException.of(ErrorCode.VOTE_SESSION_NOT_FOUND));
        if (!session.isActive()) {
            throw AppException.of(ErrorCode.VOTE_CLOSED);
        }
        if (session.isExpired()) {
            closeAndAnnounceWinner(session);
            throw AppException.of(ErrorCode.VOTE_CLOSED, "La session a expiré");
        }
        return session;
    }

    private void requireMember(UUID groupId, UUID userId) {
        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw AppException.of(ErrorCode.FORBIDDEN, "Vous n'êtes pas membre de ce groupe");
        }
    }

    private void requireAdmin(UUID groupId, UUID userId) {
        groupMemberRepository.findAdminMembership(groupId, userId)
                .orElseThrow(() -> AppException.of(ErrorCode.FORBIDDEN,
                        "Seul un admin peut fermer la session"));
    }

    private LiveVoteUpdate buildLiveUpdate(VoteSession session,
                                           LiveVoteUpdate.TiebreakerResult winner) {
        List<Vote> votes    = voteRepository.findBySessionId(session.getId());
        int totalVoters     = (int) voteRepository.countDistinctVotersBySessionId(session.getId());
        int eligible        = groupMemberRepository.countByGroupId(session.getGroup().getId());

        List<LiveVoteUpdate.OptionResult> results =
                notificationService.computeOptionResults(session.getOptions(), votes, session.getMode());

        return new LiveVoteUpdate(
                session.getId(),
                session.getGroup().getId(),
                session.getMode(),
                session.getStatus(),
                results,
                totalVoters,
                eligible,
                session.getQuorumPercent(),
                winner,
                Instant.now()
        );
    }

    private VoteSessionResponse toSessionResponse(VoteSession session) {
        List<VoteSessionResponse.VoteOptionResponse> opts = session.getOptions().stream()
                .map(o -> new VoteSessionResponse.VoteOptionResponse(
                        o.getId(), o.getLabel(),
                        o.getSegment() != null ? o.getSegment().getId() : null))
                .toList();

        return new VoteSessionResponse(
                session.getId(),
                session.getGroup().getId(),
                session.getRoulette() != null ? session.getRoulette().getId() : null,
                session.getMode(),
                session.getStatus(),
                session.getQuorumPercent(),
                session.getTimeoutAt(),
                opts,
                session.getCreatedAt()
        );
    }
}
