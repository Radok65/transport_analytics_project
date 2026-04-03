package by.pavel.transportanalytics.model;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class RepairTest {

    @Test
    void testRepairGettersAndSetters() {
        Repair repair = new Repair();
        Vehicle vehicle = new Vehicle();
        LocalDate date = LocalDate.now();

        repair.setId(20L);
        repair.setDate(date);
        repair.setDescription("Замена колодок");
        repair.setCost(BigDecimal.valueOf(250.50));
        repair.setVehicle(vehicle);

        assertEquals(20L, repair.getId());
        assertEquals(date, repair.getDate());
        assertEquals("Замена колодок", repair.getDescription());
        assertEquals(BigDecimal.valueOf(250.50), repair.getCost());
        assertNotNull(repair.getVehicle());
    }
}