package com.spinmylunch.roulette.service;

import com.spinmylunch.common.exception.AppException;
import com.spinmylunch.common.exception.ErrorCode;
import com.spinmylunch.common.ratelimit.RateLimitService;
import com.spinmylunch.domain.gamification.Badge;
import com.spinmylunch.domain.group.Group;
import com.spinmylunch.domain.group.GroupMemberRepository;
import com.spinmylunch.domain.group.GroupRepository;
import com.spinmylunch.domain.roulette.*;
import com.spinmylunch.domain.user.User;
import com.spinmylunch.domain.user.UserRepository;
import com.spinmylunch.gamification.service.GamificationService;
import com.spinmylunch.roulette.dto.*;
import com.spinmylunch.vote.dto.SpinSyncMessage;
import com.spinmylunch.vote.service.VoteNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RouletteService {

    // Palette par défaut — 20 couleurs pour 20 segments max
    private static final String[] DEFAULT_COLORS = {
        "#FF6B35","#FFD700","#7C3AED","#00B894","#FD79A8",
        "#0984E3","#E17055","#6C5CE7","#00CEC9","#A29BFE",
        "#55EFC4","#FDCB6E","#E84393","#74B9FF","#81ECEC",
        "#FAB1A0","#636E72","#B2BEC3","#74B9FF","#2D3436"
    };

    private final RouletteRepository    rouletteRepository;
    private final SegmentRepository     segmentRepository;
    private final SpinResultRepository  spinResultRepository;
    private final GroupRepository       groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository        userRepository;
    private final SpinService             spinService;
    private final GamificationService     gamificationService;
    private final RateLimitService        rateLimitService;
    private final VoteNotificationService notificationService;

    // ─── Créer ───────────────────────────────────────────────────────────────

    @Transactional
    public RouletteResponse create(CreateRouletteRequest req, User creator) {
        Group group = null;
        if (req.groupId() != null) {
            group = groupRepository.findById(req.groupId())
                    .orElseThrow(() -> AppException.of(ErrorCode.GROUP_NOT_FOUND));
            requireGroupMember(group.getId(), creator.getId());
        }

        Roulette roulette = Roulette.builder()
                .group(group)
                .creator(creator)
                .name(req.name())
                .mode(req.mode())
                .isSurpriseMode(req.isSurpriseMode())
                .build();

        roulette = rouletteRepository.save(roulette);
        buildSegments(roulette, req.segments());

        // Gamification : +20 XP à la création
        gamificationService.awardXpAndCheckBadges(
                creator, GamificationService.XP_CREATE_ROULETTE, null);

        return toResponse(roulette);
    }

    // ─── Lister mes roulettes ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RouletteResponse> getMyRoulettes(User user) {
        return rouletteRepository.findByCreatorIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toResponse).toList();
    }

    // ─── Supprimer ────────────────────────────────────────────────────────────

    @Transactional
    public void delete(UUID id, User requester) {
        Roulette roulette = rouletteRepository.findById(id)
                .orElseThrow(() -> AppException.of(ErrorCode.ROULETTE_NOT_FOUND));
        if (!roulette.getCreator().getId().equals(requester.getId())) {
            throw AppException.of(ErrorCode.FORBIDDEN);
        }
        rouletteRepository.delete(roulette);
    }

    // ─── Lire ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public RouletteResponse getById(UUID id, User requester) {
        Roulette roulette = findWithSegments(id);
        requireReadAccess(roulette, requester);
        return toResponse(roulette);
    }

    // ─── Modifier ────────────────────────────────────────────────────────────

    @Transactional
    public RouletteResponse update(UUID id, UpdateRouletteRequest req, User requester) {
        Roulette roulette = findWithSegments(id);
        requireWriteAccess(roulette, requester);

        if (req.name() != null)           roulette.setName(req.name());
        if (req.mode() != null)           roulette.setMode(req.mode());
        if (req.isSurpriseMode() != null) roulette.setSurpriseMode(req.isSurpriseMode());

        if (req.segments() != null) {
            roulette.getSegments().clear();
            buildSegments(roulette, req.segments());
        }

        return toResponse(rouletteRepository.save(roulette));
    }

    // ─── Spin ────────────────────────────────────────────────────────────────

    @Transactional
    public SpinResponse spin(UUID rouletteId, User user) {
        // Rate limiting : 10 spins/min
        rateLimitService.checkAndIncrementSpins(user.getId());

        Roulette roulette = findWithSegments(rouletteId);
        requireReadAccess(roulette, user);

        List<Segment> segments = roulette.getSegments();
        if (segments.isEmpty()) {
            throw AppException.of(ErrorCode.VALIDATION_ERROR, "La roulette n'a pas de segments");
        }

        // Calcul serveur : segment gagnant + angle
        SpinService.SpinResult spinResult = spinService.computeSpin(segments, roulette.getMode());

        // Persister le résultat
        com.spinmylunch.domain.roulette.SpinResult saved = spinResultRepository.save(
                com.spinmylunch.domain.roulette.SpinResult.builder()
                        .roulette(roulette)
                        .group(roulette.getGroup())
                        .winningSegment(spinResult.winner())
                        .serverAngle(spinResult.serverAngle())
                        .spunBy(user)
                        .build()
        );

        // Gamification : +10 XP, vérifier badges spin
        long totalSpins = spinResultRepository.countBySpunById(user.getId());
        String badgeCode = gamificationService.resolveSpinBadge(totalSpins);

        GamificationService.BadgeResult badgeResult =
                gamificationService.awardXpAndCheckBadges(user, GamificationService.XP_SPIN, badgeCode);

        // Construire la réponse
        SpinResponse.BadgeUnlocked badgeUnlocked = null;
        if (badgeResult != null) {
            Badge b = badgeResult.badge();
            badgeUnlocked = new SpinResponse.BadgeUnlocked(b.getCode(), b.getName(), b.getIconUrl());
        }

        SpinResponse spinResponse = new SpinResponse(
                saved.getId(),
                spinResult.winner().getId(),
                spinResult.winner().getLabel(),
                spinResult.winner().getColor(),
                spinResult.serverAngle(),
                GamificationService.XP_SPIN,
                badgeUnlocked,
                saved.getCreatedAt()
        );

        // Broadcast WebSocket à tous les membres du groupe (spin synchronisé)
        if (roulette.getGroup() != null) {
            SpinSyncMessage syncMsg = new SpinSyncMessage(
                    roulette.getId(),
                    saved.getId(),
                    spinResult.winner().getId(),
                    spinResult.winner().getLabel(),
                    spinResult.winner().getColor(),
                    spinResult.serverAngle(),
                    user.getId(),
                    user.getName(),
                    saved.getCreatedAt()
            );
            notificationService.broadcastSpinResult(roulette.getGroup().getId(), syncMsg);
        }

        return spinResponse;
    }

    // ─── Historique ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SpinHistoryResponse getHistory(UUID rouletteId, int page, int size, User requester) {
        Roulette roulette = findWithSegments(rouletteId);
        requireReadAccess(roulette, requester);

        Page<com.spinmylunch.domain.roulette.SpinResult> pageResult =
                spinResultRepository.findByRouletteId(rouletteId, PageRequest.of(page, size));

        List<SpinHistoryResponse.SpinEntry> entries = pageResult.getContent().stream()
                .map(sr -> new SpinHistoryResponse.SpinEntry(
                        sr.getId(),
                        sr.getWinningSegment().getId(),
                        sr.getWinningSegment().getLabel(),
                        sr.getWinningSegment().getColor(),
                        sr.getSpunBy().getName(),
                        sr.getCreatedAt()
                ))
                .toList();

        return new SpinHistoryResponse(
                entries,
                (int) pageResult.getTotalElements(),
                pageResult.getTotalPages(),
                page
        );
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Roulette findWithSegments(UUID id) {
        return rouletteRepository.findByIdWithSegments(id)
                .orElseThrow(() -> AppException.of(ErrorCode.ROULETTE_NOT_FOUND));
    }

    private void requireReadAccess(Roulette roulette, User user) {
        boolean isCreator = roulette.getCreator().getId().equals(user.getId());
        boolean isMember  = roulette.getGroup() == null ||
                groupMemberRepository.existsByGroupIdAndUserId(roulette.getGroup().getId(), user.getId());
        if (!isCreator && !isMember) {
            throw AppException.of(ErrorCode.FORBIDDEN);
        }
    }

    private void requireWriteAccess(Roulette roulette, User user) {
        boolean isCreator = roulette.getCreator().getId().equals(user.getId());
        boolean isAdmin   = roulette.getGroup() != null &&
                groupMemberRepository.findAdminMembership(roulette.getGroup().getId(), user.getId()).isPresent();
        if (!isCreator && !isAdmin) {
            throw AppException.of(ErrorCode.FORBIDDEN);
        }
    }

    private void requireGroupMember(UUID groupId, UUID userId) {
        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw AppException.of(ErrorCode.FORBIDDEN, "Vous n'êtes pas membre de ce groupe");
        }
    }

    private void buildSegments(Roulette roulette, List<SegmentDto> dtos) {
        List<Segment> segments = new ArrayList<>();
        for (int i = 0; i < dtos.size(); i++) {
            SegmentDto dto = dtos.get(i);
            String color = (dto.color() != null) ? dto.color() : DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            BigDecimal weight = (dto.weight() != null) ? dto.weight() : BigDecimal.ONE;

            segments.add(segmentRepository.save(
                    Segment.builder()
                            .roulette(roulette)
                            .label(dto.label())
                            .weight(weight)
                            .color(color)
                            .position(i)
                            .build()
            ));
        }
        roulette.getSegments().addAll(segments);
    }

    private RouletteResponse toResponse(Roulette r) {
        List<RouletteResponse.SegmentResponse> segs = r.getSegments().stream()
                .map(s -> new RouletteResponse.SegmentResponse(
                        s.getId(), s.getLabel(), s.getWeight(), s.getColor(), s.getPosition()))
                .toList();

        return new RouletteResponse(
                r.getId(),
                r.getGroup() != null ? r.getGroup().getId() : null,
                r.getCreator().getId(),
                r.getCreator().getName(),
                r.getName(),
                r.getMode(),
                r.isSurpriseMode(),
                segs,
                r.getCreatedAt()
        );
    }
}
