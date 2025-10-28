package by.pavel.transportanalytics.controller;

import by.pavel.transportanalytics.dto.RepairDto;
import by.pavel.transportanalytics.dto.TripDto;
import by.pavel.transportanalytics.dto.VehicleDto;
import by.pavel.transportanalytics.service.RepairServiceImpl;
import by.pavel.transportanalytics.service.TripServiceImpl;
import by.pavel.transportanalytics.service.VehicleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;
    private final RepairServiceImpl repairService; // Используем реализацию
    private final TripServiceImpl tripService;     // Используем реализацию

    @GetMapping
    public ResponseEntity<List<VehicleDto>> getAllVehicles() {
        List<VehicleDto> vehicles = vehicleService.findAllVehicles();
        return ResponseEntity.ok(vehicles);
    }

    @GetMapping("/{id}")
    public ResponseEntity<VehicleDto> getVehicleById(@PathVariable Long id) {
        VehicleDto vehicle = vehicleService.findVehicleById(id);
        return ResponseEntity.ok(vehicle);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VehicleDto> createVehicle(@RequestBody VehicleDto vehicleDto) {
        VehicleDto createdVehicle = vehicleService.createVehicle(vehicleDto);
        return new ResponseEntity<>(createdVehicle, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VehicleDto> updateVehicle(@PathVariable Long id, @RequestBody VehicleDto vehicleDto) {
        VehicleDto updatedVehicle = vehicleService.updateVehicle(id, vehicleDto);
        return ResponseEntity.ok(updatedVehicle);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        vehicleService.deleteVehicle(id);
        return ResponseEntity.noContent().build();
    }

    // --- Эндпоинты для связанных сущностей ---

    @PostMapping("/{vehicleId}/repairs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RepairDto> addRepairToVehicle(@PathVariable Long vehicleId, @RequestBody RepairDto repairDto) {
        RepairDto createdRepair = repairService.addRepairToVehicle(vehicleId, repairDto);
        return new ResponseEntity<>(createdRepair, HttpStatus.CREATED);
    }

    @PostMapping("/{vehicleId}/trips")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TripDto> addTripToVehicle(@PathVariable Long vehicleId, @RequestBody TripDto tripDto) {
        // Вызываем специальный метод из сервиса, который мы создали
        TripDto createdTrip = tripService.addTripToVehicle(vehicleId, tripDto);
        return new ResponseEntity<>(createdTrip, HttpStatus.CREATED);
    }
}