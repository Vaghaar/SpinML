package com.spinmylunch.config;

import com.spinmylunch.config.websocket.StompAuthChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")   // affiné par CORS applicatif
                .withSockJS();                    // fallback SockJS pour les navigateurs anciens
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Préfixe des messages CLIENT → SERVEUR
        registry.setApplicationDestinationPrefixes("/app");

        // Broker en mémoire pour les topics et queues
        registry.enableSimpleBroker(
                "/topic",   // broadcast groupe : /topic/group/{groupId}/vote, /spin
                "/queue"    // messages privés : /queue/notifications
        );

        // Préfixe pour les messages utilisateur (convertis automatiquement)
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Intercepteur JWT sur la frame STOMP CONNECT
        registration.interceptors(stompAuthChannelInterceptor);
    }
}
