package com.spinmylunch.group.service;

import com.spinmylunch.common.exception.AppException;
import com.spinmylunch.common.exception.ErrorCode;
import com.spinmylunch.domain.group.*;
import com.spinmylunch.domain.user.User;
import com.spinmylunch.gamification.service.GamificationService;
import com.spinmylunch.group.dto.*;
import com.spinmylunch.vote.service.VoteNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GroupService {

    private static final String INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int    INVITE_LEN   = 8;

    private final GroupRepository         groupRepository;
    private final GroupMemberRepository   memberRepository;
    private final GamificationService     gamificationService;
    private final VoteNotificationService voteNotificationService;
    private final SecureRandom            secureRandom = new SecureRandom();

    // ─── Créer ───────────────────────────────────────────────────────────────

    @Transactional
    public GroupResponse create(CreateGroupRequest req, User creator) {
        String inviteCode = generateInviteCode();

        Group group = groupRepository.save(Group.builder()
                .name(req.name())
                .admin(creator)
                .inviteCode(inviteCode)
                .build());

        memberRepository.save(GroupMember.builder()
                .group(group)
                .user(creator)
                .role(GroupRole.ADMIN)
                .build());

        gamificationService.awardXpAndCheckBadges(
                creator, GamificationService.XP_CREATE_ROULETTE, "GROUP_CREATOR");

        return toResponse(group, 1);
    }

    // ─── Rejoindre ───────────────────────────────────────────────────────────

    @Transactional
    public GroupResponse join(String inviteCode, User user) {
        Group group = groupRepository.findByInviteCode(inviteCode.toUpperCase())
                .orElseThrow(() -> AppException.of(ErrorCode.GROUP_NOT_FOUND));

        if (memberRepository.existsByGroupIdAndUserId(group.getId(), user.getId())) {
            throw AppException.of(ErrorCode.VALIDATION_ERROR, "Vous êtes déjà membre de ce groupe");
        }

        GroupMember newMember = memberRepository.save(GroupMember.builder()
                .group(group)
                .user(user)
                .role(GroupRole.MEMBER)
                .build());

        gamificationService.awardXpAndCheckBadges(
                user, GamificationService.XP_INVITE_ACCEPTED, null);

        voteNotificationService.broadcastMemberJoined(group.getId(), newMember);

        int count = memberRepository.countByGroupId(group.getId());
        return toResponse(group, count);
    }

    // ─── Lire ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public GroupResponse getById(UUID id, User requester) {
        Group group = groupRepository.findById(id)
                .orElseThrow(() -> AppException.of(ErrorCode.GROUP_NOT_FOUND));
        requireMember(id, requester.getId());
        int count = memberRepository.countByGroupId(id);
        return toResponse(group, count);
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> getMyGroups(User user) {
        return memberRepository.findByUserId(user.getId()).stream()
                .map(gm -> toResponse(gm.getGroup(), memberRepository.countByGroupId(gm.getGroup().getId())))
                .toList();
    }

    // ─── Membres ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MemberResponse> getMembers(UUID groupId, User requester) {
        requireMember(groupId, requester.getId());
        return memberRepository.findByGroupId(groupId).stream()
                .map(gm -> new MemberResponse(
                        gm.getId(),
                        gm.getUser().getId(),
                        gm.getUser().getName(),
                        gm.getUser().getPictureUrl(),
                        gm.getRole(),
                        gm.getJoinedAt()))
                .toList();
    }

    // ─── Supprimer le groupe ─────────────────────────────────────────────────

    @Transactional
    public void delete(UUID id, User requester) {
        Group group = groupRepository.findById(id)
                .orElseThrow(() -> AppException.of(ErrorCode.GROUP_NOT_FOUND));
        if (!group.getAdmin().getId().equals(requester.getId())) {
            throw AppException.of(ErrorCode.FORBIDDEN, "Seul l'admin peut supprimer le groupe");
        }
        groupRepository.delete(group);
    }

    // ─── Quitter / Exclure ───────────────────────────────────────────────────

    @Transactional
    public void removeMember(UUID groupId, UUID targetUserId, User requester) {
        requireMember(groupId, requester.getId());
        boolean isAdmin = memberRepository.findAdminMembership(groupId, requester.getId()).isPresent();
        boolean isSelf  = requester.getId().equals(targetUserId);

        if (!isAdmin && !isSelf) {
            throw AppException.of(ErrorCode.FORBIDDEN);
        }

        GroupMember member = memberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> AppException.of(ErrorCode.GROUP_NOT_FOUND));
        memberRepository.delete(member);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private void requireMember(UUID groupId, UUID userId) {
        if (!memberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw AppException.of(ErrorCode.FORBIDDEN);
        }
    }

    private String generateInviteCode() {
        StringBuilder sb = new StringBuilder(INVITE_LEN);
        for (int i = 0; i < INVITE_LEN; i++) {
            sb.append(INVITE_CHARS.charAt(secureRandom.nextInt(INVITE_CHARS.length())));
        }
        return sb.toString();
    }

    private GroupResponse toResponse(Group g, int memberCount) {
        return new GroupResponse(g.getId(), g.getName(), g.getInviteCode(),
                g.getInviteQrUrl(), memberCount, g.getAdmin().getId(), g.getCreatedAt());
    }
}
