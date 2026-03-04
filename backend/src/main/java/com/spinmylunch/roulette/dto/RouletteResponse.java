package com.spinmylunch.roulette.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.spinmylunch.domain.roulette.RouletteMode;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record RouletteResponse(
        UUID id,
        UUID groupId,
        UUID creatorId,
        String creatorName,
        String name,
        RouletteMode mode,
        boolean isSurpriseMode,
        List<SegmentResponse> segments,

        @JsonFormat(shape = JsonFormat.Shape.STRING)
        Instant createdAt
) {
    public record SegmentResponse(
            UUID   id,
            String label,
            BigDecimal weight,
            String color,
            int    position
    ) {}
}
