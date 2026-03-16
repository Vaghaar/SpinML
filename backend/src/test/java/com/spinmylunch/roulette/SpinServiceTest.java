package com.spinmylunch.roulette;

import com.spinmylunch.domain.roulette.Segment;
import com.spinmylunch.roulette.service.SpinService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SpinServiceTest {

    private SpinService spinService;

    @BeforeEach
    void setUp() {
        spinService = new SpinService();
    }

    // ─── Sélection ────────────────────────────────────────────────────────────

    @Test
    void spin_singleSegment_alwaysReturnsThat() {
        Segment seg = segment("Pizza", 1.0);
        SpinService.SpinResult result = spinService.computeSpin(List.of(seg));
        assertThat(result.winner().getLabel()).isEqualTo("Pizza");
    }

    @Test
    void spin_emptySegments_throwsException() {
        assertThatThrownBy(() -> spinService.computeSpin(List.of()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void spin_serverAngle_minimumRotations() {
        List<Segment> segs = twoEqualSegments();
        SpinService.SpinResult result = spinService.computeSpin(segs);
        // 5 rotations minimum = 1800°
        assertThat(result.serverAngle().doubleValue()).isGreaterThanOrEqualTo(1800.0);
    }

    @Test
    void spin_serverAngle_maximumRotations() {
        List<Segment> segs = twoEqualSegments();
        SpinService.SpinResult result = spinService.computeSpin(segs);
        // 10 rotations maximum = 3600° + 360°
        assertThat(result.serverAngle().doubleValue()).isLessThan(3960.0);
    }

    @RepeatedTest(50)
    void spin_winnerAngle_isWithinWinnerSegment() {
        // 4 segments égaux = 90° chacun → [0,90), [90,180), [180,270), [270,360)
        List<Segment> segs = fourEqualSegments();
        SpinService.SpinResult result = spinService.computeSpin(segs);

        double angle       = result.serverAngle().doubleValue();
        double normalised  = angle % 360.0;
        String winner      = result.winner().getLabel();

        int winnerIdx = segs.stream()
                .map(Segment::getLabel).toList().indexOf(winner);
        double segStart = winnerIdx * 90.0;
        double segEnd   = segStart + 90.0;

        assertThat(normalised)
                .as("L'angle normalisé %.2f° doit être dans [%.0f°, %.0f°)", normalised, segStart, segEnd)
                .isGreaterThanOrEqualTo(segStart)
                .isLessThan(segEnd);
    }

    // ─── Distribution statistique ─────────────────────────────────────────────

    @Test
    void spin_equalWeights_isUniformlyDistributed() {
        List<Segment> segs = fourEqualSegments();
        Map<String, Integer> counts = new HashMap<>();
        int trials = 10_000;

        for (int i = 0; i < trials; i++) {
            String winner = spinService.computeSpin(segs).winner().getLabel();
            counts.merge(winner, 1, Integer::sum);
        }

        int expected = trials / 4;
        for (Map.Entry<String, Integer> e : counts.entrySet()) {
            assertThat(e.getValue())
                    .as("Segment '%s' : distribution non uniforme", e.getKey())
                    .isBetween((int)(expected * 0.90), (int)(expected * 1.10));
        }
    }

    @Test
    void spin_heavierSegmentWinsMoreOften() {
        // Segment A : poids 9, Segment B : poids 1 → A doit gagner ~90%
        Segment heavy  = segment("Heavy",  9.0);
        Segment light  = segment("Light",  1.0);
        List<Segment> segs = List.of(heavy, light);

        Map<String, Integer> counts = new HashMap<>();
        int trials = 10_000;
        for (int i = 0; i < trials; i++) {
            String winner = spinService.computeSpin(segs).winner().getLabel();
            counts.merge(winner, 1, Integer::sum);
        }

        double heavyRate = (double) counts.getOrDefault("Heavy", 0) / trials;
        assertThat(heavyRate)
                .as("Heavy (poids 9) devrait gagner ~90%% du temps, obtenu %.1f%%", heavyRate * 100)
                .isBetween(0.85, 0.95);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Segment segment(String label, double weight) {
        Segment s = new Segment();
        s.setId(UUID.randomUUID());
        s.setLabel(label);
        s.setWeight(BigDecimal.valueOf(weight));
        s.setColor("#FF6B35");
        s.setPosition(0);
        return s;
    }

    private List<Segment> twoEqualSegments() {
        Segment a = segment("A", 1.0); a.setPosition(0);
        Segment b = segment("B", 1.0); b.setPosition(1);
        return List.of(a, b);
    }

    private List<Segment> fourEqualSegments() {
        return IntStream.range(0, 4)
                .mapToObj(i -> {
                    Segment s = segment(String.valueOf((char)('A' + i)), 1.0);
                    s.setPosition(i);
                    return s;
                })
                .toList();
    }
}
