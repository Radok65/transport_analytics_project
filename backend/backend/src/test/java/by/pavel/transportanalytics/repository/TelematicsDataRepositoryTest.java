package by.pavel.transportanalytics.repository;

import by.pavel.transportanalytics.model.TelematicsData;
import by.pavel.transportanalytics.model.Vehicle;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
class TelematicsDataRepositoryTest {

    @Autowired
    private TelematicsDataRepository telematicsDataRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Test
    void findAllByVehicleIdWithVehicleAndTripOrderByTimestampDesc_ReturnsSortedList() {

        Vehicle vehicle = new Vehicle();
        vehicle.setPlateNumber("5678CD");
        vehicle.setModel("Volvo");
        vehicle.setYear(2021);
        vehicle.setFuelNorm(BigDecimal.valueOf(25.0));
        vehicle.setStatus("АКТИВЕН");
        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        TelematicsData data1 = new TelematicsData();
        data1.setVehicle(savedVehicle);
        data1.setTimestamp(LocalDateTime.now().minusDays(1));
        data1.setFuelLevel(50.0);
        data1.setLatitude(53.0);
        data1.setLongitude(27.0);
        data1.setSpeed(60.0);
        telematicsDataRepository.save(data1);

        TelematicsData data2 = new TelematicsData();
        data2.setVehicle(savedVehicle);
        data2.setTimestamp(LocalDateTime.now());
        data2.setFuelLevel(45.0);
        data2.setLatitude(53.1);
        data2.setLongitude(27.1);
        data2.setSpeed(65.0);
        telematicsDataRepository.save(data2);

        List<TelematicsData> history = telematicsDataRepository.findAllByVehicleIdWithVehicleAndTripOrderByTimestampDesc(savedVehicle.getId());

        assertEquals(2, history.size());
        assertEquals(data2.getTimestamp(), history.get(0).getTimestamp());
        assertEquals(data1.getTimestamp(), history.get(1).getTimestamp());
    }

    @Test
    void findTopByVehicleIdOrderByTimestampDesc_ReturnsLatestData() {

        Vehicle vehicle = new Vehicle();
        vehicle.setPlateNumber("9999XX");
        vehicle.setModel("MAN");
        vehicle.setYear(2022);
        vehicle.setFuelNorm(BigDecimal.valueOf(30.0));
        vehicle.setStatus("АКТИВЕН");
        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        TelematicsData data1 = new TelematicsData();
        data1.setVehicle(savedVehicle);
        data1.setTimestamp(LocalDateTime.now().minusHours(2));
        data1.setFuelLevel(100.0);
        data1.setLatitude(53.0);
        data1.setLongitude(27.0);
        data1.setSpeed(80.0);
        telematicsDataRepository.save(data1);

        TelematicsData data2 = new TelematicsData();
        data2.setVehicle(savedVehicle);
        data2.setTimestamp(LocalDateTime.now());
        data2.setFuelLevel(95.0);
        data2.setLatitude(53.1);
        data2.setLongitude(27.1);
        data2.setSpeed(85.0);
        telematicsDataRepository.save(data2);

        Optional<TelematicsData> latestData = telematicsDataRepository.findTopByVehicleIdOrderByTimestampDesc(savedVehicle.getId());

        assertTrue(latestData.isPresent());
        assertEquals(data2.getTimestamp(), latestData.get().getTimestamp());
    }
}