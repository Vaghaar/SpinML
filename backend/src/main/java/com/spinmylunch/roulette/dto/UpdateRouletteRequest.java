package com.spinmylunch.roulette.dto;

import com.spinmylunch.domain.roulette.RouletteMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

public record UpdateRouletteRequest(

        @Size(min = 1, max = 255)
        String name,

        RouletteMode mode,

        Boolean isSurpriseMode,

        @Size(min = 2, max = 20, message = "Une roulette doit avoir entre 2 et 20 segments")
        @Valid
        List<SegmentDto> segments
) {}
