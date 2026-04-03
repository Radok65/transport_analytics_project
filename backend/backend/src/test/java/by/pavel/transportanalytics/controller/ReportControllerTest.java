package by.pavel.transportanalytics.controller;

import by.pavel.transportanalytics.service.ReportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReportController.class)
@AutoConfigureMockMvc(addFilters = false)
class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ReportService reportService;

    @Test
    void getFleetSummary_ReturnsPdf() throws Exception {
        byte[] pdfContent = "dummy pdf content".getBytes();
        when(reportService.generateFleetSummaryReport()).thenReturn(pdfContent);

        mockMvc.perform(get("/api/reports/summary"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=fleet_summary.pdf"))
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes(pdfContent));
    }

    @Test
    void getVehicleReport_ReturnsPdf() throws Exception {
        byte[] pdfContent = "dummy vehicle pdf".getBytes();
        when(reportService.generateDetailedVehicleReport(1L)).thenReturn(pdfContent);

        mockMvc.perform(get("/api/reports/vehicle/1"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=vehicle_report_1.pdf"))
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(content().bytes(pdfContent));
    }
}