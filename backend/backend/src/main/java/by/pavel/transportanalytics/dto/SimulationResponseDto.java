package by.pavel.transportanalytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulationResponseDto {
    private boolean success;
    private String message;
    private double distanceKm;
    private double fuelNeeded;
    private double currentFuel;
    private List<double[]> pathPoints;
}