package by.pavel.transportanalytics.controller;

import by.pavel.transportanalytics.dto.TripDto;
import by.pavel.transportanalytics.service.TripService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TripController.class)
@AutoConfigureMockMvc(addFilters = false)
class TripControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private TripService tripService;

    @Test
    void updateTrip_ReturnsStatusOk() throws Exception {
        TripDto requestDto = new TripDto();
        requestDto.setMileageStart(100);

        TripDto responseDto = new TripDto();
        responseDto.setId(1L);
        responseDto.setMileageStart(100);

        when(tripService.updateTrip(eq(1L), any(TripDto.class))).thenReturn(responseDto);

        mockMvc.perform(put("/api/trips/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mileageStart").value(100));
    }

    @Test
    void deleteTrip_ReturnsStatusNoContent() throws Exception {
        doNothing().when(tripService).deleteTrip(1L);

        mockMvc.perform(delete("/api/trips/1"))
                .andExpect(status().isNoContent());
    }
}