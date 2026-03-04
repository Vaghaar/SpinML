package com.spinmylunch.config.websocket;

import com.spinmylunch.auth.service.JwtService;
import com.spinmylunch.domain.user.User;
import com.spinmylunch.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Intercepte la frame STOMP CONNECT pour authentifier l'utilisateur via JWT.
 * Le token est passé dans le header STOMP : Authorization: Bearer <token>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService     jwtService;
    private final UserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) return message;

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                authenticateFromToken(accessor, token);
            } else {
                log.debug("WebSocket CONNECT sans token JWT — connexion anonyme refusée");
                // On laisse passer, mais l'utilisateur ne pourra pas s'abonner
                // aux topics protégés (Spring Security intercepte à l'abonnement)
            }
        }

        return message;
    }

    private void authenticateFromToken(StompHeaderAccessor accessor, String token) {
        if (!jwtService.isValid(token)) {
            log.debug("WebSocket CONNECT : JWT invalide");
            return;
        }
        try {
            UUID userId = jwtService.extractUserId(token);
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                var auth = new UsernamePasswordAuthenticationToken(
                        user, null,
                        List.of(new SimpleGrantedAuthority("ROLE_USER")));
                accessor.setUser(auth);
                log.debug("WebSocket CONNECT authentifié : userId={}", userId);
            }
        } catch (Exception e) {
            log.debug("WebSocket CONNECT : échec extraction JWT — {}", e.getMessage());
        }
    }
}
