package com.spinmylunch.domain.roulette;

import com.spinmylunch.domain.group.Group;
import com.spinmylunch.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "spin_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpinResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roulette_id")
    private Roulette roulette;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winning_segment_id")
    private Segment winningSegment;

    /** Angle calculé côté serveur (degrés) — animé par le client jusqu'à cet angle exact. */
    @Column(name = "server_angle", nullable = false, precision = 10, scale = 4)
    private BigDecimal serverAngle;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "spun_by", nullable = false)
    private User spunBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
