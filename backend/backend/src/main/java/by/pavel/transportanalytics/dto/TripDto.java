package by.pavel.transportanalytics.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TripDto {
    private Long id;
    private LocalDate date;
    private Long driverId;
    private Integer mileageStart;
    private Integer mileageEnd;
    private BigDecimal fuelUsed;
}
