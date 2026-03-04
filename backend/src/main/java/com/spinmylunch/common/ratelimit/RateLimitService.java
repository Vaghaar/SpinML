package com.spinmylunch.common.ratelimit;

import com.spinmylunch.common.exception.AppException;
import com.spinmylunch.common.exception.ErrorCode;
import com.spinmylunch.config.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * Rate limiting via compteurs Redis avec expiration automatique (sliding window).
 */
@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final AppProperties                 appProperties;

    /**
     * Vérifie et incrémente le compteur de spins (10/min par utilisateur).
     * Lance {@link AppException} si la limite est dépassée.
     */
    public void checkAndIncrementSpins(UUID userId) {
        checkLimit(
                "ratelimit:spin:" + userId,
                appProperties.rateLimit().spinsPerMinute(),
                Duration.ofMinutes(1),
                ErrorCode.SPIN_RATE_LIMIT
        );
    }

    /**
     * Vérifie et incrémente le compteur de requêtes générales (100/min).
     */
    public void checkAndIncrementRequests(UUID userId) {
        checkLimit(
                "ratelimit:req:" + userId,
                appProperties.rateLimit().requestsPerMinute(),
                Duration.ofMinutes(1),
                ErrorCode.SPIN_RATE_LIMIT
        );
    }

    /**
     * Vérifie et incrémente le compteur de sessions de vote (5/heure).
     */
    public void checkAndIncrementVoteSessions(UUID userId) {
        checkLimit(
                "ratelimit:vote_session:" + userId,
                appProperties.rateLimit().voteSessionsPerHour(),
                Duration.ofHours(1),
                ErrorCode.SPIN_RATE_LIMIT
        );
    }

    // ─── Implémentation : increment atomique Redis + TTL ─────────────────────

    private void checkLimit(String key, int maxRequests, Duration window, ErrorCode errorCode) {
        Long count = redisTemplate.opsForValue().increment(key);

        if (count != null && count == 1) {
            // Première requête dans la fenêtre — initialiser l'expiration
            redisTemplate.expire(key, window);
        }

        if (count != null && count > maxRequests) {
            throw AppException.of(errorCode);
        }
    }
}
