package by.pavel.transportanalytics.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Locale;
import java.util.Map;

@Service
public class MapsService {

    public String getAddressFromCoordinates(double lat, double lon) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "TransportAnalyticsApp/1.0 (student project)");
            HttpEntity<String> entity = new HttpEntity<>(headers);

            String url = String.format(Locale.US,
                    "https://nominatim.openstreetmap.org/reverse?format=json&lat=%f&lon=%f&zoom=18&addressdetails=1",
                    lat, lon);

            ResponseEntity<Map> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> response = responseEntity.getBody();

            if (response != null && response.containsKey("display_name")) {
                return (String) response.get("display_name");
            }
        } catch (Exception e) {
            System.err.println("Ошибка геокодирования Nominatim: " + e.getMessage());
        }

        return "Неизвестный адрес (Широта: " + lat + ", Долгота: " + lon + ")";
    }
}