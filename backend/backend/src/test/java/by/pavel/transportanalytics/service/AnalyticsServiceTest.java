package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.AnalyticsDto;
import by.pavel.transportanalytics.model.Repair;
import by.pavel.transportanalytics.model.Trip;
import by.pavel.transportanalytics.model.Vehicle;
import by.pavel.transportanalytics.repository.RepairRepository;
import by.pavel.transportanalytics.repository.TripRepository;
import by.pavel.transportanalytics.repository.VehicleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;
    @Mock
    private TripRepository tripRepository;
    @Mock
    private RepairRepository repairRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    @Test
    void getGlobalAnalytics_ShouldCalculateTotalsCorrectly() {
        // Arrange
        Trip trip = new Trip();
        trip.setFuelUsed(new BigDecimal("100.00")); // 100 литров * 2.57 = 257.00 BYN
        trip.setMileageStart(1000);
        trip.setMileageEnd(1100);

        Repair repair = new Repair();
        repair.setCost(new BigDecimal("500.00"));

        Vehicle vehicle = new Vehicle();
        vehicle.setPlateNumber("TEST-1");
        vehicle.setTrips(List.of(trip));
        vehicle.setRepairs(List.of(repair));

        when(vehicleRepository.findAll()).thenReturn(List.of(vehicle));
        when(tripRepository.findAll()).thenReturn(List.of(trip));
        when(repairRepository.findAll()).thenReturn(List.of(repair));

        // Act
        AnalyticsDto result = analyticsService.getGlobalAnalytics();

        // Assert
        // Проверяем стоимость топлива: 100 * 2.57 = 257.00
        assertEquals(0, new BigDecimal("257.00").compareTo(result.getTotalFuelCost()));
        // Проверяем стоимость ремонтов: 500.00
        assertEquals(new BigDecimal("500.00"), result.getTotalRepairCost());
        // Проверяем топ-5
        assertTrue(result.getTop5VehiclesByMileage().containsKey("TEST-1"));
        assertEquals(100, result.getTop5VehiclesByMileage().get("TEST-1")); // 1100 - 1000 = 100 км
    }
}