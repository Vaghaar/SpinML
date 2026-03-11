package com.spinmylunch.vote.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.spinmylunch.domain.vote.VoteMode;
import com.spinmylunch.domain.vote.VoteStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record VoteSessionResponse(
        UUID id,
        UUID groupId,
        UUID rouletteId,
        UUID tiebreakerRouletteId,
        VoteMode mode,
        VoteStatus status,
        int quorumPercent,

        @JsonFormat(shape = JsonFormat.Shape.STRING)
        Instant timeoutAt,

        List<VoteOptionResponse> options,

        @JsonFormat(shape = JsonFormat.Shape.STRING)
        Instant createdAt
) {
    public record VoteOptionResponse(
            UUID   id,
            String label,
            UUID   segmentId
    ) {}
}
