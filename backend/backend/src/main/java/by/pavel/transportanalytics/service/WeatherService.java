package by.pavel.transportanalytics.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

@Service
public class WeatherService {

    @Value("${openweathermap.api.url}")
    private String apiUrl;

    @Value("${openweathermap.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public WeatherData getWeatherAtLocation(Double lat, Double lon) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(apiUrl)
                    .queryParam("lat", lat)
                    .queryParam("lon", lon)
                    .queryParam("appid", apiKey)
                    .queryParam("units", "metric") // Запрашиваем температуру в градусах Цельсия
                    .toUriString();

            // Выполняем GET-запрос к API погоды
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null) {
                Map<String, Object> main = (Map<String, Object>) response.get("main");
                List<Map<String, Object>> weatherList = (List<Map<String, Object>>) response.get("weather");

                Double temp = Double.valueOf(main.get("temp").toString());
                String condition = weatherList.get(0).get("main").toString();

                return new WeatherData(condition, temp);
            }
        } catch (Exception e) {
            // Если API недоступен или ключ недействителен, перехватываем ошибку,
            // чтобы приложение не упало, и возвращаем пустые данные.
            System.err.println("Ошибка получения погоды: " + e.getMessage());
        }
        return new WeatherData("Unknown", 0.0);
    }

    // Record для удобного возврата двух значений сразу
    public record WeatherData(String condition, Double temperature) {}
}