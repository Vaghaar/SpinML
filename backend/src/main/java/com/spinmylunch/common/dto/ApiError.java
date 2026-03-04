package com.spinmylunch.common.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.spinmylunch.common.exception.ErrorCode;

import java.time.Instant;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        String code,
        String message,
        List<FieldError> errors,

        @JsonFormat(shape = JsonFormat.Shape.STRING)
        Instant timestamp
) {
    public record FieldError(String field, String message) {}

    public static ApiError of(ErrorCode errorCode) {
        return new ApiError(errorCode.name(), errorCode.getDefaultMessage(), null, Instant.now());
    }

    public static ApiError of(ErrorCode errorCode, String message) {
        return new ApiError(errorCode.name(), message, null, Instant.now());
    }

    public static ApiError of(ErrorCode errorCode, List<FieldError> errors) {
        return new ApiError(errorCode.name(), errorCode.getDefaultMessage(), errors, Instant.now());
    }
}
