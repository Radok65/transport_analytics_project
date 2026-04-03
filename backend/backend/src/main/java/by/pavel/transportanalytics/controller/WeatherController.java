package by.pavel.transportanalytics.controller;

import by.pavel.transportanalytics.service.WeatherService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/weather")
@CrossOrigin(origins = "http://localhost:3000")
public class WeatherController {

    private final WeatherService weatherService;

    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    @GetMapping
    public ResponseEntity<WeatherService.WeatherData> getWeather(
            @RequestParam Double lat,
            @RequestParam Double lon) {
        WeatherService.WeatherData weather = weatherService.getWeatherAtLocation(lat, lon);
        return ResponseEntity.ok(weather);
    }
}