package org.example.capstone.common;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

/** Formato unico di errore restituito da tutta l'API. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(Instant timestamp, int status, ErrorCode code, String message, String path,
                       List<String> details) {
}
