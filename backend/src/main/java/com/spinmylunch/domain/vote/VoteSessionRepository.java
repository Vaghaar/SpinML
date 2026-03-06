package com.spinmylunch.domain.vote;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VoteSessionRepository extends JpaRepository<VoteSession, UUID> {

    @Query("SELECT vs FROM VoteSession vs LEFT JOIN FETCH vs.options WHERE vs.id = :id")
    Optional<VoteSession> findByIdWithOptions(@Param("id") UUID id);

    List<VoteSession> findByGroupIdAndStatusOrderByCreatedAtDesc(UUID groupId, VoteStatus status);

    @Query("SELECT vs FROM VoteSession vs LEFT JOIN FETCH vs.options WHERE vs.group.id = :groupId ORDER BY vs.createdAt DESC")
    List<VoteSession> findByGroupIdAllStatusesWithOptions(@Param("groupId") UUID groupId);

    /** Sessions actives dont le timeout est dépassé (pour la tâche planifiée). */
    @Query("SELECT vs FROM VoteSession vs WHERE vs.status = 'ACTIVE' AND vs.timeoutAt < :now")
    List<VoteSession> findExpiredActiveSessions(@Param("now") Instant now);
}
