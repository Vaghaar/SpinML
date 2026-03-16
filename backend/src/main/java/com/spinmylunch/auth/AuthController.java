package com.spinmylunch.auth;

import com.spinmylunch.auth.dto.AuthResponse;
import com.spinmylunch.auth.dto.GoogleAuthRequest;
import com.spinmylunch.auth.dto.NameAuthRequest;
import com.spinmylunch.auth.dto.UserExportDto;
import com.spinmylunch.auth.security.CurrentUser;
import com.spinmylunch.auth.service.AuthService;
import com.spinmylunch.domain.user.User;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/v1/auth/google
     * Échange un code d'autorisation Google contre un JWT + refresh token (httpOnly cookie).
     */
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(
            @Valid @RequestBody GoogleAuthRequest request,
            HttpServletResponse response
    ) {
        AuthResponse auth = authService.loginWithGoogle(
                request.code(), request.redirectUri(), response);
        return ResponseEntity.ok(auth);
    }

    /**
     * POST /api/v1/auth/guest
     * Crée une session invité avec un prénom (éphémère, pas de stats).
     */
    @PostMapping("/guest")
    public ResponseEntity<AuthResponse> loginAsGuest(
            @Valid @RequestBody NameAuthRequest request,
            HttpServletResponse response
    ) {
        return ResponseEntity.ok(authService.createGuestSession(request.name(), response));
    }

    /**
     * POST /api/v1/auth/refresh
     * Émet un nouveau access token depuis le refresh token (httpOnly cookie).
     */
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String rawToken = extractRefreshTokenFromCookie(request);
        if (rawToken == null) {
            return ResponseEntity.status(401).build();
        }
        AuthResponse auth = authService.refresh(rawToken, response);
        return ResponseEntity.ok(auth);
    }

    /**
     * POST /api/v1/auth/logout
     * Révoque le refresh token courant.
     */
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String rawToken = extractRefreshTokenFromCookie(request);
        authService.logout(rawToken, response);
        return ResponseEntity.noContent().build();
    }

    /**
     * DELETE /api/v1/auth/account
     * Supprime définitivement le compte et toutes les données (RGPD).
     * Requiert une authentification JWT valide.
     */
    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount(
            @CurrentUser User currentUser,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        authService.deleteAccount(currentUser.getId(), response);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/v1/auth/export
     * Exporte toutes les données personnelles de l'utilisateur en JSON (RGPD).
     */
    @GetMapping("/export")
    public ResponseEntity<UserExportDto> exportData(@CurrentUser User currentUser) {
        UserExportDto export = authService.exportUserData(currentUser.getId());
        return ResponseEntity.ok()
                .header("Content-Disposition",
                        "attachment; filename=\"spinmylunch-export.json\"")
                .body(export);
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        return Arrays.stream(cookies)
                .filter(c -> AuthService.REFRESH_COOKIE_NAME.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
