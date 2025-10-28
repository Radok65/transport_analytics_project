package by.pavel.transportanalytics.dto;

import lombok.Data;

@Data
public class DriverDto {
    private Long id;
    private String fullName;
    private String contact;
    private Long assignedVehicleId;
}