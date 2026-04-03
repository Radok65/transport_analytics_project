package by.pavel.transportanalytics.model;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class TripTest {

    @Test
    void testTripGettersAndSetters() {
        Trip trip = new Trip();
        Vehicle vehicle = new Vehicle();
        Driver driver = new Driver();
        LocalDate date = LocalDate.now();

        trip.setId(100L);
        trip.setDate(date);
        trip.setMileageStart(10000);
        trip.setMileageEnd(10500);
        trip.setFuelUsed(BigDecimal.valueOf(50.0));
        trip.setVehicle(vehicle);
        trip.setDriver(driver);

        assertEquals(100L, trip.getId());
        assertEquals(date, trip.getDate());
        assertEquals(10000, trip.getMileageStart());
        assertEquals(10500, trip.getMileageEnd());
        assertEquals(BigDecimal.valueOf(50.0), trip.getFuelUsed());
        assertNotNull(trip.getVehicle());
        assertNotNull(trip.getDriver());
    }
}