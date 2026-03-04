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

        @NotNull
        @Size(min = 2, max = 20, message = "Une roulette doit avoir entre 2 et 20 segments")
        @Valid
        List<SegmentDto> segments
) {
    public CreateRouletteRequest {
        if (mode == null) mode = RouletteMode.EQUAL;
    }
}
