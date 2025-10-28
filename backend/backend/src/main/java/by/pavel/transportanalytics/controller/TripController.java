package by.pavel.transportanalytics.controller;

import by.pavel.transportanalytics.dto.TripDto;
import by.pavel.transportanalytics.service.TripService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Все операции с поездками - только для админа
public class TripController {

    private final TripService tripService;

    @PutMapping("/{id}")
    public ResponseEntity<TripDto> updateTrip(@PathVariable Long id, @RequestBody TripDto tripDto) {
        TripDto updatedTrip = tripService.updateTrip(id, tripDto);
        return ResponseEntity.ok(updatedTrip);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(@PathVariable Long id) {
        tripService.deleteTrip(id);
        return ResponseEntity.noContent().build();
    }
}