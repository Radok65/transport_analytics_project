package by.pavel.transportanalytics.controller;

import by.pavel.transportanalytics.dto.TelematicsAlertDto;
import by.pavel.transportanalytics.dto.TelematicsDataDto;
import by.pavel.transportanalytics.model.TelematicsAlert;
import by.pavel.transportanalytics.model.TelematicsData;
import by.pavel.transportanalytics.repository.TelematicsAlertRepository;
import by.pavel.transportanalytics.repository.TelematicsDataRepository;
import by.pavel.transportanalytics.service.TelematicsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/telematics")
@RequiredArgsConstructor
public class TelematicsController {

    private final TelematicsService telematicsService;
    private final TelematicsDataRepository dataRepository;
    private final TelematicsAlertRepository alertRepository;

    @PostMapping("/data")
    public ResponseEntity<String> receiveTelematicsData(@RequestBody TelematicsDataDto dataDto) {
        telematicsService.processIncomingData(dataDto);
        return ResponseEntity.ok("Данные телематики успешно обработаны");
    }

    @GetMapping("/vehicle/{vehicleId}/history")
    public ResponseEntity<List<TelematicsDataDto>> getVehicleHistory(@PathVariable Long vehicleId) {
        List<TelematicsData> history = dataRepository.findAllByVehicleIdOrderByTimestampDesc(vehicleId);
        List<TelematicsDataDto> dtoList = history.stream().map(data -> TelematicsDataDto.builder()
                .vehicleId(data.getVehicle().getId())
                .plateNumber(data.getVehicle().getPlateNumber())
                .tripId(data.getTrip() != null ? data.getTrip().getId() : null)
                .timestamp(data.getTimestamp())
                .latitude(data.getLatitude())
                .longitude(data.getLongitude())
                .speed(data.getSpeed())
                .fuelLevel(data.getFuelLevel())
                .weatherCondition(data.getWeatherCondition())
                .temperature(data.getTemperature())
                .build()
        ).collect(Collectors.toList());
        return ResponseEntity.ok(dtoList);
    }

    @GetMapping("/alerts")
    public ResponseEntity<List<TelematicsAlertDto>> getAllAlerts() {
        List<TelematicsAlert> alerts = alertRepository.findAll(Sort.by(Sort.Direction.DESC, "timestamp"));
        List<TelematicsAlertDto> dtoList = alerts.stream().map(alert -> TelematicsAlertDto.builder()
                .id(alert.getId())
                .vehicleId(alert.getVehicle().getId())
                .plateNumber(alert.getVehicle().getPlateNumber())
                .timestamp(alert.getTimestamp())
                .type(alert.getType())
                .latitude(alert.getLatitude())
                .longitude(alert.getLongitude())
                .description(alert.getDescription())
                .financialLoss(alert.getFinancialLoss())
                .build()
        ).collect(Collectors.toList());
        return ResponseEntity.ok(dtoList);
    }

    @PostMapping("/alerts/arrival")
    public ResponseEntity<String> createArrivalAlert(
            @RequestParam Long vehicleId,
            @RequestParam String destinationName) {
        telematicsService.createArrivalAlert(vehicleId, destinationName);
        return ResponseEntity.ok("Уведомление о прибытии добавлено в ленту");
    }

}