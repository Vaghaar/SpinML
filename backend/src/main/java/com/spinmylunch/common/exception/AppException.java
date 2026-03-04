package com.spinmylunch.common.exception;

import lombok.Getter;

@Getter
public class AppException extends RuntimeException {

    private final ErrorCode errorCode;

    private AppException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public static AppException of(ErrorCode errorCode) {
        return new AppException(errorCode, errorCode.getDefaultMessage());
    }

    public static AppException of(ErrorCode errorCode, String message) {
        return new AppException(errorCode, message);
    }
}
