package com.spinmylunch.vote;

import com.spinmylunch.auth.security.CurrentUser;
import com.spinmylunch.domain.user.User;
import com.spinmylunch.vote.dto.*;
import com.spinmylunch.vote.service.VoteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/votes")
@RequiredArgsConstructor
public class VoteController {

    private final VoteService voteService;

    /**
     * POST /api/v1/votes/sessions
     * Crée une nouvelle session de vote pour un groupe.
     */
    @PostMapping("/sessions")
    public ResponseEntity<VoteSessionResponse> createSession(
            @Valid @RequestBody CreateVoteSessionRequest request,
            @CurrentUser User user
    ) {
        VoteSessionResponse session = voteService.createSession(request, user);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(session.id()).toUri();
        return ResponseEntity.created(location).body(session);
    }

    /**
     * POST /api/v1/votes/sessions/:id/vote
     * Vote pour une option — déclenche un broadcast WebSocket.
     */
    @PostMapping("/sessions/{id}/vote")
    public ResponseEntity<LiveVoteUpdate> castVote(
            @PathVariable UUID id,
            @Valid @RequestBody CastVoteRequest request,
            @CurrentUser User user
    ) {
        return ResponseEntity.ok(voteService.castVote(id, request, user));
    }

    /**
     * GET /api/v1/votes/sessions/:id/results
     * Résultats en temps réel (snapshot HTTP, les mises à jour live via WS).
     */
    @GetMapping("/sessions/{id}/results")
    public ResponseEntity<LiveVoteUpdate> getResults(
            @PathVariable UUID id,
            @CurrentUser User user
    ) {
        return ResponseEntity.ok(voteService.getResults(id, user));
    }

    /**
     * POST /api/v1/votes/sessions/:id/close
     * Ferme manuellement une session (admin uniquement).
     */
    @PostMapping("/sessions/{id}/close")
    public ResponseEntity<LiveVoteUpdate> closeSession(
            @PathVariable UUID id,
            @CurrentUser User user
    ) {
        return ResponseEntity.ok(voteService.closeSession(id, user));
    }
}
