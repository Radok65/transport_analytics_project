package by.pavel.transportanalytics.service;

import org.junit.jupiter.api.Test;
import org.mockito.MockedConstruction;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mockConstruction;
import static org.mockito.Mockito.when;

class MapsServiceTest {

    @Test
    void getAddressFromCoordinates_Success() {
        Map<String, Object> body = Map.of("display_name", "ул. Ленина, Минск");
        ResponseEntity<Map> response = new ResponseEntity<>(body, HttpStatus.OK);

        try (MockedConstruction<RestTemplate> ignored = mockConstruction(RestTemplate.class,
                (mock, context) -> when(mock.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class))).thenReturn(response))) {

            MapsService mapsService = new MapsService();
            String address = mapsService.getAddressFromCoordinates(53.9, 27.5);

            assertEquals("ул. Ленина, Минск", address);
        }
    }

    @Test
    void getAddressFromCoordinates_Exception_ReturnsDefaultString() {
        try (MockedConstruction<RestTemplate> ignored = mockConstruction(RestTemplate.class,
                (mock, context) -> when(mock.exchange(anyString(), eq(HttpMethod.GET), any(), eq(Map.class)))
                        .thenThrow(new RuntimeException("API Error")))) {

            MapsService mapsService = new MapsService();
            String address = mapsService.getAddressFromCoordinates(53.9, 27.5);

            assertTrue(address.startsWith("Неизвестный адрес"));
        }
    }
}