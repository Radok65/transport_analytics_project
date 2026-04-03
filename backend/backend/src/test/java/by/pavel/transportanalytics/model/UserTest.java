package by.pavel.transportanalytics.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class UserTest {

    @Test
    void testUserGettersAndSetters() {
        User user = new User();

        assertNull(user.getId());
        assertNull(user.getUsername());

        user.setId(1L);
        user.setUsername("admin");
        user.setPassword("secret");
        user.setRole("ROLE_ADMIN");

        assertEquals(1L, user.getId());
        assertEquals("admin", user.getUsername());
        assertEquals("secret", user.getPassword());
        assertEquals("ROLE_ADMIN", user.getRole());
    }
}