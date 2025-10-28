package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.DriverDto;
import java.util.List;

public interface DriverService {
    List<DriverDto> findAllDrivers();
    DriverDto createDriver(DriverDto driverDto);
    DriverDto updateDriver(Long id, DriverDto driverDto);
    void deleteDriver(Long id);
}