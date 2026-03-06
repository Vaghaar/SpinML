package com.spinmylunch.stats;

import com.spinmylunch.auth.security.CurrentUser;
import com.spinmylunch.common.exception.AppException;
import com.spinmylunch.common.exception.ErrorCode;
import com.spinmylunch.domain.group.GroupMemberRepository;
import com.spinmylunch.domain.roulette.SpinResultRepository;
import com.spinmylunch.domain.user.User;
import com.spinmylunch.stats.dto.StatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/stats")
@RequiredArgsConstructor
public class StatsController {

    private static final int TOP_LIMIT = 6;

    private final SpinResultRepository  spinResultRepository;
    private final GroupMemberRepository groupMemberRepository;

    /**
     * GET /api/v1/stats/me
     * Top endroits où l'utilisateur courant a mangé.
     */
    @GetMapping("/me")
    public ResponseEntity<StatsResponse> myStats(@CurrentUser User user) {
        List<Object[]> rows = spinResultRepository.findTopLabelsByUser(
                user.getId(), PageRequest.of(0, TOP_LIMIT));

        long total = spinResultRepository.countBySpunById(user.getId());

        List<StatsResponse.PlaceCount> places = rows.stream()
                .map(r -> new StatsResponse.PlaceCount((String) r[0], (Long) r[1]))
                .toList();

        return ResponseEntity.ok(new StatsResponse(places, total));
    }

    /**
     * GET /api/v1/stats/group/{id}
     * Top endroits mangés dans un groupe.
     */
    @GetMapping("/group/{id}")
    public ResponseEntity<StatsResponse> groupStats(
            @PathVariable UUID id,
            @CurrentUser User user
    ) {
        if (!groupMemberRepository.existsByGroupIdAndUserId(id, user.getId())) {
            throw AppException.of(ErrorCode.FORBIDDEN);
        }

        List<Object[]> rows = spinResultRepository.findTopLabelsByGroup(
                id, PageRequest.of(0, TOP_LIMIT));

        long total = spinResultRepository.countByGroupId(id);

        List<StatsResponse.PlaceCount> places = rows.stream()
                .map(r -> new StatsResponse.PlaceCount((String) r[0], (Long) r[1]))
                .toList();

        return ResponseEntity.ok(new StatsResponse(places, total));
    }
}
