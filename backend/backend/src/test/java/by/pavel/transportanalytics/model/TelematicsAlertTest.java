package by.pavel.transportanalytics.model;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class TelematicsAlertTest {

    @Test
    void testTelematicsAlertGettersAndSetters() {
        TelematicsAlert alert = new TelematicsAlert();
        Vehicle vehicle = new Vehicle();
        LocalDateTime now = LocalDateTime.now();

        alert.setId(2L);
        alert.setVehicle(vehicle);
        alert.setTimestamp(now);
        alert.setType("ОПАСНОЕ ВОЖДЕНИЕ");
        alert.setLatitude(53.1);
        alert.setLongitude(27.1);
        alert.setDescription("Резкое торможение");
        alert.setFinancialLoss(BigDecimal.valueOf(15.0));

        assertEquals(2L, alert.getId());
        assertNotNull(alert.getVehicle());
        assertEquals(now, alert.getTimestamp());
        assertEquals("ОПАСНОЕ ВОЖДЕНИЕ", alert.getType());
        assertEquals(53.1, alert.getLatitude());
        assertEquals(27.1, alert.getLongitude());
        assertEquals("Резкое торможение", alert.getDescription());
        assertEquals(BigDecimal.valueOf(15.0), alert.getFinancialLoss());
    }
}