package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.VehicleDto;
import by.pavel.transportanalytics.model.Driver;
import by.pavel.transportanalytics.model.Repair;
import by.pavel.transportanalytics.model.Trip;
import by.pavel.transportanalytics.model.Vehicle;
import by.pavel.transportanalytics.repository.DriverRepository;
import by.pavel.transportanalytics.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
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
    void findAllVehicles_ReturnsList() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);
        vehicle.setPlateNumber("1234AB");
        vehicle.setRepairs(List.of());
        vehicle.setTrips(List.of());

        when(vehicleRepository.findAll()).thenReturn(List.of(vehicle));

        List<VehicleDto> result = vehicleService.findAllVehicles();

        assertEquals(1, result.size());
        assertEquals("1234AB", result.getFirst().getPlateNumber());
        verify(vehicleRepository, times(1)).findAll();
    }

    @Test
    void findVehicleById_Success() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);
        vehicle.setPlateNumber("1234AB");
        vehicle.setRepairs(List.of());
        vehicle.setTrips(List.of());

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));

        VehicleDto result = vehicleService.findVehicleById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void findVehicleById_NotFound_ThrowsException() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> vehicleService.findVehicleById(1L));
    }

    @Test
    void createVehicle_Success() {
        VehicleDto dto = new VehicleDto();
        dto.setPlateNumber("1234AB");
        dto.setModel("Volvo");

        Vehicle savedVehicle = new Vehicle();
        savedVehicle.setId(1L);
        savedVehicle.setPlateNumber("1234AB");
        savedVehicle.setModel("Volvo");
        savedVehicle.setRepairs(List.of());
        savedVehicle.setTrips(List.of());

        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(savedVehicle);

        VehicleDto result = vehicleService.createVehicle(dto);

        assertNotNull(result);
        assertEquals("1234AB", result.getPlateNumber());
    }

    @Test
    void updateVehicle_Success() {
        Vehicle existingVehicle = new Vehicle();
        existingVehicle.setId(1L);
        existingVehicle.setPlateNumber("OLD123");
        existingVehicle.setRepairs(List.of());
        existingVehicle.setTrips(List.of());

        VehicleDto dto = new VehicleDto();
        dto.setPlateNumber("NEW123");

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(existingVehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenReturn(existingVehicle);

        VehicleDto result = vehicleService.updateVehicle(1L, dto);

        assertEquals("NEW123", result.getPlateNumber());
    }

    @Test
    void deleteVehicle_Success() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);

        Driver driver = new Driver();
        driver.setId(1L);
        driver.setAssignedVehicle(vehicle);

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(driverRepository.findByAssignedVehicleId(1L)).thenReturn(Optional.of(driver));

        vehicleService.deleteVehicle(1L);

        assertNull(driver.getAssignedVehicle());
        verify(driverRepository, times(1)).save(driver);
        verify(vehicleRepository, times(1)).delete(vehicle);
    }

    @Test
    void updateVehicleStatus_Success() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);
        vehicle.setStatus("ACTIVE");

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));

        vehicleService.updateVehicleStatus(1L, "INACTIVE");

        assertEquals("INACTIVE", vehicle.getStatus());
        verify(vehicleRepository, times(1)).save(vehicle);
    }

    @Test
    void convertToDto_WithRepairsAndTrips() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);

        Repair repair = new Repair();
        repair.setId(1L);
        repair.setCost(BigDecimal.valueOf(100.0));

        Trip trip = new Trip();
        trip.setId(1L);
        Driver driver = new Driver();
        driver.setId(2L);
        trip.setDriver(driver);

        vehicle.setRepairs(List.of(repair));
        vehicle.setTrips(List.of(trip));

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));

        VehicleDto result = vehicleService.findVehicleById(1L);

        assertEquals(1, result.getRepairs().size());
        assertEquals(BigDecimal.valueOf(100.0), result.getRepairs().getFirst().getCost());
        assertEquals(1, result.getTrips().size());
        assertEquals(2L, result.getTrips().getFirst().getDriverId());
    }
}