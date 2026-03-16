package com.spinmylunch.config;

import com.spinmylunch.auth.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final AppProperties           appProperties;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                // ─── Session stateless (JWT) ──────────────────────────────────
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // ─── CSRF désactivé (API REST + JWT) ─────────────────────────
                .csrf(AbstractHttpConfigurer::disable)

                // ─── CORS ─────────────────────────────────────────────────────
                .cors(c -> c.configurationSource(corsConfigurationSource()))

                // ─── Headers de sécurité ──────────────────────────────────────
                .headers(h -> {
                        h.frameOptions(f -> f.deny());
                        h.xssProtection(x -> x.disable());
                        h.httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31_536_000));
                        h.addHeaderWriter(new ReferrerPolicyHeaderWriter(
                                ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN));
                        h.permissionsPolicy(p -> p.policy(
                                "geolocation=(), microphone=(), camera=(), payment=()"));
                        h.contentSecurityPolicy(c -> c.policyDirectives(
                                "default-src 'none'; " +
                                "base-uri 'self'; " +
                                "script-src 'self'; " +
                                "style-src 'self'; " +
                                "img-src 'self' data: https://lh3.googleusercontent.com; " +
                                "font-src 'self'; " +
                                "connect-src 'self'; " +
                                "frame-ancestors 'none'; " +
                                "form-action 'self'"));
                })

                // ─── Endpoints publics vs protégés ────────────────────────────
                .authorizeHttpRequests(auth -> auth
                        // Auth
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/name").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/guest").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/refresh").permitAll()
                        // Actuator (health public, autres protégés)
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/actuator/**").hasRole("ADMIN")
                        // WebSocket
                        .requestMatchers("/ws/**").permitAll()
                        // Stats
                        .requestMatchers("/api/v1/stats/**").authenticated()
                        // Tout le reste nécessite une auth
                        .anyRequest().authenticated()
                )

                // ─── Filtre JWT avant le filtre username/password ─────────────
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)

                // ─── Réponse 401 personnalisée ────────────────────────────────
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((req, res, ex) -> {
                            res.setStatus(401);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write("""
                                    {"code":"UNAUTHORIZED","message":"Token manquant ou invalide"}""");
                        })
                        .accessDeniedHandler((req, res, ex) -> {
                            res.setStatus(403);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write("""
                                    {"code":"FORBIDDEN","message":"Accès refusé"}""");
                        })
                )

                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(appProperties.cors().allowedOrigins());
        config.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization","Content-Type","X-Requested-With"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        source.registerCorsConfiguration("/ws/**", config);
        return source;
    }
}
