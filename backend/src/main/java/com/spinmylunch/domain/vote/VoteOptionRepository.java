package com.spinmylunch.domain.vote;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VoteOptionRepository extends JpaRepository<VoteOption, UUID> {

    List<VoteOption> findBySessionId(UUID sessionId);
}
