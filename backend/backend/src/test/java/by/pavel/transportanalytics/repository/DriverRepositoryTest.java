package by.pavel.transportanalytics.repository;

import by.pavel.transportanalytics.model.Driver;
import by.pavel.transportanalytics.model.Vehicle;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@ActiveProfiles("test")
class DriverRepositoryTest {

    @Autowired
    private DriverRepository driverRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Test
    void findByAssignedVehicleId_ShouldReturnDriver() {
        // Arrange
        Vehicle vehicle = new Vehicle();
        vehicle.setPlateNumber("AA-1234");
        vehicle.setModel("Test Model");
        // Теперь это поле мапится на "manufacture_year", но в Java сеттер тот же
        vehicle.setYear(2023);
        vehicle.setFuelNorm(BigDecimal.TEN);

        // Сначала сохраняем машину, чтобы у нее появился ID
        vehicle = vehicleRepository.save(vehicle);

        Driver driver = new Driver();
        driver.setFullName("Ivan Ivanov");
        // Важно: Привязываем уже сохраненную машину
        driver.setAssignedVehicle(vehicle);
        driverRepository.save(driver);

        // Act
        Optional<Driver> found = driverRepository.findByAssignedVehicleId(vehicle.getId());

        // Assert
        assertTrue(found.isPresent());
        // Используйте assertEquals для строк
        assertEquals("Ivan Ivanov", found.get().getFullName());
    }
}