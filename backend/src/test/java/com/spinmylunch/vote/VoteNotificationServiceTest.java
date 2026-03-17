package com.spinmylunch.vote;

import com.spinmylunch.domain.roulette.Segment;
import com.spinmylunch.domain.vote.*;
import com.spinmylunch.vote.dto.LiveVoteUpdate;
import com.spinmylunch.vote.service.VoteNotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.spinmylunch.domain.group.GroupMemberRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class VoteNotificationServiceTest {

    @Mock SimpMessagingTemplate messagingTemplate;
    @Mock VoteRepository        voteRepository;
    @Mock GroupMemberRepository groupMemberRepository;

    private VoteNotificationService service;

    @BeforeEach
    void setUp() {
        service = new VoteNotificationService(messagingTemplate, voteRepository, groupMemberRepository);
    }

    // ─── Calcul des résultats ─────────────────────────────────────────────────

    @Test
    void computeOptionResults_majority_correctPercentages() {
        VoteOption optA = option("Pizza");
        VoteOption optB = option("Sushi");
        VoteOption optC = option("Burger");

        Vote v1 = vote(optA); Vote v2 = vote(optA); // 2 pour Pizza
        Vote v3 = vote(optB);                        // 1 pour Sushi
        Vote v4 = vote(optC);                        // 1 pour Burger

        List<LiveVoteUpdate.OptionResult> results = service.computeOptionResults(
                List.of(optA, optB, optC), List.of(v1, v2, v3, v4));

        assertThat(results).hasSize(3);

        LiveVoteUpdate.OptionResult pizza  = find(results, optA.getId());
        LiveVoteUpdate.OptionResult sushi  = find(results, optB.getId());
        LiveVoteUpdate.OptionResult burger = find(results, optC.getId());

        assertThat(pizza.voteCount()).isEqualTo(2);
        assertThat(pizza.percentage()).isEqualByComparingTo(BigDecimal.valueOf(50.00));
        assertThat(sushi.voteCount()).isEqualTo(1);
        assertThat(sushi.percentage()).isEqualByComparingTo(BigDecimal.valueOf(25.00));
        assertThat(burger.percentage()).isEqualByComparingTo(BigDecimal.valueOf(25.00));
    }

    @Test
    void computeOptionResults_noVotes_zeroPercentages() {
        VoteOption optA = option("Pizza");
        VoteOption optB = option("Sushi");

        List<LiveVoteUpdate.OptionResult> results = service.computeOptionResults(
                List.of(optA, optB), List.of());

        results.forEach(r -> assertThat(r.percentage()).isEqualByComparingTo(BigDecimal.ZERO));
    }

    @Test
    void findTiedOptions_withTie_returnsAll() {
        VoteSession session = new VoteSession();
        session.setMode(VoteMode.MAJORITY);
        VoteOption optA = option("Pizza");
        VoteOption optB = option("Sushi");
        session.setOptions(List.of(optA, optB));

        Vote v1 = vote(optA);
        Vote v2 = vote(optB); // égalité 1-1

        List<VoteOption> tied = service.findTiedOptions(session, List.of(v1, v2));
        assertThat(tied).hasSize(2);
    }

    @Test
    void findTiedOptions_clearWinner_returnsOne() {
        VoteSession session = new VoteSession();
        session.setMode(VoteMode.MAJORITY);
        VoteOption optA = option("Pizza");
        VoteOption optB = option("Sushi");
        session.setOptions(List.of(optA, optB));

        Vote v1 = vote(optA); Vote v2 = vote(optA); // Pizza gagne 2-1
        Vote v3 = vote(optB);

        List<VoteOption> tied = service.findTiedOptions(session, List.of(v1, v2, v3));
        assertThat(tied).hasSize(1);
        assertThat(tied.get(0).getLabel()).isEqualTo("Pizza");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private VoteOption option(String label) {
        VoteOption o = new VoteOption();
        o.setId(UUID.randomUUID());
        o.setLabel(label);
        return o;
    }

    private Vote vote(VoteOption option) {
        return voteWithPoints(option, 1);
    }

    private Vote voteWithPoints(VoteOption option, int points) {
        Vote v = new Vote();
        v.setId(UUID.randomUUID());
        v.setOption(option);
        v.setPoints(points);
        return v;
    }

    private LiveVoteUpdate.OptionResult find(List<LiveVoteUpdate.OptionResult> list, UUID id) {
        return list.stream().filter(r -> r.optionId().equals(id)).findFirst().orElseThrow();
    }
}
