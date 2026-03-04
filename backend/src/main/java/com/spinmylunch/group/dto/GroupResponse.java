package com.spinmylunch.group.dto;

import java.time.Instant;
import java.util.UUID;

public record GroupResponse(
    UUID    id,
    String  name,
    String  inviteCode,
    String  inviteQrUrl,
    int     memberCount,
    Instant createdAt
) {}
