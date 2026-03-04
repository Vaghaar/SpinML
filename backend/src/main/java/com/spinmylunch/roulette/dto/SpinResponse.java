package com.spinmylunch.roulette.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Résultat d'un spin calculé côté serveur.
 * Le client anime la roue jusqu'à serverAngle — il ne calcule pas lui-même le résultat.
 */
public record SpinResponse(
        UUID spinResultId,
        UUID winningSegmentId,
        String winningLabel,
        String winningColor,

        /** Angle final en degrés (inclut les rotations complètes + position cible). */
        BigDecimal serverAngle,

        /** XP gagné lors de ce spin. */
        int xpEarned,

        /** Badge débloqué par ce spin (null si aucun). */
        BadgeUnlocked badgeUnlocked,

        @JsonFormat(shape = JsonFormat.Shape.STRING)
        Instant spunAt
) {
    public record BadgeUnlocked(String code, String name, String iconUrl) {}
}
