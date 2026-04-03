package by.pavel.transportanalytics.model;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class TelematicsDataTest {

    @Test
    void testTelematicsDataGettersAndSetters() {
        TelematicsData data = new TelematicsData();
        Vehicle vehicle = new Vehicle();
        Trip trip = new Trip();
        LocalDateTime now = LocalDateTime.now();

        data.setId(1L);
        data.setVehicle(vehicle);
        data.setTrip(trip);
        data.setTimestamp(now);
        data.setLatitude(53.0);
        data.setLongitude(27.0);
        data.setSpeed(85.5);
        data.setFuelLevel(40.0);
        data.setWeatherCondition("Clear");
        data.setTemperature(22.5);

        assertEquals(1L, data.getId());
        assertNotNull(data.getVehicle());
        assertNotNull(data.getTrip());
        assertEquals(now, data.getTimestamp());
        assertEquals(53.0, data.getLatitude());
        assertEquals(27.0, data.getLongitude());
        assertEquals(85.5, data.getSpeed());
        assertEquals(40.0, data.getFuelLevel());
        assertEquals("Clear", data.getWeatherCondition());
        assertEquals(22.5, data.getTemperature());
    }
}