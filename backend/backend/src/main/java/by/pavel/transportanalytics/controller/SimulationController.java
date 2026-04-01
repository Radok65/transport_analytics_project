package by.pavel.transportanalytics.controller;

import by.pavel.transportanalytics.dto.SimulationRequestDto;
import by.pavel.transportanalytics.dto.SimulationResponseDto;
import by.pavel.transportanalytics.service.SimulationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/simulation")
@RequiredArgsConstructor
public class SimulationController {

    private final SimulationService simulationService;

    @PostMapping("/start")
    public ResponseEntity<SimulationResponseDto> startSimulation(@RequestBody SimulationRequestDto request) {
        return ResponseEntity.ok(simulationService.startSimulation(request));
    }
}