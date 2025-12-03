package by.pavel.transportanalytics.controller;

import by.pavel.transportanalytics.dto.AnalyticsDto;
import by.pavel.transportanalytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping
    public ResponseEntity<AnalyticsDto> getAnalytics(@RequestParam(required = false) Long vehicleId) {
        if (vehicleId != null) {
            return ResponseEntity.ok(analyticsService.getVehicleAnalytics(vehicleId));
        }
        return ResponseEntity.ok(analyticsService.getGlobalAnalytics());
    }
}
