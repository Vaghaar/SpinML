package com.spinmylunch.gamification;

import com.spinmylunch.auth.security.CurrentUser;
import com.spinmylunch.domain.gamification.Badge;
import com.spinmylunch.domain.gamification.BadgeRepository;
import com.spinmylunch.domain.gamification.UserBadge;
import com.spinmylunch.domain.gamification.UserBadgeRepository;
import com.spinmylunch.domain.roulette.SpinResultRepository;
import com.spinmylunch.domain.user.User;
import com.spinmylunch.domain.vote.VoteRepository;
import com.spinmylunch.gamification.dto.ProfileResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final BadgeRepository     badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final SpinResultRepository spinResultRepository;
    private final VoteRepository      voteRepository;

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(@CurrentUser User user) {
        List<Badge>     allBadges     = badgeRepository.findAll();
        List<UserBadge> userBadges    = userBadgeRepository.findByUserIdWithBadge(user.getId());

        Map<String, UserBadge> earned = userBadges.stream()
                .collect(Collectors.toMap(ub -> ub.getBadge().getCode(), ub -> ub));

        List<ProfileResponse.BadgeDto> dtos = allBadges.stream()
                .map(b -> {
                    UserBadge ub = earned.get(b.getCode());
                    return new ProfileResponse.BadgeDto(
                            b.getCode(), b.getName(), b.getDescription(), b.getIconUrl(),
                            ub != null, ub != null ? ub.getEarnedAt() : null);
                })
                .toList();

        long totalSpins = spinResultRepository.countBySpunById(user.getId());
        long totalVotes = voteRepository.countByUserId(user.getId());

        return ResponseEntity.ok(new ProfileResponse(
                user.getId(), user.getName(), user.getEmail(), user.getPictureUrl(),
                user.getLevel(), user.getXp(), user.getStreakCount(),
                dtos, totalSpins, totalVotes));
    }
}
