package com.spinmylunch.roulette.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProposeSegmentRequest(
        @NotBlank(message = "Le label est requis")
        @Size(max = 255)
        String label
) {}
