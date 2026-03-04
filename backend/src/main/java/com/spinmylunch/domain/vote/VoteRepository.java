package com.spinmylunch.domain.vote;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface VoteRepository extends JpaRepository<Vote, UUID> {

    List<Vote> findBySessionId(UUID sessionId);

    List<Vote> findBySessionIdAndOptionId(UUID sessionId, UUID optionId);

    boolean existsBySessionIdAndUserId(UUID sessionId, UUID userId);

    /** Nombre de votants distincts pour une session. */
    @Query("SELECT COUNT(DISTINCT v.user.id) FROM Vote v WHERE v.session.id = :sessionId")
    long countDistinctVotersBySessionId(@Param("sessionId") UUID sessionId);

    /** Vérifie si un utilisateur a déjà voté pour une option donnée dans MAJORITY mode. */
    boolean existsBySessionIdAndUserIdAndOptionId(UUID sessionId, UUID userId, UUID optionId);

    /** Total de votes castés par un utilisateur. */
    @Query("SELECT COUNT(v) FROM Vote v WHERE v.user.id = :userId")
    long countByUserId(@Param("userId") UUID userId);
}
