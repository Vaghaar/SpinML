package com.spinmylunch.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByGoogleId(String googleId);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    /** Utilisateurs inactifs depuis N mois (pour anonymisation RGPD planifiée) */
    @Query("SELECT u FROM User u WHERE u.lastActiveAt < :cutoff OR (u.lastActiveAt IS NULL AND u.createdAt < :cutoff)")
    List<User> findInactiveBefore(@Param("cutoff") Instant cutoff);

    /** Anonymise un utilisateur : efface PII, conserve les statistiques agrégées */
    @Modifying
    @Query("""
            UPDATE User u SET
              u.googleId   = CONCAT('anon_', CAST(u.id AS string)),
              u.email      = CONCAT('anon_', CAST(u.id AS string), '@deleted.invalid'),
              u.name       = 'Utilisateur supprimé',
              u.pictureUrl = NULL
            WHERE u.id = :id
            """)
    void anonymize(@Param("id") UUID id);
}
