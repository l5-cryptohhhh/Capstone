package org.example.capstone.common;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    PLAYER_NOT_FOUND(HttpStatus.NOT_FOUND),
    LEAGUE_NOT_FOUND(HttpStatus.NOT_FOUND),
    INVALID_REQUEST(HttpStatus.BAD_REQUEST),
    INSUFFICIENT_DATA(HttpStatus.UNPROCESSABLE_ENTITY),
    QUERY_NOT_INTERPRETABLE(HttpStatus.UNPROCESSABLE_ENTITY),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED),
    RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS),
    QUOTA_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS),
    UPSTREAM_FOOTBALL_API_ERROR(HttpStatus.BAD_GATEWAY),
    AI_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE),
    DATABASE_ERROR(HttpStatus.INTERNAL_SERVER_ERROR),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }

    public HttpStatus status() {
        return status;
    }
}
