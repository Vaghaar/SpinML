package com.spinmylunch.vote.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.spinmylunch.domain.vote.VoteMode;
import com.spinmylunch.domain.vote.VoteStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Message WebSocket diffusé sur /topic/group/{groupId}/vote après chaque vote.
 * Le frontend met à jour les barres animées en temps réel avec ces données.
 */
public record LiveVoteUpdate(
        UUID      sessionId,
        UUID      groupId,
        VoteMode  mode,
        VoteStatus status,

        List<OptionResult> results,

        int  totalVoters,           // nombre de votants distincts
        int  totalEligibleVoters,   // membres du groupe
        int  quorumPercent,

        /** Gagnant final — renseigné uniquement quand status == CLOSED et pas d'égalité */
        TiebreakerResult winner,

        /**
         * Roulette de départage — renseignée quand status == CLOSED et égalité.
         * Le frontend doit proposer de lancer cette roue.
         */
        UUID tiebreakerRouletteId,

        @JsonFormat(shape = JsonFormat.Shape.STRING)
        Instant updatedAt
) {
    public record OptionResult(
            UUID       optionId,
            String     label,
            int        voteCount,
            int        totalPoints,
            BigDecimal percentage     // 0.00 – 100.00
    ) {}

    /**
     * Résultat final (+ tiebreaker si ex-aequo).
     */
    public record TiebreakerResult(
            UUID   winningOptionId,
            String winningLabel,
            boolean wasTiebroken,             // mini-spin déclenché
            BigDecimal tiebreakerServerAngle  // angle du mini-spin (null si pas d'égalité)
    ) {}
}
