package by.pavel.transportanalytics.controller;

import by.pavel.transportanalytics.dto.VehicleDto;
import by.pavel.transportanalytics.service.RepairServiceImpl;
import by.pavel.transportanalytics.service.TripServiceImpl;
import by.pavel.transportanalytics.service.VehicleService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
// Импорт ниже - новый стандарт для Spring Boot 3.4+
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(VehicleController.class)
@AutoConfigureMockMvc(addFilters = false)
class VehicleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    // ЗАМЕНА @MockBean на @MockitoBean
    @MockitoBean
    private VehicleService vehicleService;

    @MockitoBean
    private RepairServiceImpl repairService;

    @MockitoBean
    private TripServiceImpl tripService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void createVehicle_ShouldReturnCreated() throws Exception {
        // Arrange
        VehicleDto inputDto = new VehicleDto();
        inputDto.setPlateNumber("1111 AA-7");
        inputDto.setModel("MAZ");
        inputDto.setYear(2022);
        inputDto.setFuelNorm(new BigDecimal("30.0"));

        VehicleDto outputDto = new VehicleDto();
        outputDto.setId(1L);
        outputDto.setPlateNumber("1111 AA-7");

        when(vehicleService.createVehicle(inputDto)).thenReturn(outputDto);

        // Act & Assert
        mockMvc.perform(post("/api/vehicles")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(inputDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.plateNumber").value("1111 AA-7"));
    }

    @Test
    @WithMockUser
    void getAllVehicles_ShouldReturnList() throws Exception {
        when(vehicleService.findAllVehicles()).thenReturn(List.of(new VehicleDto()));

        mockMvc.perform(get("/api/vehicles"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }
}