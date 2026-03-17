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
import com.spinmylunch.domain.roulette.RouletteStatus;
import com.spinmylunch.domain.roulette.Segment;
import com.spinmylunch.domain.roulette.SegmentRepository;
import com.spinmylunch.domain.user.User;
import com.spinmylunch.domain.vote.*;
import com.spinmylunch.gamification.service.GamificationService;
import com.spinmylunch.vote.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

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
    private final SegmentRepository       segmentRepository;
    private final GamificationService     gamificationService;
    private final VoteNotificationService notificationService;
    private final RateLimitService        rateLimitService;

    private static final String[] TIEBREAKER_COLORS = {
        "#FF6B35","#FFD700","#7C3AED","#06B6D4",
        "#10B981","#F59E0B","#EF4444","#8B5CF6",
    };

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

        boolean hasPredefinedOptions = req.options() != null && req.options().size() >= 2;
        VoteStatus initialStatus = hasPredefinedOptions ? VoteStatus.ACTIVE : VoteStatus.PENDING;

        VoteSession session = voteSessionRepository.save(
                VoteSession.builder()
                        .group(group)
                        .roulette(roulette)
                        .mode(req.mode())
                        .status(initialStatus)
                        .quorumPercent(req.quorumPercent())
                        .timeoutAt(req.timeoutAt())
                        .build()
        );

        // Créer les options si fournies
        if (hasPredefinedOptions) {
            List<VoteOption> options = new ArrayList<>();
            for (var optReq : req.options()) {
                Segment segment = null;
                if (optReq.segmentId() != null) {
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
        }

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

    // ─── Ajout de proposition (phase PENDING) ────────────────────────────────

    @Transactional
    public VoteSessionResponse addProposal(UUID sessionId, String label, User user) {
        VoteSession session = voteSessionRepository.findByIdWithOptions(sessionId)
                .orElseThrow(() -> AppException.of(ErrorCode.VOTE_SESSION_NOT_FOUND));
        if (session.getStatus() != VoteStatus.PENDING) {
            throw AppException.of(ErrorCode.VOTE_NOT_PENDING);
        }
        requireMember(session.getGroup().getId(), user.getId());

        VoteOption option = voteOptionRepository.save(VoteOption.builder()
                .session(session)
                .label(label.trim())
                .build());
        session.getOptions().add(option);

        notificationService.broadcastVoteUpdate(session, null);
        return toSessionResponse(session);
    }

    // ─── Démarrage du vote (PENDING → ACTIVE) ────────────────────────────────

    @Transactional
    public VoteSessionResponse startVote(UUID sessionId, User user) {
        VoteSession session = voteSessionRepository.findByIdWithOptions(sessionId)
                .orElseThrow(() -> AppException.of(ErrorCode.VOTE_SESSION_NOT_FOUND));
        if (session.getStatus() != VoteStatus.PENDING) {
            throw AppException.of(ErrorCode.VOTE_NOT_PENDING);
        }
        requireAdmin(session.getGroup().getId(), user.getId());
        if (session.getOptions().size() < 2) {
            throw AppException.of(ErrorCode.NOT_ENOUGH_PROPOSALS);
        }

        session.setStatus(VoteStatus.ACTIVE);
        voteSessionRepository.save(session);
        notificationService.broadcastVoteUpdate(session, null);

        log.info("Vote démarré pour session {} ({} propositions)", sessionId, session.getOptions().size());
        return toSessionResponse(session);
    }

    // ─── Sessions par groupe ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VoteSessionResponse> getByGroup(UUID groupId, User requester) {
        requireMember(groupId, requester.getId());
        return voteSessionRepository.findByGroupIdAllStatusesWithOptions(groupId)
                .stream()
                .map(this::toSessionResponse)
                .toList();
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
            // Ex-aequo → créer une roulette de départage que le groupe peut lancer
            winner = null;
            Roulette tiebreakerRoulette = createTiebreakerRoulette(session, tied);
            session.setTiebreakerRoulette(tiebreakerRoulette);
            log.info("Roulette de départage créée {} pour session {} ({} options ex-aequo)",
                    tiebreakerRoulette.getId(), session.getId(), tied.size());
        }

        voteSessionRepository.save(session);
        notificationService.broadcastVoteUpdate(session, winner);
        return buildLiveUpdate(session, winner);
    }

    /**
     * Crée et persiste une roulette de départage avec les options ex-aequo comme segments.
     */
    private Roulette createTiebreakerRoulette(VoteSession session, List<VoteOption> tied) {
        Roulette roulette = rouletteRepository.save(
                Roulette.builder()
                        .group(session.getGroup())
                        .creator(session.getGroup().getAdmin())
                        .name("Départage — " + tied.stream()
                                .map(VoteOption::getLabel)
                                .reduce((a, b) -> a + " vs " + b)
                                .orElse("Vote"))
                        .mode(RouletteMode.EQUAL)
                        .status(RouletteStatus.ACTIVE)
                        .isSurpriseMode(false)
                        .isTiebreakerRoulette(true)
                        .build()
        );

        for (int i = 0; i < tied.size(); i++) {
            segmentRepository.save(
                    Segment.builder()
                            .roulette(roulette)
                            .label(tied.get(i).getLabel())
                            .weight(BigDecimal.ONE)
                            .color(TIEBREAKER_COLORS[i % TIEBREAKER_COLORS.length])
                            .position(i)
                            .build()
            );
        }

        return roulette;
    }

    // ─── Validation vote ─────────────────────────────────────────────────────

    private void validateVoteConstraint(VoteSession session, User voter,
                                        VoteOption option, CastVoteRequest req) {
        // Un seul vote par session
        if (voteRepository.existsBySessionIdAndUserId(session.getId(), voter.getId())) {
            throw AppException.of(ErrorCode.ALREADY_VOTED);
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
                notificationService.computeOptionResults(session.getOptions(), votes);

        UUID tiebreakerRouletteId = session.getTiebreakerRoulette() != null
                ? session.getTiebreakerRoulette().getId() : null;

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
                tiebreakerRouletteId,
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
                session.getTiebreakerRoulette() != null ? session.getTiebreakerRoulette().getId() : null,
                session.getMode(),
                session.getStatus(),
                session.getQuorumPercent(),
                session.getTimeoutAt(),
                opts,
                session.getCreatedAt()
        );
    }
}
