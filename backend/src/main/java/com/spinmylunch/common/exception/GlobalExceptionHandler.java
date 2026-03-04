package com.spinmylunch.common.exception;

import com.spinmylunch.common.dto.ApiError;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiError> handleAppException(AppException ex) {
        ErrorCode code = ex.getErrorCode();
        if (code.getStatus().is5xxServerError()) {
            log.error("Erreur applicative [{}] : {}", code, ex.getMessage(), ex);
        } else {
            log.debug("Erreur applicative [{}] : {}", code, ex.getMessage());
        }
        return ResponseEntity
                .status(code.getStatus())
                .body(ApiError.of(code, ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        List<ApiError.FieldError> fieldErrors = ex.getBindingResult()
                .getAllErrors()
                .stream()
                .map(e -> {
                    String field = (e instanceof FieldError fe) ? fe.getField() : e.getObjectName();
                    return new ApiError.FieldError(field, e.getDefaultMessage());
                })
                .toList();

        return ResponseEntity
                .badRequest()
                .body(ApiError.of(ErrorCode.VALIDATION_ERROR, fieldErrors));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex) {
        log.error("Erreur inattendue : {}", ex.getMessage(), ex);
        return ResponseEntity
                .internalServerError()
                .body(ApiError.of(ErrorCode.INTERNAL_ERROR));
    }
}
