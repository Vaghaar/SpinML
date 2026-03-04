package com.spinmylunch.group.dto;

import jakarta.validation.constraints.NotBlank;

public record JoinGroupRequest(@NotBlank String inviteCode) {}
