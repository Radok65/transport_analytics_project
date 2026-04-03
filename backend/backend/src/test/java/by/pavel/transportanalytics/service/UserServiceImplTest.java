package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.RegisterRequestDto;
import by.pavel.transportanalytics.model.User;
import by.pavel.transportanalytics.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    @DisplayName("Успешная регистрация нового пользователя")
    void registerUser_Success() {

        RegisterRequestDto request = new RegisterRequestDto();
        request.setUsername("testUser");
        request.setPassword("password123");

        when(userRepository.findByUsername(request.getUsername())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPassword");

        User savedUser = new User();
        savedUser.setId(1L);
        savedUser.setUsername("testUser");
        savedUser.setPassword("encodedPassword");
        savedUser.setRole("ROLE_USER");

        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        User result = userService.registerUser(request);

        assertNotNull(result);
        assertEquals("testUser", result.getUsername());
        assertEquals("encodedPassword", result.getPassword());
        assertEquals("ROLE_USER", result.getRole());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("Ошибка регистрации: имя пользователя уже занято")
    void registerUser_UsernameAlreadyExists_ThrowsException() {

        RegisterRequestDto request = new RegisterRequestDto();
        request.setUsername("existingUser");
        request.setPassword("password");

        when(userRepository.findByUsername(request.getUsername())).thenReturn(Optional.of(new User()));

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> userService.registerUser(request));

        assertEquals("Username already exists", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Успешное удаление пользователя")
    void deleteUser_Success() {

        Long userId = 1L;
        when(userRepository.existsById(userId)).thenReturn(true);

        userService.deleteUser(userId);

        verify(userRepository, times(1)).deleteById(userId);
    }

    @Test
    @DisplayName("Ошибка удаления: пользователь не найден")
    void deleteUser_NotFound_ThrowsException() {

        Long userId = 99L;
        when(userRepository.existsById(userId)).thenReturn(false);

        EntityNotFoundException exception = assertThrows(EntityNotFoundException.class,
                () -> userService.deleteUser(userId));

        assertTrue(exception.getMessage().contains("not found"));
        verify(userRepository, never()).deleteById(anyLong());
    }
}