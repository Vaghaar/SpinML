package com.spinmylunch.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

@ConfigurationProperties(prefix = "app")
@Validated
public record AppProperties(
        Jwt jwt,
        @NotBlank String frontendUrl,
        Cors cors,
        RateLimit rateLimit,
        Anonymization anonymization
) {
    public record Jwt(
            @NotBlank String secret,
            @DefaultValue("900")    long accessTokenExpiration,    // seconds
            @DefaultValue("604800") long refreshTokenExpiration,   // seconds
            @DefaultValue("true")   boolean cookieSecure           // false en dev HTTP
    ) {}

    public record Cors(
            @NotEmpty List<String> allowedOrigins
    ) {}

    public record RateLimit(
            @DefaultValue("100") int requestsPerMinute,
            @DefaultValue("10")  int spinsPerMinute,
            @DefaultValue("5")   int voteSessionsPerHour
    ) {}

    public record Anonymization(
            @DefaultValue("12") @Min(1) int inactiveMonths
    ) {}
}
