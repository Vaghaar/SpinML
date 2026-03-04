package com.spinmylunch.group;

import com.spinmylunch.auth.security.CurrentUser;
import com.spinmylunch.domain.user.User;
import com.spinmylunch.group.dto.*;
import com.spinmylunch.group.service.GroupService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    /** GET /api/v1/groups — mes groupes */
    @GetMapping
    public ResponseEntity<List<GroupResponse>> getMyGroups(@CurrentUser User user) {
        return ResponseEntity.ok(groupService.getMyGroups(user));
    }

    /** POST /api/v1/groups */
    @PostMapping
    public ResponseEntity<GroupResponse> create(
            @Valid @RequestBody CreateGroupRequest request,
            @CurrentUser User user
    ) {
        GroupResponse group = groupService.create(request, user);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(group.id()).toUri();
        return ResponseEntity.created(location).body(group);
    }

    /** GET /api/v1/groups/:id */
    @GetMapping("/{id}")
    public ResponseEntity<GroupResponse> getById(@PathVariable UUID id, @CurrentUser User user) {
        return ResponseEntity.ok(groupService.getById(id, user));
    }

    /** POST /api/v1/groups/join */
    @PostMapping("/join")
    public ResponseEntity<GroupResponse> join(
            @RequestBody JoinGroupRequest request,
            @CurrentUser User user
    ) {
        return ResponseEntity.ok(groupService.join(request.inviteCode(), user));
    }

    /** GET /api/v1/groups/:id/members */
    @GetMapping("/{id}/members")
    public ResponseEntity<List<MemberResponse>> getMembers(
            @PathVariable UUID id,
            @CurrentUser User user
    ) {
        return ResponseEntity.ok(groupService.getMembers(id, user));
    }

    /** DELETE /api/v1/groups/:groupId/members/:userId */
    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID groupId,
            @PathVariable UUID userId,
            @CurrentUser User user
    ) {
        groupService.removeMember(groupId, userId, user);
        return ResponseEntity.noContent().build();
    }
}
