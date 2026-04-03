package by.pavel.transportanalytics.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@SuppressWarnings({"rawtypes", "unchecked"})
class WeatherServiceTest {

    private WeatherService weatherService;
    private RestTemplate restTemplateMock;

    @BeforeEach
    void setUp() {
        weatherService = new WeatherService();
        restTemplateMock = mock(RestTemplate.class);

        ReflectionTestUtils.setField(weatherService, "apiUrl", "https://api.weather.com");
        ReflectionTestUtils.setField(weatherService, "apiKey", "test-key");
        ReflectionTestUtils.setField(weatherService, "restTemplate", restTemplateMock);
    }

    @Test
    void getWeatherAtLocation_Success() {
        Map<String, Object> mockResponse = Map.of(
                "main", Map.of("temp", 22.5),
                "weather", List.of(Map.of("main", "Clear"))
        );

        when(restTemplateMock.getForObject(anyString(), eq(Map.class))).thenReturn(mockResponse);

        WeatherService.WeatherData result = weatherService.getWeatherAtLocation(53.9, 27.5);

        assertEquals("Clear", result.condition());
        assertEquals(22.5, result.temperature());
    }

    @Test
    void getWeatherAtLocation_Exception_ReturnsDefault() {
        when(restTemplateMock.getForObject(anyString(), eq(Map.class))).thenThrow(new RuntimeException("Timeout"));

        WeatherService.WeatherData result = weatherService.getWeatherAtLocation(53.9, 27.5);

        assertEquals("Unknown", result.condition());
        assertEquals(0.0, result.temperature());
    }
}