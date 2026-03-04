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
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/roulettes")
@RequiredArgsConstructor
public class RouletteController {

    private final RouletteService rouletteService;

    /**
     * POST /api/v1/roulettes
     * Crée une nouvelle roulette (2-20 segments).
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
