package com.spinmylunch.roulette.service;

import com.spinmylunch.domain.roulette.Segment;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;

/**
 * Algorithme de spin côté serveur.
 *
 * Garanties :
 * - Utilise {@link SecureRandom} (CSPRNG) — non prévisible
 * - Le segment gagnant est choisi AVANT l'animation cliente
 * - Le client reçoit serverAngle et anime jusqu'à cet angle exact
 *
 * Système de coordonnées :
 * - Angle 0° = haut de la roue (position 12h), sens horaire
 * - Segment[0] occupe [0°, (w0/total)*360°]
 * - Segment[i] commence après la somme des segments précédents
 * - serverAngle = n_rotations×360° + angle_cible_dans_segment_gagnant
 */
@Slf4j
@Service
public class SpinService {

    /** Nombre minimum de rotations complètes avant de s'arrêter. */
    private static final int MIN_ROTATIONS = 5;
    /** Nombre maximum de rotations complètes (exclusif). */
    private static final int MAX_ROTATIONS = 11;
    /** Marge aux bords d'un segment (en %) — évite les arrêts au bord. */
    private static final double EDGE_MARGIN_PERCENT = 0.15;

    private final SecureRandom secureRandom = new SecureRandom();

    // ─── Point d'entrée public ────────────────────────────────────────────────

    /**
     * Sélectionne le segment gagnant et calcule l'angle d'arrêt.
     *
     * @param segments  Liste des segments de la roulette (ordre = position)
     * @param mode      Mode de pondération
     * @return          Résultat : segment gagnant + serverAngle
     */
    public SpinResult computeSpin(List<Segment> segments) {
        if (segments == null || segments.isEmpty()) {
            throw new IllegalArgumentException("La roulette n'a pas de segments");
        }
        if (segments.size() == 1) {
            double angle = computeServerAngle(segments, segments.get(0));
            return new SpinResult(segments.get(0), BigDecimal.valueOf(angle).setScale(4, RoundingMode.HALF_UP));
        }

        double[] weights = storedWeights(segments);
        Segment winner   = weightedSelect(segments, weights);
        double   angle   = computeServerAngle(segments, winner, weights);

        log.debug("Spin → gagnant='{}' angle={}°", winner.getLabel(), angle);

        return new SpinResult(
                winner,
                BigDecimal.valueOf(angle).setScale(4, RoundingMode.HALF_UP)
        );
    }

    /** Poids des segments (= nb de propositions par label, agrégé en amont). */
    private double[] storedWeights(List<Segment> segments) {
        return segments.stream()
                .mapToDouble(Segment::getWeightAsDouble)
                .toArray();
    }

    // ─── Sélection pondérée (algorithme Roulette Wheel Selection) ─────────────

    /**
     * Algorithme Roulette Wheel Selection avec SecureRandom.
     *
     * Complexité O(n) — acceptable pour 2-20 segments.
     */
    private Segment weightedSelect(List<Segment> segments, double[] weights) {
        double total = sumWeights(weights);
        double r     = secureRandom.nextDouble() * total;

        double cumulative = 0.0;
        for (int i = 0; i < segments.size(); i++) {
            cumulative += weights[i];
            if (r < cumulative) {
                return segments.get(i);
            }
        }
        // Fallback (edge case floating point)
        return segments.get(segments.size() - 1);
    }

    // ─── Calcul de l'angle serveur ────────────────────────────────────────────

    /**
     * Calcule l'angle final de la roue en degrés.
     *
     * Formule :
     *   serverAngle = (N rotations complètes) × 360 + angle_cible
     *
     * angle_cible = position dans le segment gagnant (avec marges aux bords)
     */
    private double computeServerAngle(List<Segment> segments, Segment winner) {
        double[] weights = storedWeights(segments);
        return computeServerAngle(segments, winner, weights);
    }

    private double computeServerAngle(List<Segment> segments, Segment winner, double[] weights) {
        double total = sumWeights(weights);

        // Calculer l'angle de début du segment gagnant
        double segStartDeg = 0.0;
        for (int i = 0; i < segments.size(); i++) {
            Segment s = segments.get(i);
            if (s.getId().equals(winner.getId())) break;
            segStartDeg += (weights[i] / total) * 360.0;
        }

        // Taille angulaire du segment gagnant
        int winnerIdx = indexOf(segments, winner);
        double segSpanDeg = (weights[winnerIdx] / total) * 360.0;

        // Zone d'atterrissage : éviter les bords (EDGE_MARGIN_PERCENT de chaque côté)
        double margin   = segSpanDeg * EDGE_MARGIN_PERCENT;
        double landZone = segSpanDeg - 2 * margin;
        double targetDeg = segStartDeg + margin + secureRandom.nextDouble() * landZone;

        // Rotations complètes aléatoires entre MIN et MAX
        int rotations = MIN_ROTATIONS + secureRandom.nextInt(MAX_ROTATIONS - MIN_ROTATIONS);

        return rotations * 360.0 + (360.0 - targetDeg);
    }

    // ─── Utilitaires ─────────────────────────────────────────────────────────

    private double sumWeights(double[] weights) {
        double sum = 0;
        for (double w : weights) sum += w;
        return sum;
    }

    private int indexOf(List<Segment> segments, Segment target) {
        for (int i = 0; i < segments.size(); i++) {
            if (segments.get(i).getId().equals(target.getId())) return i;
        }
        return segments.size() - 1;
    }

    // ─── Value object résultat ────────────────────────────────────────────────

    public record SpinResult(Segment winner, BigDecimal serverAngle) {}
}
