package com.spinmylunch.domain.roulette;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SegmentRepository extends JpaRepository<Segment, UUID> {

    List<Segment> findByRouletteIdOrderByPositionAsc(UUID rouletteId);
}
