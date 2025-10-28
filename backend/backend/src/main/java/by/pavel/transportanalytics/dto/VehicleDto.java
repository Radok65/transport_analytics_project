package by.pavel.transportanalytics.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class VehicleDto {
    private Long id;
    private String plateNumber;
    private String model;
    private Integer year;
    private BigDecimal fuelNorm;
    private List<RepairDto> repairs;
    private List<TripDto> trips;
}
