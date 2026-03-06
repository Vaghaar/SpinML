package com.spinmylunch.vote.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProposeRequest(
        @NotBlank(message = "La proposition ne peut pas être vide")
        @Size(max = 255)
        String label
) {}
