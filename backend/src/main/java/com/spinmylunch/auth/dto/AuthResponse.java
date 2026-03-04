package com.spinmylunch.auth.dto;

import com.spinmylunch.domain.user.FoodAvatar;
import com.spinmylunch.domain.user.UserTheme;

import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,          // secondes
        UserDto user
) {
    public record UserDto(
            UUID   id,
            String email,
            String name,
            String pictureUrl,
            int    level,
            int    xp,
            int    streakCount,
            FoodAvatar foodAvatarType,
            UserTheme  theme,
            boolean isGuest
    ) {}

    public static AuthResponse of(String token, long expiresIn, UserDto user) {
        return new AuthResponse(token, "Bearer", expiresIn, user);
    }
}
