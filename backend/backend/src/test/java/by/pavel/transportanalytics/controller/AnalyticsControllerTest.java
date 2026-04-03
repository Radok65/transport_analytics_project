package by.pavel.transportanalytics.controller;

import by.pavel.transportanalytics.dto.AnalyticsDto;
import by.pavel.transportanalytics.service.AnalyticsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnalyticsController.class)
@AutoConfigureMockMvc(addFilters = false)
class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AnalyticsService analyticsService;

    @Test
    void getAnalytics_Global_ReturnsStatusOk() throws Exception {
        AnalyticsDto dto = AnalyticsDto.builder().totalFleetMileage(1000).build();

        when(analyticsService.getGlobalAnalytics()).thenReturn(dto);

        mockMvc.perform(get("/api/analytics")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalFleetMileage").value(1000));
    }

    @Test
    void getAnalytics_VehicleSpecific_ReturnsStatusOk() throws Exception {
        AnalyticsDto dto = AnalyticsDto.builder().vehicleTotalMileage(500).build();

        when(analyticsService.getVehicleAnalytics(1L)).thenReturn(dto);

        mockMvc.perform(get("/api/analytics")
                        .param("vehicleId", "1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vehicleTotalMileage").value(500));
    }
}