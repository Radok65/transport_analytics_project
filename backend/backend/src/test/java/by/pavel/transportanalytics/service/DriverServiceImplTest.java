package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.DriverDto;
import by.pavel.transportanalytics.model.Driver;
import by.pavel.transportanalytics.model.Trip;
import by.pavel.transportanalytics.repository.DriverRepository;
import by.pavel.transportanalytics.repository.TripRepository;
import by.pavel.transportanalytics.repository.VehicleRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DriverServiceImplTest {

    @Mock
    private DriverRepository driverRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private TripRepository tripRepository;

    @InjectMocks
    private DriverServiceImpl driverService;

    @Test
    @DisplayName("Получение списка всех водителей")
    void findAllDrivers_ReturnsList() {
        Driver driver = new Driver();
        driver.setId(1L);
        driver.setFullName("Иван Иванов");

        when(driverRepository.findAll()).thenReturn(List.of(driver));

        List<DriverDto> result = driverService.findAllDrivers();

        assertEquals(1, result.size());
        assertEquals("Иван Иванов", result.getFirst().getFullName());
        verify(driverRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Создание водителя без привязки к авто")
    void createDriver_WithoutVehicle_Success() {
        DriverDto dto = new DriverDto();
        dto.setFullName("Петр Петров");
        dto.setContact("12345");

        Driver savedDriver = new Driver();
        savedDriver.setId(1L);
        savedDriver.setFullName("Петр Петров");

        when(driverRepository.save(any(Driver.class))).thenReturn(savedDriver);

        DriverDto result = driverService.createDriver(dto);

        assertNotNull(result);
        assertEquals("Петр Петров", result.getFullName());
        verify(vehicleRepository, never()).findById(anyLong());
    }

    @Test
    @DisplayName("Удаление водителя: ошибка, если есть поездки")
    void deleteDriver_HasTrips_ThrowsException() {
        Long driverId = 1L;
        when(tripRepository.findAllByDriverId(driverId)).thenReturn(List.of(new Trip()));

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> driverService.deleteDriver(driverId));

        assertTrue(exception.getMessage().contains("Нельзя удалить водителя"));
        verify(driverRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Успешное удаление водителя")
    void deleteDriver_Success() {
        Long driverId = 1L;
        Driver driver = new Driver();
        driver.setId(driverId);

        when(tripRepository.findAllByDriverId(driverId)).thenReturn(Collections.emptyList());
        when(driverRepository.findById(driverId)).thenReturn(Optional.of(driver));

        driverService.deleteDriver(driverId);

        verify(driverRepository, times(1)).delete(driver);
    }
}