package by.pavel.transportanalytics.repository;

import by.pavel.transportanalytics.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test") // Использует application-test.properties
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void findByUsername_ShouldReturnUser() {
        // Arrange
        User user = new User();
        user.setUsername("testadmin");
        user.setPassword("pass123");
        user.setRole("ROLE_ADMIN");
        userRepository.save(user);

        // Act
        Optional<User> found = userRepository.findByUsername("testadmin");

        // Assert
        assertTrue(found.isPresent());
        assertEquals("ROLE_ADMIN", found.get().getRole());
    }

    @Test
    void findByUsername_WhenNotExists_ShouldReturnEmpty() {
        Optional<User> found = userRepository.findByUsername("nonexistent");
        assertFalse(found.isPresent());
    }
}