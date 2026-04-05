package by.pavel.transportanalytics.repository;

import by.pavel.transportanalytics.model.Driver;
import by.pavel.transportanalytics.model.Vehicle;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@TestPropertySource(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class DriverRepositoryTest {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Test
    void findByAssignedVehicleId_ReturnsDriver() {
        Vehicle vehicle = new Vehicle();
        vehicle.setPlateNumber("1234AB");
        vehicle.setModel("Kamaz");
        vehicle.setYear(2019);
        vehicle.setFuelNorm(BigDecimal.valueOf(20.0));
        vehicle.setStatus("АКТИВЕН");
        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        Driver driver = new Driver();
        driver.setFullName("Иван Иванов");
        driver.setAssignedVehicle(savedVehicle);
        driverRepository.save(driver);

        Optional<Driver> found = driverRepository.findByAssignedVehicleId(savedVehicle.getId());

        assertTrue(found.isPresent());
        assertEquals("Иван Иванов", found.get().getFullName());
    }
}