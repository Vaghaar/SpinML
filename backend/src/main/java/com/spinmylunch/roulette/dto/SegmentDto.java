package com.spinmylunch.roulette.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.UUID;

public record SegmentDto(
        UUID id,           // null à la création, renseigné à la modification

        @NotBlank(message = "Le label du segment est requis")
        @Size(max = 255)
        String label,

        @DecimalMin(value = "0.01", message = "Le poids doit être supérieur à 0")
        @DecimalMax(value = "9999.9999", message = "Le poids est trop élevé")
        BigDecimal weight,

        @NotBlank(message = "La couleur est requise")
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Format couleur invalide (#RRGGBB)")
        String color,

        @Min(0)
        Integer position
) {}
