package com.spinmylunch.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    // Auth
    INVALID_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "Refresh token invalide"),
    EXPIRED_REFRESH_TOKEN(HttpStatus.UNAUTHORIZED, "Refresh token expiré"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Non authentifié"),

    // Ressources
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "Utilisateur introuvable"),
    GROUP_NOT_FOUND(HttpStatus.NOT_FOUND, "Groupe introuvable"),
    ROULETTE_NOT_FOUND(HttpStatus.NOT_FOUND, "Roulette introuvable"),
    VOTE_SESSION_NOT_FOUND(HttpStatus.NOT_FOUND, "Session de vote introuvable"),

    // Business
    FORBIDDEN(HttpStatus.FORBIDDEN, "Accès interdit"),
    GROUP_FULL(HttpStatus.CONFLICT, "Le groupe a atteint sa capacité maximale (50 membres)"),
    ALREADY_MEMBER(HttpStatus.CONFLICT, "Vous êtes déjà membre de ce groupe"),
    VOTE_CLOSED(HttpStatus.CONFLICT, "La session de vote est terminée"),
    VOTE_NOT_PENDING(HttpStatus.CONFLICT, "La session n'est pas en phase de propositions"),
    NOT_ENOUGH_PROPOSALS(HttpStatus.BAD_REQUEST, "Il faut au moins 2 propositions pour démarrer le vote"),
    ROULETTE_NOT_PENDING(HttpStatus.CONFLICT, "La roulette n'est pas en phase de propositions"),
    ROULETTE_NOT_ACTIVE(HttpStatus.CONFLICT, "La roulette n'est pas encore démarrée"),
    NOT_ENOUGH_SEGMENTS(HttpStatus.BAD_REQUEST, "Il faut au moins 2 segments pour démarrer la roulette"),
    ALREADY_VOTED(HttpStatus.CONFLICT, "Vous avez déjà voté pour cette option"),
    INVALID_INVITE_CODE(HttpStatus.BAD_REQUEST, "Code d'invitation invalide"),
    SPIN_RATE_LIMIT(HttpStatus.TOO_MANY_REQUESTS, "Trop de spins, réessayez dans une minute"),

    // Validation
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Erreur de validation"),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur interne du serveur");

    private final HttpStatus status;
    private final String     defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status         = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getStatus()         { return status;         }
    public String     getDefaultMessage() { return defaultMessage; }
}
