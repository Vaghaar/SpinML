package com.spinmylunch.roulette.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SpinHistoryResponse(
        List<SpinEntry> spins,
        int totalElements,
        int totalPages,
        int currentPage
) {
    public record SpinEntry(
            UUID   spinResultId,
            UUID   winningSegmentId,
            String winningLabel,
            String winningColor,
            String spunByName,

            @JsonFormat(shape = JsonFormat.Shape.STRING)
            Instant spunAt
    ) {}
}
