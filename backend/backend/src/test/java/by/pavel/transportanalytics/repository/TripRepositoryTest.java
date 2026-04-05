package by.pavel.transportanalytics.repository;

import by.pavel.transportanalytics.model.Driver;
import by.pavel.transportanalytics.model.Trip;
import by.pavel.transportanalytics.model.Vehicle;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

@DataJpaTest
@TestPropertySource(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class TripRepositoryTest {

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Test
    void findAllByDriverId_ReturnsList() {
        Driver driver = new Driver();
        driver.setFullName("Петр Петров");
        Driver savedDriver = driverRepository.save(driver);

        Vehicle vehicle = new Vehicle();
        vehicle.setPlateNumber("1234AB");
        vehicle.setModel("MAZ");
        vehicle.setYear(2018);
        vehicle.setFuelNorm(BigDecimal.valueOf(15.0));
        vehicle.setStatus("АКТИВЕН");
        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        Trip trip = new Trip();
        trip.setDriver(savedDriver);
        trip.setVehicle(savedVehicle);
        trip.setDate(LocalDate.now());
        trip.setMileageStart(100);
        trip.setMileageEnd(200);
        trip.setFuelUsed(BigDecimal.valueOf(10.5));
        tripRepository.save(trip);

        List<Trip> trips = tripRepository.findAllByDriverId(savedDriver.getId());

        assertFalse(trips.isEmpty());
        assertEquals(1, trips.size());
        assertEquals(savedDriver.getId(), trips.getFirst().getDriver().getId());
    }
}