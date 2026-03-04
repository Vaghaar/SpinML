package com.spinmylunch.domain.roulette;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface SpinResultRepository extends JpaRepository<SpinResult, UUID> {

    @Query("""
            SELECT sr FROM SpinResult sr
            JOIN FETCH sr.winningSegment
            JOIN FETCH sr.spunBy
            WHERE sr.roulette.id = :rouletteId
            ORDER BY sr.createdAt DESC
            """)
    Page<SpinResult> findByRouletteId(@Param("rouletteId") UUID rouletteId, Pageable pageable);

    long countBySpunById(UUID userId);
}
