package by.pavel.transportanalytics.controller;

import by.pavel.transportanalytics.service.UserService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @Test
    void deleteUser_ReturnsNoContent() throws Exception {
        doNothing().when(userService).deleteUser(1L);

        mockMvc.perform(delete("/api/users/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void handleNotFound_ReturnsStatus404() throws Exception {
        doThrow(new EntityNotFoundException("User not found")).when(userService).deleteUser(anyLong());

        mockMvc.perform(delete("/api/users/99"))
                .andExpect(status().isNotFound())
                .andExpect(content().string("User not found"));
    }

    @Test
    void getCurrentUser_ReturnsUserInfo() throws Exception {
        UserDetails userDetails = new User("testuser", "password", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        TestingAuthenticationToken authentication = new TestingAuthenticationToken(userDetails, null, "ROLE_USER");

        mockMvc.perform(get("/api/users/me").principal(authentication))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_USER"));
    }
}