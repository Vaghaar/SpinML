package com.spinmylunch.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleAuthRequest(
        @NotBlank(message = "Le code d'autorisation Google est requis")
        String code,

        @NotBlank(message = "L'URI de redirection est requis")
        String redirectUri
) {}
