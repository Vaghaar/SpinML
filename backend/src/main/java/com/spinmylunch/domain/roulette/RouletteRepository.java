package com.spinmylunch.domain.roulette;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RouletteRepository extends JpaRepository<Roulette, UUID> {

    @Query("SELECT r FROM Roulette r LEFT JOIN FETCH r.segments WHERE r.id = :id")
    Optional<Roulette> findByIdWithSegments(@Param("id") UUID id);

    List<Roulette> findByGroupIdOrderByCreatedAtDesc(UUID groupId);

    List<Roulette> findByCreatorIdOrderByCreatedAtDesc(UUID creatorId);
}
