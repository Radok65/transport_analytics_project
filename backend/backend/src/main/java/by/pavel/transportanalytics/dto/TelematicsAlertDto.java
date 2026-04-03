package by.pavel.transportanalytics.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class TelematicsAlertDto {
    private Long id;
    private Long vehicleId;
    private String plateNumber;
    private LocalDateTime timestamp;
    private String type;
    private Double latitude;
    private Double longitude;
    private String description;
    private BigDecimal financialLoss;
}