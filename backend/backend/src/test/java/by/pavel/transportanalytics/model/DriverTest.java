package by.pavel.transportanalytics.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class DriverTest {

    @Test
    void testDriverGettersAndSetters() {
        Driver driver = new Driver();
        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);

        driver.setId(5L);
        driver.setFullName("Петров Петр");
        driver.setContact("+375291112233");
        driver.setAssignedVehicle(vehicle);

        assertEquals(5L, driver.getId());
        assertEquals("Петров Петр", driver.getFullName());
        assertEquals("+375291112233", driver.getContact());
        assertNotNull(driver.getAssignedVehicle());
        assertEquals(1L, driver.getAssignedVehicle().getId());
    }
}