package by.pavel.transportanalytics.controller;

import by.pavel.transportanalytics.dto.DestinationDto;
import by.pavel.transportanalytics.service.DestinationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/destinations")
@RequiredArgsConstructor
public class DestinationController {

    private final DestinationService destinationService;

    @GetMapping
    public ResponseEntity<List<DestinationDto>> getAll() {
        return ResponseEntity.ok(destinationService.getAllDestinations());
    }

    // Создавать могут только администраторы, либо просто авторизованные пользователи
    // (настроим в SecurityConfig, но пока открываем доступ для фронта)
    @PostMapping
    public ResponseEntity<DestinationDto> create(@RequestBody DestinationDto dto) {
        return ResponseEntity.ok(destinationService.createDestination(dto));
    }
}