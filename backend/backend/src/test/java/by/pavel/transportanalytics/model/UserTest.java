package by.pavel.transportanalytics.model;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class UserTest {

    @Test
    void testUserGettersAndSetters() {
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setPassword("secret");
        user.setRole("ROLE_USER");

        assertEquals(1L, user.getId());
        assertEquals("testuser", user.getUsername());
        assertEquals("secret", user.getPassword());
        assertEquals("ROLE_USER", user.getRole());
    }
}