package by.pavel.transportanalytics.exception;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.Map;

@ControllerAdvice
public class RestExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    protected ResponseEntity<Object> handleEntityNotFound(EntityNotFoundException ex) {
        Map<String, String> body = Map.of(
                "status", "error",
                "message", ex.getMessage()
        );
        return new ResponseEntity<>(body, HttpStatus.NOT_FOUND);
    }

    // --- ДОБАВЛЕННЫЙ ОБРАБОТЧИК ---
    @ExceptionHandler(IllegalStateException.class)
    protected ResponseEntity<Object> handleIllegalState(IllegalStateException ex) {
        Map<String, String> body = Map.of(
                "status", "error",
                "message", ex.getMessage()
        );
        // Статус 409 Conflict отлично подходит для ситуаций,
        // когда действие не может быть выполнено из-за текущего состояния системы.
        return new ResponseEntity<>(body, HttpStatus.CONFLICT);
    }
}
