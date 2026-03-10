package com.spinmylunch.auth;

import com.spinmylunch.auth.service.JwtService;
import com.spinmylunch.config.AppProperties;
import com.spinmylunch.domain.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        AppProperties props = new AppProperties(
                new AppProperties.Jwt(
                        "test_secret_key_at_least_256_bits_long_for_hs256_algorithm_padding_here",
                        900L, 604800L, false),
                "http://localhost:3000",
                new AppProperties.Cors(List.of("http://localhost:3000")),
                new AppProperties.RateLimit(100, 10, 5),
                new AppProperties.Anonymization(12)
        );
        jwtService = new JwtService(props);
    }

    @Test
    void generateAndValidate_accessToken() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .googleId("google_123")
                .email("test@example.com")
                .name("Test User")
                .build();

        String token = jwtService.generateAccessToken(user);

        assertThat(token).isNotBlank();
        assertThat(jwtService.isValid(token)).isTrue();
        assertThat(jwtService.extractUserId(token)).isEqualTo(user.getId());
    }

    @Test
    void isValid_withTamperedToken_returnsFalse() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .googleId("google_123")
                .email("test@example.com")
                .name("Test User")
                .build();

        String token = jwtService.generateAccessToken(user) + "tampered";
        assertThat(jwtService.isValid(token)).isFalse();
    }

    @Test
    void generateRefreshToken_isUniqueEachTime() {
        String t1 = jwtService.generateRefreshToken();
        String t2 = jwtService.generateRefreshToken();
        assertThat(t1).isNotEqualTo(t2);
    }
}
