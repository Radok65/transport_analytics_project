package by.pavel.transportanalytics.controller;

import by.pavel.transportanalytics.dto.RepairDto;
import by.pavel.transportanalytics.dto.TripDto;
import by.pavel.transportanalytics.dto.VehicleDto;
import by.pavel.transportanalytics.service.RepairServiceImpl;
import by.pavel.transportanalytics.service.TripServiceImpl;
import by.pavel.transportanalytics.service.VehicleService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(VehicleController.class)
@AutoConfigureMockMvc(addFilters = false)
class VehicleControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private VehicleService vehicleService;

    @MockitoBean
    private RepairServiceImpl repairService;

    @MockitoBean
    private TripServiceImpl tripService;

    @Test
    void getAllVehicles_ReturnsStatusOk() throws Exception {
        VehicleDto dto = new VehicleDto();
        dto.setPlateNumber("1234AB");

        when(vehicleService.findAllVehicles()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].plateNumber").value("1234AB"));
    }

    @Test
    void getVehicleById_ReturnsStatusOk() throws Exception {
        VehicleDto dto = new VehicleDto();
        dto.setId(1L);
        dto.setPlateNumber("1234AB");

        when(vehicleService.findVehicleById(1L)).thenReturn(dto);

        mockMvc.perform(get("/api/vehicles/1")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.plateNumber").value("1234AB"));
    }

    @Test
    void createVehicle_ReturnsStatusCreated() throws Exception {
        VehicleDto requestDto = new VehicleDto();
        requestDto.setPlateNumber("1234AB");

        VehicleDto responseDto = new VehicleDto();
        responseDto.setId(1L);
        responseDto.setPlateNumber("1234AB");

        when(vehicleService.createVehicle(any(VehicleDto.class))).thenReturn(responseDto);

        mockMvc.perform(post("/api/vehicles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void updateVehicle_ReturnsStatusOk() throws Exception {
        VehicleDto requestDto = new VehicleDto();
        requestDto.setPlateNumber("NEW123");

        VehicleDto responseDto = new VehicleDto();
        responseDto.setId(1L);
        responseDto.setPlateNumber("NEW123");

        when(vehicleService.updateVehicle(eq(1L), any(VehicleDto.class))).thenReturn(responseDto);

        mockMvc.perform(put("/api/vehicles/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.plateNumber").value("NEW123"));
    }

    @Test
    void deleteVehicle_ReturnsStatusNoContent() throws Exception {
        doNothing().when(vehicleService).deleteVehicle(1L);

        mockMvc.perform(delete("/api/vehicles/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void addRepairToVehicle_ReturnsStatusCreated() throws Exception {
        RepairDto requestDto = new RepairDto();
        requestDto.setDescription("Oil change");

        RepairDto responseDto = new RepairDto();
        responseDto.setId(1L);
        responseDto.setDescription("Oil change");

        when(repairService.addRepairToVehicle(eq(1L), any(RepairDto.class))).thenReturn(responseDto);

        mockMvc.perform(post("/api/vehicles/1/repairs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.description").value("Oil change"));
    }

    @Test
    void addTripToVehicle_ReturnsStatusCreated() throws Exception {
        TripDto requestDto = new TripDto();
        requestDto.setMileageStart(100);

        TripDto responseDto = new TripDto();
        responseDto.setId(1L);
        responseDto.setMileageStart(100);

        when(tripService.addTripToVehicle(eq(1L), any(TripDto.class))).thenReturn(responseDto);

        mockMvc.perform(post("/api/vehicles/1/trips")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.mileageStart").value(100));
    }

    @Test
    void updateStatus_ReturnsStatusOk() throws Exception {
        doNothing().when(vehicleService).updateVehicleStatus(1L, "ACTIVE");

        mockMvc.perform(put("/api/vehicles/1/status")
                        .param("status", "ACTIVE"))
                .andExpect(status().isOk());
    }
}