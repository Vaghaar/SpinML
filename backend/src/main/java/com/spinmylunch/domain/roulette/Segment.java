package com.spinmylunch.domain.roulette;

import com.spinmylunch.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "segments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Segment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "roulette_id", nullable = false)
    private Roulette roulette;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false, precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal weight = BigDecimal.ONE;

    @Column(nullable = false, length = 7)
    @Builder.Default
    private String color = "#FF6B35";

    @Column(nullable = false)
    private Integer position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposed_by")
    private User proposedBy;

    public double getWeightAsDouble() {
        return weight.doubleValue();
    }
}
