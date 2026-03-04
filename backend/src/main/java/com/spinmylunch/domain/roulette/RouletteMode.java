package com.spinmylunch.domain.roulette;

public enum RouletteMode {
    /** Tous les segments ont la même probabilité (poids ignorés). */
    EQUAL,
    /** Probabilité proportionnelle au poids de chaque segment. */
    WEIGHTED,
    /** Poids aléatoires régénérés à chaque spin (imprévisible). */
    RANDOM
}
