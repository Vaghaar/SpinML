package com.spinmylunch.vote;

import com.spinmylunch.auth.security.CurrentUser;
import com.spinmylunch.domain.user.User;
import com.spinmylunch.vote.dto.CastVoteRequest;
import com.spinmylunch.vote.dto.LiveVoteUpdate;
import com.spinmylunch.vote.service.VoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

/**
 * Contrôleur STOMP — traite les messages CLIENT → SERVEUR via WebSocket.
 *
 * Le client envoie sur /app/vote et /app/spin,
 * les résultats sont broadcastés sur /topic/group/{groupId}/vote et /spin.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class VoteWebSocketController {

    private final VoteService voteService;

    /**
     * Reçoit un vote via WebSocket (/app/vote).
     * Répond en privé à l'émetteur (/user/queue/vote-reply) puis broadcast au groupe.
     */
    @MessageMapping("/vote")
    @SendToUser("/queue/vote-reply")
    public LiveVoteUpdate handleVote(@Payload WsVoteMessage message, Principal principal) {
        User user = extractUser(principal);
        CastVoteRequest req = new CastVoteRequest(message.optionId(), message.points());
        return voteService.castVote(message.sessionId(), req, user);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private User extractUser(Principal principal) {
        if (principal instanceof org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth) {
            return (User) auth.getPrincipal();
        }
        throw new IllegalStateException("Utilisateur non authentifié via WebSocket");
    }

    // ─── Message entrant ─────────────────────────────────────────────────────

    public record WsVoteMessage(UUID sessionId, UUID optionId, Integer points) {}
}
