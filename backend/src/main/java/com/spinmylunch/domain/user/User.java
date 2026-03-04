package com.spinmylunch.domain.user;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "google_id", unique = true)
    private String googleId;

    @Column(name = "is_guest", nullable = false)
    @Builder.Default
    private Boolean isGuest = false;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String name;

    @Column(name = "picture_url")
    private String pictureUrl;

    @Column(nullable = false)
    @Builder.Default
    private Integer level = 1;

    @Column(nullable = false)
    @Builder.Default
    private Integer xp = 0;

    @Column(name = "streak_count", nullable = false)
    @Builder.Default
    private Integer streakCount = 0;

    @Column(name = "last_active_at")
    private Instant lastActiveAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "food_avatar_type", nullable = false)
    @Builder.Default
    private FoodAvatar foodAvatarType = FoodAvatar.PIZZA;

    /**
     * Preferences stockées en JSONB : {"vegetarian": true, "allergies": ["gluten"], "budget": 15}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "preferences_json", nullable = false,
            columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> preferencesJson = Map.of();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserTheme theme = UserTheme.DARK;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    // ─── Business methods ─────────────────────────────────────────────────────

    public void addXp(int amount) {
        this.xp += amount;
        this.level = computeLevel(this.xp);
    }

    public void touch() {
        this.lastActiveAt = Instant.now();
    }

    /** 20 niveaux : Novice (0 XP) → Foodie Légendaire (10 000 XP) */
    private static int computeLevel(int xp) {
        // Chaque niveau requiert level * 100 XP supplémentaires
        int level = 1;
        int threshold = 0;
        while (level < 20) {
            threshold += level * 100;
            if (xp < threshold) break;
            level++;
        }
        return level;
    }

    public static FoodAvatar randomAvatar() {
        FoodAvatar[] values = FoodAvatar.values();
        return values[(int) (Math.random() * values.length)];
    }
}
