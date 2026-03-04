package com.spinmylunch.group;

import com.spinmylunch.common.exception.AppException;
import com.spinmylunch.domain.user.User;
import com.spinmylunch.domain.user.UserRepository;
import com.spinmylunch.group.dto.CreateGroupRequest;
import com.spinmylunch.group.dto.GroupResponse;
import com.spinmylunch.group.dto.MemberResponse;
import com.spinmylunch.group.service.GroupService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class GroupServiceIntegrationTest {

    @Autowired GroupService  groupService;
    @Autowired UserRepository userRepository;

    private User admin;
    private User member;

    @BeforeEach
    void setUp() {
        admin  = user("admin");
        member = user("member");
    }

    @Test
    void create_persistsGroupAndAdminMember() {
        GroupResponse group = groupService.create(new CreateGroupRequest("Équipe Midi"), admin);

        assertThat(group.id()).isNotNull();
        assertThat(group.name()).isEqualTo("Équipe Midi");
        assertThat(group.inviteCode()).hasSize(8);
        assertThat(group.memberCount()).isEqualTo(1);
    }

    @Test
    void join_addsMember() {
        GroupResponse group = groupService.create(new CreateGroupRequest("Test Group"), admin);

        GroupResponse joined = groupService.join(group.inviteCode(), member);

        assertThat(joined.memberCount()).isEqualTo(2);
    }

    @Test
    void join_duplicateMember_throws() {
        GroupResponse group = groupService.create(new CreateGroupRequest("Test Group"), admin);
        groupService.join(group.inviteCode(), member);

        assertThatThrownBy(() -> groupService.join(group.inviteCode(), member))
                .isInstanceOf(AppException.class)
                .hasMessageContaining("déjà membre");
    }

    @Test
    void join_invalidCode_throws() {
        assertThatThrownBy(() -> groupService.join("INVALID1", member))
                .isInstanceOf(AppException.class);
    }

    @Test
    void getMembers_returnsAllMembers() {
        GroupResponse group = groupService.create(new CreateGroupRequest("Test Group"), admin);
        groupService.join(group.inviteCode(), member);

        List<MemberResponse> members = groupService.getMembers(group.id(), admin);

        assertThat(members).hasSize(2);
        assertThat(members).extracting(MemberResponse::userId)
                .containsExactlyInAnyOrder(admin.getId(), member.getId());
    }

    @Test
    void removeMember_memberCanLeave() {
        GroupResponse group = groupService.create(new CreateGroupRequest("Test Group"), admin);
        groupService.join(group.inviteCode(), member);

        groupService.removeMember(group.id(), member.getId(), member);

        List<MemberResponse> members = groupService.getMembers(group.id(), admin);
        assertThat(members).hasSize(1);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private User user(String prefix) {
        return userRepository.save(User.builder()
                .email(prefix + "+" + UUID.randomUUID() + "@test.com")
                .name(prefix)
                .build());
    }
}
