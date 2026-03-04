package com.spinmylunch.domain.vote;

public enum VoteStatus {
    PENDING,   // créée, pas encore ouverte
    ACTIVE,    // ouverte — les votes sont acceptés
    CLOSED     // terminée — résultats définitifs
}
