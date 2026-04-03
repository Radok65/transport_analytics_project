package by.pavel.transportanalytics.repository;

import by.pavel.transportanalytics.model.Vehicle;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
class VehicleRepositoryTest {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Test
    void saveAndFindById_Success() {
        Vehicle vehicle = new Vehicle();
        vehicle.setPlateNumber("9999ZX");
        vehicle.setModel("Scania");
        vehicle.setYear(2021);
        vehicle.setFuelNorm(BigDecimal.valueOf(25.5));
        vehicle.setStatus("АКТИВЕН");

        Vehicle saved = vehicleRepository.save(vehicle);
        Optional<Vehicle> found = vehicleRepository.findById(saved.getId());

        assertTrue(found.isPresent());
        assertEquals("9999ZX", found.get().getPlateNumber());
        assertEquals("Scania", found.get().getModel());
    }
}