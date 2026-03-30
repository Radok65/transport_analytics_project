package by.pavel.transportanalytics.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

@Service
public class GoogleMapsService {

    @Value("${google.maps.api.url}")
    private String apiUrl;

    @Value("${google.maps.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String getAddressFromCoordinates(Double lat, Double lon) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(apiUrl)
                    .queryParam("latlng", lat + "," + lon)
                    .queryParam("key", apiKey)
                    .queryParam("language", "ru") // Запрашиваем адрес на русском языке
                    .toUriString();

            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            // Google Maps возвращает массив results, берем самый первый (наиболее точный адрес)
            if (response != null && "OK".equals(response.get("status"))) {
                List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
                if (!results.isEmpty()) {
                    return results.get(0).get("formatted_address").toString();
                }
            }
        } catch (Exception e) {
            System.err.println("Ошибка геокодирования: " + e.getMessage());
        }
        // Если адрес не найден или нет интернета, возвращаем сырые координаты
        return "Неизвестный адрес (Широта: " + lat + ", Долгота: " + lon + ")";
    }
}