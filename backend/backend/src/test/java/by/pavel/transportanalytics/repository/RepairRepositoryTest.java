package by.pavel.transportanalytics.repository;

import by.pavel.transportanalytics.model.Repair;
import by.pavel.transportanalytics.model.Vehicle;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@TestPropertySource(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class RepairRepositoryTest {

    @Autowired
    private RepairRepository repairRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Test
    void saveAndFindById_Success() {
        Vehicle vehicle = new Vehicle();
        vehicle.setPlateNumber("1111AA");
        vehicle.setModel("Scania");
        vehicle.setYear(2020);
        vehicle.setFuelNorm(BigDecimal.valueOf(20.0));
        vehicle.setStatus("АКТИВЕН");
        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        Repair repair = new Repair();
        repair.setVehicle(savedVehicle);
        repair.setDate(LocalDate.now());
        repair.setDescription("Замена фильтров");
        repair.setCost(BigDecimal.valueOf(300.0));

        Repair savedRepair = repairRepository.save(repair);
        Optional<Repair> found = repairRepository.findById(savedRepair.getId());

        assertTrue(found.isPresent());
        assertEquals("Замена фильтров", found.get().getDescription());
        assertEquals(0, BigDecimal.valueOf(300.0).compareTo(found.get().getCost()));
    }
}