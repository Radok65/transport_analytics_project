package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.AnalyticsDto;
import by.pavel.transportanalytics.model.Vehicle;
import by.pavel.transportanalytics.repository.VehicleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private AnalyticsService analyticsService;

    @Mock
    private VehicleRepository vehicleRepository;

    @InjectMocks
    private ReportService reportService;

    @Test
    void generateFleetSummaryReport_Success() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);
        vehicle.setPlateNumber("1234");
        vehicle.setTrips(List.of());
        vehicle.setRepairs(List.of());

        when(vehicleRepository.findAll()).thenReturn(List.of(vehicle));

        byte[] report = reportService.generateFleetSummaryReport();

        assertNotNull(report);
        assertTrue(report.length > 0);
    }

    @Test
    void generateDetailedVehicleReport_Success() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);
        vehicle.setPlateNumber("1234");
        vehicle.setModel("Volvo");
        vehicle.setYear(2020);
        vehicle.setTrips(List.of());

        AnalyticsDto analyticsDto = AnalyticsDto.builder().build();

        when(vehicleRepository.findById(anyLong())).thenReturn(Optional.of(vehicle));
        when(analyticsService.getVehicleAnalytics(anyLong())).thenReturn(analyticsDto);

        byte[] report = reportService.generateDetailedVehicleReport(1L);

        assertNotNull(report);
        assertTrue(report.length > 0);
    }
}