package com.spinmylunch.domain.roulette;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface SpinResultRepository extends JpaRepository<SpinResult, UUID> {

    @Query(value = """
            SELECT sr FROM SpinResult sr
            JOIN FETCH sr.winningSegment
            JOIN FETCH sr.spunBy
            WHERE sr.roulette.id = :rouletteId
            ORDER BY sr.createdAt DESC
            """,
            countQuery = "SELECT COUNT(sr) FROM SpinResult sr WHERE sr.roulette.id = :rouletteId")
    Page<SpinResult> findByRouletteId(@Param("rouletteId") UUID rouletteId, Pageable pageable);

    long countBySpunById(UUID userId);

    @Query("SELECT sr.winningSegment.label, COUNT(sr) FROM SpinResult sr WHERE sr.spunBy.id = :userId GROUP BY sr.winningSegment.label ORDER BY COUNT(sr) DESC")
    List<Object[]> findTopLabelsByUser(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT sr.winningSegment.label, COUNT(sr) FROM SpinResult sr WHERE sr.group.id = :groupId GROUP BY sr.winningSegment.label ORDER BY COUNT(sr) DESC")
    List<Object[]> findTopLabelsByGroup(@Param("groupId") UUID groupId, Pageable pageable);

    @Query("SELECT COUNT(sr) FROM SpinResult sr WHERE sr.group.id = :groupId")
    long countByGroupId(@Param("groupId") UUID groupId);

    void deleteByRouletteId(UUID rouletteId);

    void deleteByWinningSegmentId(UUID winningSegmentId);
}
