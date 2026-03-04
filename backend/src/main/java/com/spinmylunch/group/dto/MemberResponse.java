package com.spinmylunch.group.dto;

import com.spinmylunch.domain.group.GroupRole;

import java.time.Instant;
import java.util.UUID;

public record MemberResponse(
    UUID      id,
    UUID      userId,
    String    name,
    String    pictureUrl,
    GroupRole role,
    Instant   joinedAt
) {}
