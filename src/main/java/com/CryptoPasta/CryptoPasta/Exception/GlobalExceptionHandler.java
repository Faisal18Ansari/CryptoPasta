package com.CryptoPasta.CryptoPasta.Exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice(basePackages = "com.CryptoPasta.CryptoPasta.Controller")
public class GlobalExceptionHandler {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleInvalidRequestBody(
            MethodArgumentNotValidException exception,
            HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();

        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(
                    fieldError.getField(),
                    fieldError.getDefaultMessage() == null
                            ? "Invalid value."
                            : fieldError.getDefaultMessage()
            );
        }

        return createResponse(
                HttpStatus.BAD_REQUEST,
                "Request validation failed.",
                request,
                fieldErrors
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(
            ConstraintViolationException exception,
            HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();

        for (ConstraintViolation<?> violation : exception.getConstraintViolations()) {
            fieldErrors.putIfAbsent(
                    violation.getPropertyPath().toString(),
                    violation.getMessage()
            );
        }

        return createResponse(
                HttpStatus.BAD_REQUEST,
                "Request validation failed.",
                request,
                fieldErrors
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadableRequest(
            HttpMessageNotReadableException exception,
            HttpServletRequest request) {
        return createResponse(
                HttpStatus.BAD_REQUEST,
                "Request body is missing or malformed.",
                request
        );
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> handleMissingParameter(
            MissingServletRequestParameterException exception,
            HttpServletRequest request) {
        return createResponse(
                HttpStatus.BAD_REQUEST,
                "Required parameter is missing: " + exception.getParameterName(),
                request
        );
    }

    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ApiError> handleMissingHeader(
            MissingRequestHeaderException exception,
            HttpServletRequest request) {
        return createResponse(
                HttpStatus.BAD_REQUEST,
                "Required header is missing: " + exception.getHeaderName(),
                request
        );
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(
            MethodArgumentTypeMismatchException exception,
            HttpServletRequest request) {
        return createResponse(
                HttpStatus.BAD_REQUEST,
                "Invalid value for parameter: " + exception.getName(),
                request
        );
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleExpectedApiError(
            ResponseStatusException exception,
            HttpServletRequest request) {
        String message = exception.getReason() == null
                ? "Request could not be completed."
                : exception.getReason();

        return createResponse(exception.getStatusCode(), message, request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpectedError(
            Exception exception,
            HttpServletRequest request) {
        LOGGER.error("Unhandled API exception at {}", request.getRequestURI(), exception);

        return createResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected server error occurred.",
                request
        );
    }

    private ResponseEntity<ApiError> createResponse(
            HttpStatusCode status,
            String message,
            HttpServletRequest request) {
        return createResponse(status, message, request, Map.of());
    }

    private ResponseEntity<ApiError> createResponse(
            HttpStatusCode status,
            String message,
            HttpServletRequest request,
            Map<String, String> fieldErrors) {
        HttpStatus knownStatus = HttpStatus.resolve(status.value());
        String error = knownStatus == null
                ? "HTTP Error"
                : knownStatus.getReasonPhrase();

        ApiError body = new ApiError(
                status.value(),
                error,
                message,
                request.getRequestURI(),
                Instant.now(),
                fieldErrors
        );

        return ResponseEntity.status(status).body(body);
    }

    public record ApiError(
            int status,
            String error,
            String message,
            String path,
            Instant timestamp,
            Map<String, String> fieldErrors) {
    }
}