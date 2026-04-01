package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.SimulationRequestDto;
import by.pavel.transportanalytics.dto.SimulationResponseDto;
import by.pavel.transportanalytics.model.Destination;
import by.pavel.transportanalytics.model.Vehicle;
import by.pavel.transportanalytics.repository.DestinationRepository;
import by.pavel.transportanalytics.repository.VehicleRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

@Slf4j
@Service
@RequiredArgsConstructor
public class SimulationService {

    private final VehicleRepository vehicleRepository;
    private final DestinationRepository destinationRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final int SIMULATION_FRAMES = 800;

    public SimulationResponseDto startSimulation(SimulationRequestDto request) {
        Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Транспорт не найден"));

        Destination destination = destinationRepository.findById(request.getDestinationId())
                .orElseThrow(() -> new RuntimeException("Пункт назначения не найден"));

        double startLat = vehicle.getLastLatitude() != null ? vehicle.getLastLatitude() : 53.9045;
        double startLon = vehicle.getLastLongitude() != null ? vehicle.getLastLongitude() : 27.5615;

        double destLat = destination.getLatitude() + (Math.random() - 0.5) * 0.0015;
        double destLon = destination.getLongitude() + (Math.random() - 0.5) * 0.0015;

        List<double[]> rawRoutePoints = new ArrayList<>();
        double actualDistanceKm; // Инициализация 0.0 больше не нужна

        try {
            String osrmUrl = String.format(Locale.US,
                    "https://router.project-osrm.org/route/v1/driving/%f,%f;%f,%f?overview=full&geometries=geojson",
                    startLon, startLat, destLon, destLat);

            String response = restTemplate.getForObject(osrmUrl, String.class);
            JsonNode root = objectMapper.readTree(response);
            JsonNode route = root.path("routes").get(0);

            actualDistanceKm = route.path("distance").asDouble() / 1000.0;
            JsonNode coordinates = route.path("geometry").path("coordinates");

            for (JsonNode coord : coordinates) {
                rawRoutePoints.add(new double[]{coord.get(1).asDouble(), coord.get(0).asDouble()});
            }
        } catch (Exception e) {
            log.error("Ошибка OSRM API. Включаем движение по прямой.", e);
            actualDistanceKm = calcDistance(startLat, startLon, destLat, destLon) * 1.25;
            rawRoutePoints.add(new double[]{startLat, startLon});
            rawRoutePoints.add(new double[]{destLat, destLon});
        }

        double weatherMultiplier = 1.0;
        try {
            String weatherUrl = String.format(Locale.US, "http://localhost:8080/api/weather?lat=%f&lon=%f", startLat, startLon);
            // Избавились от Map.class, используем безопасный парсинг JSON
            String weatherResponse = restTemplate.getForObject(weatherUrl, String.class);
            if (weatherResponse != null) {
                JsonNode weatherNode = objectMapper.readTree(weatherResponse);
                String condition = weatherNode.path("condition").asText("");
                double temperature = weatherNode.path("temperature").asDouble(0.0);

                if (condition.contains("Snow") || condition.contains("Rain")) {
                    weatherMultiplier += 0.15;
                }
                if (temperature < -10) {
                    weatherMultiplier += 0.10;
                }
            }
        } catch (Exception e) {
            log.warn("Не удалось получить погоду, используем стандартный расход.");
        }

        // Избавились от лишнего unboxing'а
        double fuelNorm = vehicle.getFuelNorm() != null ? vehicle.getFuelNorm().doubleValue() : 0.0;
        double fuelNeeded = ((actualDistanceKm / 100) * fuelNorm) * weatherMultiplier;
        double currentFuel = vehicle.getCurrentFuelLevel() != null ? vehicle.getCurrentFuelLevel() : 0.0;

        if (currentFuel < fuelNeeded) {
            String msg = String.format(Locale.US,
                    "Недостаточно топлива! Ехать: ~%.0f км. Нужно (с учетом погоды): %.1f л. В баке: %.1f л.",
                    actualDistanceKm, fuelNeeded, currentFuel);
            return SimulationResponseDto.builder()
                    .success(false)
                    .message(msg)
                    .distanceKm(actualDistanceKm)
                    .fuelNeeded(fuelNeeded)
                    .currentFuel(currentFuel)
                    .pathPoints(Collections.emptyList())
                    .build();
        }

        // Убрали передачу frames, используем константу напрямую
        List<double[]> interpolatedPath = interpolatePath(rawRoutePoints);

        return SimulationResponseDto.builder()
                .success(true)
                .message("Маршрут успешно построен")
                .distanceKm(actualDistanceKm)
                .fuelNeeded(fuelNeeded)
                .currentFuel(currentFuel)
                .pathPoints(interpolatedPath)
                .build();
    }

    private double calcDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private List<double[]> interpolatePath(List<double[]> routePoints) {
        List<double[]> pathPoints = new ArrayList<>();
        if (routePoints.isEmpty()) return pathPoints;

        List<double[]> segments = new ArrayList<>();
        double totalDist = 0;

        for (int i = 0; i < routePoints.size() - 1; i++) {
            double[] p1 = routePoints.get(i);
            double[] p2 = routePoints.get(i + 1);
            double d = calcDistance(p1[0], p1[1], p2[0], p2[1]);
            if (d > 0.0001) {
                segments.add(new double[]{p1[0], p1[1], p2[0], p2[1], d});
                totalDist += d;
            }
        }

        double stepDist = totalDist / SIMULATION_FRAMES;
        // Используем getFirst()
        pathPoints.add(routePoints.getFirst());

        for (int i = 1; i < SIMULATION_FRAMES; i++) {
            double targetDist = i * stepDist;
            double currentDist = 0;
            boolean found = false;
            for (double[] seg : segments) {
                if (currentDist + seg[4] >= targetDist) {
                    double ratio = (targetDist - currentDist) / seg[4];
                    double lat = seg[0] + (seg[2] - seg[0]) * ratio;
                    double lon = seg[1] + (seg[3] - seg[1]) * ratio;
                    pathPoints.add(new double[]{lat, lon});
                    found = true;
                    break;
                }
                currentDist += seg[4];
            }
            // Используем getLast()
            if (!found) pathPoints.add(routePoints.getLast());
        }
        // Используем getLast()
        pathPoints.add(routePoints.getLast());

        return pathPoints;
    }
}