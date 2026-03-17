package com.spinmylunch.group.dto;

import com.spinmylunch.domain.group.GroupRole;

import java.time.Instant;
import java.util.UUID;

public record MemberJoinedMessage(
    UUID      groupId,
    UUID      memberId,
    UUID      userId,
    String    name,
    String    pictureUrl,
    GroupRole role,
    Instant   joinedAt
) {}
