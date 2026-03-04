package com.spinmylunch.vote.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CastVoteRequest(
        @NotNull(message = "L'identifiant de l'option est requis")
        UUID optionId,

        @Min(value = 0, message = "Les points doivent être >= 0")
        Integer points   // null pour MAJORITY/APPROVAL (défaut = 1)
) {
    public CastVoteRequest {
        if (points == null) points = 1;
    }
}
