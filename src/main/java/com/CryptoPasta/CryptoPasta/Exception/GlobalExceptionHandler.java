package com.CryptoPasta.CryptoPasta.Exception;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice(basePackages = "com.CryptoPasta.CryptoPasta.Controller")
public class GlobalExceptionHandler {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleInvalidRequestBody(
            MethodArgumentNotValidException exception
    ) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();

        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(
                    fieldError.getField(),
                    fieldError.getDefaultMessage() == null
                            ? "Invalid value."
                            : fieldError.getDefaultMessage()
            );
        }

        return ResponseEntity.badRequest()
                .body(new ApiError("Request validation failed.", fieldErrors));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(
            ConstraintViolationException exception
    ) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();

        for (ConstraintViolation<?> violation : exception.getConstraintViolations()) {
            fieldErrors.putIfAbsent(
                    violation.getPropertyPath().toString(),
                    violation.getMessage()
            );
        }

        return ResponseEntity.badRequest()
                .body(new ApiError("Request validation failed.", fieldErrors));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadableRequest(
            HttpMessageNotReadableException exception
    ) {
        return ResponseEntity.badRequest()
                .body(new ApiError("Request body is missing or malformed.", Map.of()));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> handleMissingParameter(
            MissingServletRequestParameterException exception
    ) {
        return ResponseEntity.badRequest()
                .body(new ApiError(
                        "Required parameter is missing: " + exception.getParameterName(),
                        Map.of()
                ));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(
            MethodArgumentTypeMismatchException exception
    ) {
        return ResponseEntity.badRequest()
                .body(new ApiError(
                        "Invalid value for parameter: " + exception.getName(),
                        Map.of()
                ));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleExpectedApiError(
            ResponseStatusException exception
    ) {
        String message = exception.getReason() == null
                ? "Request could not be completed."
                : exception.getReason();

        return ResponseEntity.status(exception.getStatusCode())
                .body(new ApiError(message, Map.of()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpectedError(Exception exception) {
        LOGGER.error("Unhandled API exception", exception);

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError(
                        "An unexpected server error occurred.",
                        Map.of()
                ));
    }

    public record ApiError(String message, Map<String, String> fieldErrors) {
    }
}