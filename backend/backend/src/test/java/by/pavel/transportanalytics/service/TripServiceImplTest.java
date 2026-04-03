package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.TripDto;
import by.pavel.transportanalytics.model.Driver;
import by.pavel.transportanalytics.model.Trip;
import by.pavel.transportanalytics.model.Vehicle;
import by.pavel.transportanalytics.repository.DriverRepository;
import by.pavel.transportanalytics.repository.TripRepository;
import by.pavel.transportanalytics.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripServiceImplTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private DriverRepository driverRepository;

    @InjectMocks
    private TripServiceImpl tripService;

    @Test
    void addTrip_ThrowsUnsupportedOperationException() {
        TripDto dto = new TripDto();
        assertThrows(UnsupportedOperationException.class, () -> tripService.addTrip(dto));
    }

    @Test
    void addTripToVehicle_Success() {
        TripDto tripDto = new TripDto();
        tripDto.setDriverId(1L);
        tripDto.setDate(LocalDate.now());
        tripDto.setMileageStart(100);
        tripDto.setMileageEnd(200);
        tripDto.setFuelUsed(BigDecimal.valueOf(10.5));

        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);

        Driver driver = new Driver();
        driver.setId(1L);

        Trip savedTrip = new Trip();
        savedTrip.setId(1L);
        savedTrip.setVehicle(vehicle);
        savedTrip.setDriver(driver);
        savedTrip.setDate(tripDto.getDate());
        savedTrip.setMileageStart(tripDto.getMileageStart());
        savedTrip.setMileageEnd(tripDto.getMileageEnd());
        savedTrip.setFuelUsed(tripDto.getFuelUsed());

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(driverRepository.findById(1L)).thenReturn(Optional.of(driver));
        when(tripRepository.save(any(Trip.class))).thenReturn(savedTrip);

        TripDto result = tripService.addTripToVehicle(1L, tripDto);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(1L, result.getDriverId());
        assertEquals(100, result.getMileageStart());
    }

    @Test
    void addTripToVehicle_VehicleNotFound_ThrowsException() {
        TripDto tripDto = new TripDto();
        when(vehicleRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> tripService.addTripToVehicle(1L, tripDto));
    }

    @Test
    void updateTrip_Success() {
        TripDto tripDto = new TripDto();
        tripDto.setDriverId(1L);
        tripDto.setDate(LocalDate.now());
        tripDto.setMileageStart(150);
        tripDto.setMileageEnd(250);
        tripDto.setFuelUsed(BigDecimal.valueOf(12.0));

        Trip existingTrip = new Trip();
        existingTrip.setId(1L);

        Driver driver = new Driver();
        driver.setId(1L);

        when(tripRepository.findById(1L)).thenReturn(Optional.of(existingTrip));
        when(driverRepository.findById(1L)).thenReturn(Optional.of(driver));
        when(tripRepository.save(any(Trip.class))).thenReturn(existingTrip);

        TripDto result = tripService.updateTrip(1L, tripDto);

        assertNotNull(result);
        assertEquals(1L, result.getDriverId());
        assertEquals(150, result.getMileageStart());
        verify(tripRepository, times(1)).save(existingTrip);
    }

    @Test
    void updateTrip_TripNotFound_ThrowsException() {
        TripDto tripDto = new TripDto();
        when(tripRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> tripService.updateTrip(1L, tripDto));
    }

    @Test
    void deleteTrip_Success() {
        when(tripRepository.existsById(1L)).thenReturn(true);
        tripService.deleteTrip(1L);
        verify(tripRepository, times(1)).deleteById(1L);
    }

    @Test
    void deleteTrip_NotFound_ThrowsException() {
        when(tripRepository.existsById(1L)).thenReturn(false);
        assertThrows(EntityNotFoundException.class, () -> tripService.deleteTrip(1L));
        verify(tripRepository, never()).deleteById(any());
    }
}