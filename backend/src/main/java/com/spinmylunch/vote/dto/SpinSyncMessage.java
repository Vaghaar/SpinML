package com.spinmylunch.vote.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Message WebSocket diffusé sur /topic/group/{groupId}/spin
 * quand un utilisateur lance un spin.
 *
 * Tous les membres du groupe reçoivent ce message simultanément
 * et animent la roue jusqu'à serverAngle — même résultat pour tout le monde.
 */
public record SpinSyncMessage(
        UUID       rouletteId,
        UUID       spinResultId,
        UUID       winningSegmentId,
        String     winningLabel,
        String     winningColor,
        BigDecimal serverAngle,
        UUID       spunBy,
        String     spunByName,

        @JsonFormat(shape = JsonFormat.Shape.STRING)
        Instant spunAt
) {}
