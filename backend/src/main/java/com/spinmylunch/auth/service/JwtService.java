package com.spinmylunch.auth.service;

import com.spinmylunch.config.AppProperties;
import com.spinmylunch.domain.user.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Slf4j
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long accessTokenExpiration;  // seconds

    public JwtService(AppProperties props) {
        this.signingKey = Keys.hmacShaKeyFor(
                props.jwt().secret().getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiration = props.jwt().accessTokenExpiration();
    }

    // ─── Access Token (15 min) ────────────────────────────────────────────────

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("name", user.getName())
                .claim("level", user.getLevel())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(accessTokenExpiration)))
                .signWith(signingKey, Jwts.SIG.HS256)
                .compact();
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(parseClaims(token).getSubject());
    }

    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Token invalide : {}", e.getMessage());
            return false;
        }
    }

    public long getAccessTokenExpiration() {
        return accessTokenExpiration;
    }

    // ─── Refresh Token (opaque UUID, stocké haché en BDD) ────────────────────

    public String generateRefreshToken() {
        return UUID.randomUUID().toString();
    }

    // ─── Internals ────────────────────────────────────────────────────────────

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
