package com.spinmylunch.auth.dto;

/**
 * Données utilisateur reçues depuis l'API Google OAuth2.
 */
public record GoogleUserInfo(
        String sub,         // Google user ID unique
        String email,
        boolean emailVerified,
        String name,
        String picture,
        String givenName,
        String familyName
) {}
