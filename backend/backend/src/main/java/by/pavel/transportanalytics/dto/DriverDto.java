package by.pavel.transportanalytics.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class DriverDto implements Serializable {
    private Long id;
    private String fullName;
    private String contact;
    private Long assignedVehicleId;
}