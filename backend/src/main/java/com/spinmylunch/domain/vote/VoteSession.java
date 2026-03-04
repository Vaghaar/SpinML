package com.spinmylunch.domain.vote;

import com.spinmylunch.domain.group.Group;
import com.spinmylunch.domain.roulette.Roulette;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "vote_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoteSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "roulette_id")
    private Roulette roulette;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "vote_mode")
    @Builder.Default
    private VoteMode mode = VoteMode.MAJORITY;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "vote_status")
    @Builder.Default
    private VoteStatus status = VoteStatus.ACTIVE;

    @Column(name = "quorum_percent", nullable = false)
    @Builder.Default
    private int quorumPercent = 50;

    @Column(name = "timeout_at")
    private Instant timeoutAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<VoteOption> options = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public boolean isActive()  { return status == VoteStatus.ACTIVE;  }
    public boolean isClosed()  { return status == VoteStatus.CLOSED;  }
    public boolean isExpired() { return timeoutAt != null && Instant.now().isAfter(timeoutAt); }
}
