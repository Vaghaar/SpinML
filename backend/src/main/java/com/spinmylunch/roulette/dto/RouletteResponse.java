package com.spinmylunch.roulette.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.spinmylunch.domain.roulette.RouletteMode;
import com.spinmylunch.domain.roulette.RouletteStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record RouletteResponse(
        UUID id,
        UUID groupId,
        UUID groupAdminId,
        UUID creatorId,
        String creatorName,
        String name,
        RouletteMode mode,
        RouletteStatus status,
        boolean isSurpriseMode,
        boolean isTiebreakerRoulette,
        List<SegmentResponse> segments,

        @JsonFormat(shape = JsonFormat.Shape.STRING)
        Instant createdAt
) {
    public record SegmentResponse(
            UUID   id,
            String label,
            BigDecimal weight,
            String color,
            int    position,
            UUID   proposedById,
            String proposedByName
    ) {}
}
