package com.spinmylunch.auth.service;

import com.spinmylunch.auth.dto.*;
import com.spinmylunch.common.exception.AppException;
import com.spinmylunch.common.exception.ErrorCode;
import com.spinmylunch.config.AppProperties;
import com.spinmylunch.domain.auth.RefreshToken;
import com.spinmylunch.domain.auth.RefreshTokenRepository;
import com.spinmylunch.domain.user.User;
import com.spinmylunch.domain.user.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    public static final String REFRESH_COOKIE_NAME = "refresh_token";

    private final GoogleOAuthService      googleOAuthService;
    private final JwtService              jwtService;
    private final UserRepository          userRepository;
    private final RefreshTokenRepository  refreshTokenRepository;
    private final AppProperties           appProperties;

    // ─── Google OAuth : connexion / inscription ────────────────────────────────

    @Transactional
    public AuthResponse loginWithGoogle(String code, String redirectUri,
                                        HttpServletResponse response) {
        GoogleUserInfo googleUser = googleOAuthService.fetchUserInfo(code, redirectUri);

        if (!googleUser.emailVerified()) {
            throw AppException.of(ErrorCode.EMAIL_NOT_VERIFIED);
        }

        User user = userRepository.findByGoogleId(googleUser.sub())
                .map(u -> updateUser(u, googleUser))
                .orElseGet(() -> createUser(googleUser));

        user.touch();
        user.addXp(0); // recalcul niveau sans bonus
        userRepository.save(user);

        return buildAuthResponse(user, response);
    }

    // ─── Refresh token ────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse refresh(String rawRefreshToken, HttpServletResponse response) {
        String hash = hash(rawRefreshToken);

        RefreshToken rt = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> AppException.of(ErrorCode.INVALID_REFRESH_TOKEN));

        if (rt.isExpired()) {
            refreshTokenRepository.delete(rt);
            throw AppException.of(ErrorCode.EXPIRED_REFRESH_TOKEN);
        }

        // Rotation : supprimer l'ancien, émettre un nouveau
        refreshTokenRepository.delete(rt);

        User user = rt.getUser();
        user.touch();
        userRepository.save(user);

        return buildAuthResponse(user, response);
    }

    // ─── Déconnexion ─────────────────────────────────────────────────────────

    @Transactional
    public void logout(String rawRefreshToken, HttpServletResponse response) {
        if (rawRefreshToken != null) {
            refreshTokenRepository.findByTokenHash(hash(rawRefreshToken))
                    .ifPresent(refreshTokenRepository::delete);
        }
        clearRefreshCookie(response);
    }

    // ─── Suppression de compte (RGPD) ─────────────────────────────────────────

    @Transactional
    public void deleteAccount(UUID userId, HttpServletResponse response) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.of(ErrorCode.USER_NOT_FOUND));

        // Supprimer tous les refresh tokens
        refreshTokenRepository.deleteAllByUserId(userId);

        // Supprimer le compte (cascade en BDD pour les données liées)
        userRepository.delete(user);

        clearRefreshCookie(response);
        log.info("Compte supprimé (RGPD) : userId={}", userId);
    }

    // ─── Export données (RGPD) ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public UserExportDto exportUserData(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.of(ErrorCode.USER_NOT_FOUND));

        // Les données liées seront chargées par des queries dédiées dans les futures étapes
        return new UserExportDto(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getPictureUrl(),
                user.getLevel(),
                user.getXp(),
                user.getStreakCount(),
                user.getFoodAvatarType(),
                user.getTheme(),
                user.getPreferencesJson(),
                user.getCreatedAt(),
                user.getLastActiveAt(),
                List.of(),  // groups — complété à l'étape 3
                List.of(),  // spins  — complété à l'étape 3
                List.of(),  // votes  — complété à l'étape 4
                List.of()   // badges — complété à l'étape 8
        );
    }

    // ─── Tâche planifiée : nettoyage des tokens expirés ───────────────────────

    @Scheduled(cron = "0 0 3 * * *") // chaque nuit à 3h
    @Transactional
    public void purgeExpiredTokens() {
        refreshTokenRepository.deleteAllExpired(Instant.now());
        log.debug("Purge des refresh tokens expirés effectuée");
    }

    // ─── Tâche planifiée : anonymisation comptes inactifs (RGPD) ─────────────

    @Scheduled(cron = "0 0 4 1 * *") // 1er de chaque mois à 4h
    @Transactional
    public void anonymizeInactiveAccounts() {
        int inactiveMonths = appProperties.anonymization().inactiveMonths();
        Instant cutoff = Instant.now().minusSeconds((long) inactiveMonths * 30 * 24 * 3600);

        List<User> inactive = userRepository.findInactiveBefore(cutoff);
        for (User u : inactive) {
            userRepository.anonymize(u.getId());
            log.info("Compte anonymisé (inactif depuis {} mois) : userId={}", inactiveMonths, u.getId());
        }
    }

    // ─── Helpers privés ──────────────────────────────────────────────────────

    private User createUser(GoogleUserInfo g) {
        return userRepository.save(User.builder()
                .googleId(g.sub())
                .email(g.email())
                .name(g.name())
                .pictureUrl(g.picture())
                .foodAvatarType(User.randomAvatar())
                .build());
    }

    private User updateUser(User user, GoogleUserInfo g) {
        user.setName(g.name());
        user.setPictureUrl(g.picture());
        return user;
    }

    private AuthResponse buildAuthResponse(User user, HttpServletResponse response) {
        String accessToken = jwtService.generateAccessToken(user);

        // Refresh token : UUID opaque → stocké haché
        String rawRefreshToken = jwtService.generateRefreshToken();
        long refreshExpSec = appProperties.jwt().refreshTokenExpiration();

        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .tokenHash(hash(rawRefreshToken))
                .expiresAt(Instant.now().plusSeconds(refreshExpSec))
                .build();
        refreshTokenRepository.save(rt);

        // Cookie httpOnly SameSite=Strict
        setRefreshCookie(response, rawRefreshToken, (int) refreshExpSec);

        return AuthResponse.of(
                accessToken,
                jwtService.getAccessTokenExpiration(),
                toUserDto(user)
        );
    }

    private void setRefreshCookie(HttpServletResponse response, String token, int maxAge) {
        String cookie = String.format(
                "%s=%s; Max-Age=%d; Path=/api/v1/auth; HttpOnly; SameSite=Strict; Secure",
                REFRESH_COOKIE_NAME, token, maxAge);
        response.addHeader("Set-Cookie", cookie);
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        String cookie = String.format(
                "%s=; Max-Age=0; Path=/api/v1/auth; HttpOnly; SameSite=Strict; Secure",
                REFRESH_COOKIE_NAME);
        response.addHeader("Set-Cookie", cookie);
    }

    // ─── Connexion invité ─────────────────────────────────────────────────────

    @Transactional
    public AuthResponse createGuestSession(HttpServletResponse response) {
        String uid = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        User guest = userRepository.save(User.builder()
                .email("guest_" + UUID.randomUUID() + "@spinmylunch.local")
                .name("Invité #" + uid)
                .isGuest(true)
                .foodAvatarType(User.randomAvatar())
                .build());
        return buildAuthResponse(guest, response);
    }

    private AuthResponse.UserDto toUserDto(User user) {
        return new AuthResponse.UserDto(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getPictureUrl(),
                user.getLevel(),
                user.getXp(),
                user.getStreakCount(),
                user.getFoodAvatarType(),
                user.getTheme(),
                Boolean.TRUE.equals(user.getIsGuest())
        );
    }

    /** SHA-256 en hex du token brut */
    public static String hash(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 non disponible", e);
        }
    }
}
