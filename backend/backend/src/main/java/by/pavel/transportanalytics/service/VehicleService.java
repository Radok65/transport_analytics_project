package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.VehicleDto;
import java.util.List;

public interface VehicleService {
    List<VehicleDto> findAllVehicles();
    VehicleDto findVehicleById(Long id);
    VehicleDto createVehicle(VehicleDto vehicleDto);
    VehicleDto updateVehicle(Long id, VehicleDto vehicleDto);
    void deleteVehicle(Long id);
}