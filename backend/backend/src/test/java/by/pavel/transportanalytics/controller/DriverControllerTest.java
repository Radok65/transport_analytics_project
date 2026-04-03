package by.pavel.transportanalytics.controller;

import by.pavel.transportanalytics.dto.DriverDto;
import by.pavel.transportanalytics.service.DriverService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DriverController.class)
@AutoConfigureMockMvc(addFilters = false)
class DriverControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private DriverService driverService;

    @Test
    void getAllDrivers_ReturnsStatusOk() throws Exception {
        DriverDto dto = new DriverDto();
        dto.setFullName("Иван Иванов");

        when(driverService.findAllDrivers()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/drivers")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fullName").value("Иван Иванов"));
    }

    @Test
    void createDriver_ReturnsStatusCreated() throws Exception {
        DriverDto requestDto = new DriverDto();
        requestDto.setFullName("Петр Петров");

        DriverDto responseDto = new DriverDto();
        responseDto.setId(1L);
        responseDto.setFullName("Петр Петров");

        when(driverService.createDriver(any(DriverDto.class))).thenReturn(responseDto);

        mockMvc.perform(post("/api/drivers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void updateDriver_ReturnsStatusOk() throws Exception {
        DriverDto requestDto = new DriverDto();
        requestDto.setFullName("Новое Имя");

        DriverDto responseDto = new DriverDto();
        responseDto.setId(1L);
        responseDto.setFullName("Новое Имя");

        when(driverService.updateDriver(eq(1L), any(DriverDto.class))).thenReturn(responseDto);

        mockMvc.perform(put("/api/drivers/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Новое Имя"));
    }

    @Test
    void deleteDriver_ReturnsStatusNoContent() throws Exception {
        doNothing().when(driverService).deleteDriver(1L);

        mockMvc.perform(delete("/api/drivers/1"))
                .andExpect(status().isNoContent());
    }
}