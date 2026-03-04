package com.spinmylunch.domain.gamification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserBadgeRepository extends JpaRepository<UserBadge, UUID> {

    boolean existsByUserIdAndBadgeCode(UUID userId, String badgeCode);

    @Query("SELECT ub FROM UserBadge ub JOIN FETCH ub.badge WHERE ub.user.id = :userId")
    List<UserBadge> findByUserIdWithBadge(@Param("userId") UUID userId);

    Optional<UserBadge> findByUserIdAndBadgeId(UUID userId, UUID badgeId);
}
