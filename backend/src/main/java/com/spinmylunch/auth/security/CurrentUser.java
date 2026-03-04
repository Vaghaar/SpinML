package com.spinmylunch.auth.security;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.lang.annotation.*;

/**
 * Injecte l'utilisateur courant dans les méthodes de contrôleur.
 *
 * <pre>
 * public ResponseEntity<?> example(@CurrentUser User user) { ... }
 * </pre>
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@AuthenticationPrincipal
public @interface CurrentUser {}
