package com.spinmylunch.domain.roulette;

import com.spinmylunch.domain.group.Group;
import com.spinmylunch.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "roulettes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Roulette {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "creator_id", nullable = false)
    private User creator;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "roulette_mode")
    @Builder.Default
    private RouletteMode mode = RouletteMode.EQUAL;

    @Column(name = "is_surprise_mode", nullable = false)
    @Builder.Default
    private boolean isSurpriseMode = false;

    @OneToMany(mappedBy = "roulette", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("position ASC")
    @Builder.Default
    private List<Segment> segments = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
