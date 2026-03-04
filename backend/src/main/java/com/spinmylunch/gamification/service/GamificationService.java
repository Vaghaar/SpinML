package com.spinmylunch.gamification.service;

import com.spinmylunch.domain.gamification.Badge;
import com.spinmylunch.domain.gamification.BadgeRepository;
import com.spinmylunch.domain.gamification.UserBadge;
import com.spinmylunch.domain.gamification.UserBadgeRepository;
import com.spinmylunch.domain.user.User;
import com.spinmylunch.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GamificationService {

    // XP par action
    public static final int XP_SPIN            = 10;
    public static final int XP_VOTE            = 5;
    public static final int XP_CREATE_ROULETTE = 20;
    public static final int XP_INVITE_ACCEPTED = 50;

    // Codes badge
    public static final String BADGE_FIRST_SPIN      = "FIRST_SPIN";
    public static final String BADGE_SPIN_MASTER      = "SPIN_MASTER";
    public static final String BADGE_STREAK_7         = "STREAK_7";
    public static final String BADGE_SOCIAL_BUTTERFLY = "SOCIAL_BUTTERFLY";
    public static final String BADGE_LEADER_SUPREME   = "LEADER_SUPREME";

    private final UserRepository    userRepository;
    private final BadgeRepository   badgeRepository;
    private final UserBadgeRepository userBadgeRepository;

    /**
     * Accorde des XP à l'utilisateur, met à jour son niveau et son streak.
     * Retourne le badge débloqué si une action en déclenche un (sinon null).
     */
    @Transactional
    public BadgeResult awardXpAndCheckBadges(User user, int xp, String triggerBadgeCode) {
        // Streak
        updateStreak(user);

        // XP — bonus x2 si streak >= 7 jours
        int multiplier = user.getStreakCount() >= 7 ? 2 : 1;
        int actualXp   = xp * multiplier;
        user.addXp(actualXp);
        userRepository.save(user);

        // Badge déclenché par l'action
        BadgeResult badgeResult = null;
        if (triggerBadgeCode != null) {
            badgeResult = tryAwardBadge(user, triggerBadgeCode);
        }

        log.debug("XP +{} (×{}) → user={} level={} streak={}",
                actualXp, multiplier, user.getId(), user.getLevel(), user.getStreakCount());

        return badgeResult;
    }

    /**
     * Tente d'attribuer un badge à l'utilisateur.
     * Si déjà possédé, retourne null silencieusement.
     */
    @Transactional
    public BadgeResult tryAwardBadge(User user, String badgeCode) {
        if (userBadgeRepository.existsByUserIdAndBadgeCode(user.getId(), badgeCode)) {
            return null;
        }
        return badgeRepository.findByCode(badgeCode).map(badge -> {
            UserBadge ub = UserBadge.builder()
                    .user(user)
                    .badge(badge)
                    .build();
            userBadgeRepository.save(ub);
            log.info("Badge débloqué : {} pour user={}", badgeCode, user.getId());
            return new BadgeResult(badge);
        }).orElse(null);
    }

    /**
     * Détermine quel badge de spin vérifier selon le nombre total de spins.
     */
    public String resolveSpinBadge(long totalSpins) {
        if (totalSpins == 1)   return BADGE_FIRST_SPIN;
        if (totalSpins == 100) return BADGE_SPIN_MASTER;
        return null;
    }

    // ─── Streak ───────────────────────────────────────────────────────────────

    private void updateStreak(User user) {
        Instant now       = Instant.now();
        Instant lastActive = user.getLastActiveAt();

        if (lastActive == null) {
            user.setStreakCount(1);
            return;
        }

        long daysDiff = ChronoUnit.DAYS.between(
                lastActive.atZone(ZoneOffset.UTC).toLocalDate(),
                now.atZone(ZoneOffset.UTC).toLocalDate()
        );

        if (daysDiff == 0) {
            // Déjà actif aujourd'hui — pas de changement streak
        } else if (daysDiff == 1) {
            // Actif hier — incrémenter le streak
            user.setStreakCount(user.getStreakCount() + 1);
        } else {
            // Inactif plus d'un jour — reset
            user.setStreakCount(1);
        }
    }

    // ─── Value object ─────────────────────────────────────────────────────────

    public record BadgeResult(Badge badge) {}
}
