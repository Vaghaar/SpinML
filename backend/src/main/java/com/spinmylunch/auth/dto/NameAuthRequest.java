package com.spinmylunch.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NameAuthRequest(
        @NotBlank(message = "Le nom ne peut pas être vide")
        @Size(min = 1, max = 50, message = "Le nom doit faire entre 1 et 50 caractères")
        String name
) {}
