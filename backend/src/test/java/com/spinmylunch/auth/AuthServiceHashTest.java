package com.spinmylunch.auth;

import com.spinmylunch.auth.service.AuthService;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AuthServiceHashTest {

    @Test
    void hash_sameInputProducesSameOutput() {
        String raw = "my-secret-refresh-token";
        assertThat(AuthService.hash(raw)).isEqualTo(AuthService.hash(raw));
    }

    @Test
    void hash_differentInputsProduceDifferentOutputs() {
        assertThat(AuthService.hash("tokenA")).isNotEqualTo(AuthService.hash("tokenB"));
    }

    @Test
    void hash_outputIsHex64Chars() {
        // SHA-256 = 32 bytes = 64 hex chars
        String result = AuthService.hash("some-token");
        assertThat(result).hasSize(64).matches("[0-9a-f]+");
    }
}
