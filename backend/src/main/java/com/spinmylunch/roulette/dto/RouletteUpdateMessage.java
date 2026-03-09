package com.spinmylunch.roulette.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Message WebSocket diffusé sur /topic/group/{groupId}/roulette
 * quand un segment est proposé, retiré, ou quand la roulette est démarrée.
 */
public record RouletteUpdateMessage(
        UUID   rouletteId,
        UUID   groupId,
        String event,       // "PROPOSAL_ADDED" | "PROPOSAL_REMOVED" | "STARTED"
        String rouletteName,
        String status,
        List<SegmentInfo> segments,

        @JsonFormat(shape = JsonFormat.Shape.STRING)
        Instant updatedAt
) {
    public record SegmentInfo(
            UUID   id,
            String label,
            String color,
            int    position,
            UUID   proposedById,
            String proposedByName
    ) {}
}
