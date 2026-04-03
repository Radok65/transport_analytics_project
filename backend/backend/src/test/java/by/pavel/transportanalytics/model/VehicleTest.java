package by.pavel.transportanalytics.model;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class VehicleTest {

    @Test
    void testVehicleGettersAndSetters() {
        Vehicle vehicle = new Vehicle();

        vehicle.setId(10L);
        vehicle.setPlateNumber("1234 AB-7");
        vehicle.setModel("MAZ");
        vehicle.setYear(2015);
        vehicle.setFuelNorm(BigDecimal.valueOf(30.5));
        vehicle.setStatus("В ПУТИ");
        vehicle.setCurrentFuelLevel(150.0);
        vehicle.setLastLatitude(53.9);
        vehicle.setLastLongitude(27.5);
        vehicle.setTrips(new ArrayList<>());
        vehicle.setRepairs(new ArrayList<>());

        assertEquals(10L, vehicle.getId());
        assertEquals("1234 AB-7", vehicle.getPlateNumber());
        assertEquals("MAZ", vehicle.getModel());
        assertEquals(2015, vehicle.getYear());
        assertEquals(BigDecimal.valueOf(30.5), vehicle.getFuelNorm());
        assertEquals("В ПУТИ", vehicle.getStatus());
        assertEquals(150.0, vehicle.getCurrentFuelLevel());
        assertEquals(53.9, vehicle.getLastLatitude());
        assertEquals(27.5, vehicle.getLastLongitude());
        assertNotNull(vehicle.getTrips());
        assertNotNull(vehicle.getRepairs());
    }
}