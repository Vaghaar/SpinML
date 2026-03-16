package com.spinmylunch.auth.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.spinmylunch.auth.dto.GoogleUserInfo;
import com.spinmylunch.common.exception.AppException;
import com.spinmylunch.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Échange un authorization code Google contre des tokens,
 * puis récupère les informations de l'utilisateur.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GoogleOAuthService {

    private static final String TOKEN_URL    = "https://oauth2.googleapis.com/token";
    private static final String USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

    private final RestTemplate  restTemplate;
    private final ObjectMapper  objectMapper;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String clientSecret;

    /**
     * Échange le code d'autorisation contre un access token Google,
     * puis récupère les infos utilisateur.
     */
    public GoogleUserInfo fetchUserInfo(String code, String redirectUri) {
        String accessToken = exchangeCodeForToken(code, redirectUri);
        return fetchUserInfoWithToken(accessToken);
    }

    // ─── Privé ────────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private String exchangeCodeForToken(String code, String redirectUri) {
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code",          code);
        params.add("client_id",     clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri",  redirectUri);
        params.add("grant_type",    "authorization_code");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(TOKEN_URL, request, Map.class);
            Map<String, Object> body = response.getBody();

            if (body == null || !body.containsKey("access_token")) {
                log.error("Réponse token Google inattendue : {}", body);
                throw AppException.of(ErrorCode.GOOGLE_AUTH_FAILED);
            }
            return (String) body.get("access_token");
        } catch (RestClientException e) {
            log.error("Erreur lors de l'échange du code Google : {}", e.getMessage());
            throw AppException.of(ErrorCode.GOOGLE_AUTH_FAILED);
        }
    }

    private GoogleUserInfo fetchUserInfoWithToken(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    USERINFO_URL, HttpMethod.GET, request, Map.class);
            Map<?, ?> body = response.getBody();

            if (body == null) throw AppException.of(ErrorCode.GOOGLE_AUTH_FAILED);

            return new GoogleUserInfo(
                    (String)  body.get("sub"),
                    (String)  body.get("email"),
                    Boolean.TRUE.equals(body.get("email_verified")),
                    (String)  body.get("name"),
                    (String)  body.get("picture"),
                    (String)  body.get("given_name"),
                    (String)  body.get("family_name")
            );
        } catch (RestClientException e) {
            log.error("Erreur lors de la récupération du profil Google : {}", e.getMessage());
            throw AppException.of(ErrorCode.GOOGLE_AUTH_FAILED);
        }
    }
}
