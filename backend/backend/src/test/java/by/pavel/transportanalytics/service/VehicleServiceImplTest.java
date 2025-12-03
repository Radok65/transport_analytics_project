package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.VehicleDto;
import by.pavel.transportanalytics.model.Driver;
import by.pavel.transportanalytics.model.Vehicle;
import by.pavel.transportanalytics.repository.DriverRepository;
import by.pavel.transportanalytics.repository.VehicleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VehicleServiceImplTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private DriverRepository driverRepository;

    @InjectMocks
    private VehicleServiceImpl vehicleService;

    @Test
    void findAllVehicles_ShouldReturnDtoList() {
        // Arrange
        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);
        vehicle.setPlateNumber("1234 AB-7");
        vehicle.setModel("Volvo");
        vehicle.setYear(2020);
        vehicle.setFuelNorm(new BigDecimal("25.5"));

        when(vehicleRepository.findAll()).thenReturn(List.of(vehicle));

        // Act
        List<VehicleDto> result = vehicleService.findAllVehicles();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("1234 AB-7", result.get(0).getPlateNumber());
        verify(vehicleRepository, times(1)).findAll();
    }

    @Test
    void deleteVehicle_ShouldUnassignDriverAndDelete() {
        // Arrange
        Long vehicleId = 1L;
        Vehicle vehicle = new Vehicle();
        vehicle.setId(vehicleId);

        Driver driver = new Driver();
        driver.setId(10L);
        driver.setAssignedVehicle(vehicle);

        when(vehicleRepository.findById(vehicleId)).thenReturn(Optional.of(vehicle));
        when(driverRepository.findByAssignedVehicleId(vehicleId)).thenReturn(Optional.of(driver));

        // Act
        vehicleService.deleteVehicle(vehicleId);

        // Assert
        // Проверяем, что у водителя обнулилась машина
        assertNull(driver.getAssignedVehicle());
        // Проверяем, что вызвалось сохранение водителя
        verify(driverRepository, times(1)).save(driver);
        // Проверяем, что вызвалось удаление машины
        verify(vehicleRepository, times(1)).delete(vehicle);
    }
}