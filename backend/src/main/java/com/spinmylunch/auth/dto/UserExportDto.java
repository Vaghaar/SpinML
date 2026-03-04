package com.spinmylunch.auth.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.spinmylunch.domain.user.FoodAvatar;
import com.spinmylunch.domain.user.UserTheme;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Export RGPD complet des données utilisateur.
 * Retourné par GET /api/v1/auth/export
 */
public record UserExportDto(
        UUID   id,
        String email,
        String name,
        String pictureUrl,
        int    level,
        int    xp,
        int    streakCount,
        FoodAvatar  foodAvatarType,
        UserTheme   theme,
        Map<String, Object> preferences,

        @JsonFormat(shape = JsonFormat.Shape.STRING)
        Instant createdAt,

        @JsonFormat(shape = JsonFormat.Shape.STRING)
        Instant lastActiveAt,

        List<GroupMembership> groups,
        List<SpinHistory>     spins,
        List<VoteHistory>     votes,
        List<BadgeSummary>    badges
) {
    public record GroupMembership(UUID groupId, String groupName, String role,
                                  @JsonFormat(shape = JsonFormat.Shape.STRING) Instant joinedAt) {}

    public record SpinHistory(UUID rouletteId, String rouletteName,
                               String winningSegment,
                               @JsonFormat(shape = JsonFormat.Shape.STRING) Instant spunAt) {}

    public record VoteHistory(UUID sessionId,
                               @JsonFormat(shape = JsonFormat.Shape.STRING) Instant votedAt) {}

    public record BadgeSummary(String code, String name,
                                @JsonFormat(shape = JsonFormat.Shape.STRING) Instant earnedAt) {}
}
