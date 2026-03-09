package com.spinmylunch.roulette.dto;

import com.spinmylunch.domain.roulette.RouletteMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;
import java.util.UUID;

public record CreateRouletteRequest(

        UUID groupId,   // optionnel — roulette personnelle si absent

        @NotBlank(message = "Le nom de la roulette est requis")
        @Size(min = 1, max = 255)
        String name,

        RouletteMode mode,

        boolean isSurpriseMode,

        // Null ou vide = roulette en collecte de propositions (groupId requis dans ce cas)
        // Pour une roulette personnelle : 2-20 segments requis
        @Valid
        @Size(max = 20, message = "Maximum 20 segments")
        List<SegmentDto> segments
) {
    public CreateRouletteRequest {
        if (mode == null) mode = RouletteMode.EQUAL;
    }
}
