package com.spinmylunch.domain.vote;

public enum VoteMode {
    /** Chaque membre vote pour une seule option — la plus votée gagne. */
    MAJORITY,
    /** Chaque membre peut approuver plusieurs options — celle avec le plus d'approbations gagne. */
    APPROVAL,
    /** Chaque membre distribue des points entre les options (somme libre). */
    POINTS
}
