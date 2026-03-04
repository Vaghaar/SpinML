package com.spinmylunch.gamification.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ProfileResponse(
    UUID          userId,
    String        name,
    String        email,
    String        pictureUrl,
    int           level,
    int           xp,
    int           streakCount,
    List<BadgeDto> badges,
    long          totalSpins,
    long          totalVotes
) {
    public record BadgeDto(
        String  code,
        String  name,
        String  description,
        String  iconUrl,
        boolean unlocked,
        Instant unlockedAt
    ) {}
}
