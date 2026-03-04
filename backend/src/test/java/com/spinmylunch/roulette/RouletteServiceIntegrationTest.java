package com.spinmylunch.roulette;

import com.spinmylunch.domain.roulette.Roulette;
import com.spinmylunch.domain.roulette.RouletteMode;
import com.spinmylunch.domain.roulette.RouletteRepository;
import com.spinmylunch.domain.user.User;
import com.spinmylunch.domain.user.UserRepository;
import com.spinmylunch.roulette.dto.CreateRouletteRequest;
import com.spinmylunch.roulette.dto.RouletteResponse;
import com.spinmylunch.roulette.dto.SegmentDto;
import com.spinmylunch.roulette.dto.SpinResponse;
import com.spinmylunch.roulette.service.RouletteService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RouletteServiceIntegrationTest {

    @Autowired RouletteService    rouletteService;
    @Autowired RouletteRepository rouletteRepository;
    @Autowired UserRepository     userRepository;

    private User testUser;

    @BeforeEach
    void createUser() {
        testUser = userRepository.save(User.builder()
                .email("test+" + UUID.randomUUID() + "@example.com")
                .name("Test User")
                .build());
    }

    @Test
    void create_persistsRouletteWithSegments() {
        CreateRouletteRequest req = new CreateRouletteRequest(
                null,
                "Lunch Roulette",
                RouletteMode.EQUAL,
                false,
                List.of(
                        new SegmentDto(null, "Pizza", BigDecimal.ONE, "#FF6B35", 0),
                        new SegmentDto(null, "Sushi", BigDecimal.ONE, "#FFD700", 1),
                        new SegmentDto(null, "Burger", BigDecimal.ONE, "#4ECDC4", 2)
                )
        );

        RouletteResponse resp = rouletteService.create(req, testUser);

        assertThat(resp.id()).isNotNull();
        assertThat(resp.segments()).hasSize(3);
        assertThat(resp.segments()).extracting(RouletteResponse.SegmentResponse::label)
                .containsExactlyInAnyOrder("Pizza", "Sushi", "Burger");
    }

    @Test
    void spin_returnsValidServerAngle() {
        RouletteResponse roulette = createSimpleRoulette();

        SpinResponse spin = rouletteService.spin(roulette.id(), testUser);

        assertThat(spin.serverAngle().doubleValue()).isGreaterThanOrEqualTo(1800.0);
        assertThat(spin.serverAngle().doubleValue()).isLessThan(3960.0);
        assertThat(spin.winningLabel()).isIn("A", "B", "C");
        assertThat(spin.xpEarned()).isGreaterThan(0);
    }

    @Test
    void spin_winnerIsOneOfTheSegments() {
        RouletteResponse roulette = createSimpleRoulette();

        for (int i = 0; i < 20; i++) {
            SpinResponse spin = rouletteService.spin(roulette.id(), testUser);
            assertThat(spin.winningLabel()).isIn("A", "B", "C");
        }
    }

    @Test
    void getMyRoulettes_returnsOnlyCreatorRoulettes() {
        createSimpleRoulette();
        createSimpleRoulette();

        List<RouletteResponse> mine = rouletteService.getMyRoulettes(testUser);
        assertThat(mine).hasSizeGreaterThanOrEqualTo(2);
        mine.forEach(r -> assertThat(r.creatorId()).isEqualTo(testUser.getId()));
    }

    @Test
    void delete_removesRoulette() {
        RouletteResponse roulette = createSimpleRoulette();

        rouletteService.delete(roulette.id(), testUser);

        assertThat(rouletteRepository.findById(roulette.id())).isEmpty();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private RouletteResponse createSimpleRoulette() {
        return rouletteService.create(new CreateRouletteRequest(
                null,
                "Test " + UUID.randomUUID(),
                RouletteMode.EQUAL,
                false,
                List.of(
                        new SegmentDto(null, "A", BigDecimal.ONE, "#FF6B35", 0),
                        new SegmentDto(null, "B", BigDecimal.ONE, "#FFD700", 1),
                        new SegmentDto(null, "C", BigDecimal.ONE, "#4ECDC4", 2)
                )
        ), testUser);
    }
}
