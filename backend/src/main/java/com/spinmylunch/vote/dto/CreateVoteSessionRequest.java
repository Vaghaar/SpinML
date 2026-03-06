package com.spinmylunch.vote.dto;

import com.spinmylunch.domain.vote.VoteMode;
import jakarta.validation.constraints.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CreateVoteSessionRequest(

        @NotNull(message = "L'identifiant du groupe est requis")
        UUID groupId,

        UUID rouletteId,   // optionnel — lie le vote à une roulette existante

        VoteMode mode,

        @Size(max = 20)
        List<VoteOptionRequest> options,   // null = session PENDING (propositions collectives)

        @Min(1) @Max(100)
        Integer quorumPercent,

        Instant timeoutAt   // null = pas de timeout automatique
) {
    public CreateVoteSessionRequest {
        if (mode == null)          mode = VoteMode.MAJORITY;
        if (quorumPercent == null) quorumPercent = 50;
        if (options == null)       options = List.of();
    }

    public record VoteOptionRequest(
            @NotBlank String label,
            UUID segmentId   // optionnel — lier à un segment de roulette
    ) {}
}
