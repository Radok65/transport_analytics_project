package by.pavel.transportanalytics.controller;

import by.pavel.transportanalytics.dto.RegisterRequestDto;
import by.pavel.transportanalytics.model.User;
import by.pavel.transportanalytics.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UserService userService;

    @Test
    void registerUser_Success_ReturnsStatusCreated() throws Exception {
        RegisterRequestDto request = new RegisterRequestDto();
        request.setUsername("newuser");
        request.setPassword("password");

        when(userService.registerUser(any(RegisterRequestDto.class))).thenReturn(new User());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(content().string("User registered successfully!"));
    }

    @Test
    void registerUser_UsernameExists_ReturnsStatusBadRequest() throws Exception {
        RegisterRequestDto request = new RegisterRequestDto();
        request.setUsername("existinguser");
        request.setPassword("password");

        when(userService.registerUser(any(RegisterRequestDto.class)))
                .thenThrow(new IllegalStateException("Username already exists"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Username already exists"));
    }
}