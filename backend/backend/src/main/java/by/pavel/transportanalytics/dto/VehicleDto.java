package by.pavel.transportanalytics.dto;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

@Data
public class VehicleDto implements Serializable {
    private Long id;
    private String plateNumber;
    private String model;
    private Integer year;
    private BigDecimal fuelNorm;
    private List<RepairDto> repairs;
    private List<TripDto> trips;
    private Double currentFuelLevel;
    private Double lastLatitude;
    private Double lastLongitude;
    private String status;
}
