package by.pavel.transportanalytics.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class TelematicsDataDto {
    private Long vehicleId;
    private String plateNumber;
    private Long tripId;
    private LocalDateTime timestamp;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private Double fuelLevel;
    private String weatherCondition;
    private Double temperature;
}