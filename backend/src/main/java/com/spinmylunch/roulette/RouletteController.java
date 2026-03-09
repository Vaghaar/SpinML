package com.spinmylunch.roulette;

import com.spinmylunch.auth.security.CurrentUser;
import com.spinmylunch.domain.user.User;
import com.spinmylunch.roulette.dto.*;
import com.spinmylunch.roulette.service.RouletteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/roulettes")
@RequiredArgsConstructor
public class RouletteController {

    private final RouletteService rouletteService;

    /**
     * GET /api/v1/roulettes?groupId=
     * Liste les roulettes de l'utilisateur courant, ou d'un groupe si groupId est fourni.
     */
    @GetMapping
    public ResponseEntity<List<RouletteResponse>> getRoulettes(
            @RequestParam(required = false) UUID groupId,
            @CurrentUser User user) {
        if (groupId != null) {
            return ResponseEntity.ok(rouletteService.getByGroup(groupId, user));
        }
        return ResponseEntity.ok(rouletteService.getMyRoulettes(user));
    }

    /**
     * DELETE /api/v1/roulettes/:id
     * Supprime une roulette (créateur uniquement).
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @CurrentUser User user) {
        rouletteService.delete(id, user);
        return ResponseEntity.noContent().build();
    }

    /**
     * POST /api/v1/roulettes
     * Crée une nouvelle roulette.
     * - Sans groupId : 2-20 segments requis, statut ACTIVE
     * - Avec groupId et sans segments : statut PENDING (collecte de propositions)
     */
    @PostMapping
    public ResponseEntity<RouletteResponse> create(
            @Valid @RequestBody CreateRouletteRequest request,
            @CurrentUser User user
    ) {
        RouletteResponse roulette = rouletteService.create(request, user);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(roulette.id()).toUri();
        return ResponseEntity.created(location).body(roulette);
    }

    /**
     * GET /api/v1/roulettes/:id
     * Détails d'une roulette avec ses segments.
     */
    @GetMapping("/{id}")
    public ResponseEntity<RouletteResponse> getById(
            @PathVariable UUID id,
            @CurrentUser User user
    ) {
        return ResponseEntity.ok(rouletteService.getById(id, user));
    }

    /**
     * PUT /api/v1/roulettes/:id
     * Modifie une roulette (créateur ou admin du groupe).
     */
    @PutMapping("/{id}")
    public ResponseEntity<RouletteResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRouletteRequest request,
            @CurrentUser User user
    ) {
        return ResponseEntity.ok(rouletteService.update(id, request, user));
    }

    /**
     * POST /api/v1/roulettes/:id/propose
     * Propose un segment à une roulette en statut PENDING (tout membre du groupe).
     */
    @PostMapping("/{id}/propose")
    public ResponseEntity<RouletteResponse> propose(
            @PathVariable UUID id,
            @RequestBody ProposeSegmentRequest request,
            @CurrentUser User user
    ) {
        return ResponseEntity.ok(rouletteService.addProposal(id, request.label(), user));
    }

    /**
     * DELETE /api/v1/roulettes/:id/segments/:segId
     * Supprime un segment proposé (proposant ou créateur ou admin du groupe).
     */
    @DeleteMapping("/{id}/segments/{segId}")
    public ResponseEntity<RouletteResponse> removeSegment(
            @PathVariable UUID id,
            @PathVariable UUID segId,
            @CurrentUser User user
    ) {
        return ResponseEntity.ok(rouletteService.removeSegment(id, segId, user));
    }

    /**
     * POST /api/v1/roulettes/:id/start
     * Démarre la roulette PENDING → ACTIVE (admin du groupe uniquement, ≥ 2 segments).
     */
    @PostMapping("/{id}/start")
    public ResponseEntity<RouletteResponse> start(
            @PathVariable UUID id,
            @CurrentUser User user
    ) {
        return ResponseEntity.ok(rouletteService.start(id, user));
    }

    /**
     * POST /api/v1/roulettes/:id/spin
     * Lance un spin — l'angle et le gagnant sont calculés côté serveur.
     * Rate limit : 10 spins/min.
     */
    @PostMapping("/{id}/spin")
    public ResponseEntity<SpinResponse> spin(
            @PathVariable UUID id,
            @CurrentUser User user
    ) {
        return ResponseEntity.ok(rouletteService.spin(id, user));
    }

    /**
     * GET /api/v1/roulettes/:id/history?page=0&size=20
     * Historique paginé des spins d'une roulette.
     */
    @GetMapping("/{id}/history")
    public ResponseEntity<SpinHistoryResponse> getHistory(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @CurrentUser User user
    ) {
        return ResponseEntity.ok(rouletteService.getHistory(id, page, Math.min(size, 50), user));
    }
}
