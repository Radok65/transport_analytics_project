package by.pavel.transportanalytics.dto;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class TripDto implements Serializable {
    private Long id;
    private LocalDate date;
    private Long driverId;
    private Integer mileageStart;
    private Integer mileageEnd;
    private BigDecimal fuelUsed;
}
