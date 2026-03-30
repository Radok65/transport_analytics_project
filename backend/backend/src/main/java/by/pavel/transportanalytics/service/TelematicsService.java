package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.TelematicsDataDto;
import by.pavel.transportanalytics.model.TelematicsAlert;
import by.pavel.transportanalytics.model.TelematicsData;
import by.pavel.transportanalytics.model.Trip;
import by.pavel.transportanalytics.model.Vehicle;
import by.pavel.transportanalytics.repository.TelematicsAlertRepository;
import by.pavel.transportanalytics.repository.TelematicsDataRepository;
import by.pavel.transportanalytics.repository.TripRepository;
import by.pavel.transportanalytics.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TelematicsService {

    // Репозитории
    private final TelematicsDataRepository telematicsRepository;
    private final TelematicsAlertRepository alertRepository;
    private final VehicleRepository vehicleRepository;
    private final TripRepository tripRepository;

    // Внешние API сервисы
    private final WeatherService weatherService;
    private final FuelPriceService fuelPriceService;
    private final GoogleMapsService googleMapsService;

    @Value("${telematics.speed.limit:90.0}")
    private Double speedLimit;

    @Value("${telematics.fuel.drop.threshold:5.0}")
    private Double fuelDropThreshold;

    @Transactional
    public void processIncomingData(TelematicsDataDto dto) {
        // Ищем машину в базе
        Vehicle vehicle = vehicleRepository.findById(dto.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Транспорт не найден"));

        // Ищем поездку, если она передана
        Trip trip = null;
        if (dto.getTripId() != null) {
            trip = tripRepository.findById(dto.getTripId()).orElse(null);
        }

        // 1. Получаем погоду по текущим координатам
        WeatherService.WeatherData weather = weatherService.getWeatherAtLocation(dto.getLatitude(), dto.getLongitude());

        // 2. Сохраняем новую точку маршрута в базу
        TelematicsData data = new TelematicsData();
        data.setVehicle(vehicle);
        data.setTrip(trip);
        data.setTimestamp(dto.getTimestamp() != null ? dto.getTimestamp() : LocalDateTime.now());
        data.setLatitude(dto.getLatitude());
        data.setLongitude(dto.getLongitude());
        data.setSpeed(dto.getSpeed());
        data.setFuelLevel(dto.getFuelLevel());
        data.setWeatherCondition(weather.condition());
        data.setTemperature(weather.temperature());

        telematicsRepository.save(data);

        // 3. Анализируем данные на наличие сливов топлива или нарушений скорости
        analyzeAnomalies(vehicle, data);

        // 4. Обновляем текущие показатели автомобиля (последние известные координаты и уровень бака)
        vehicle.setCurrentFuelLevel(dto.getFuelLevel());
        vehicle.setLastLatitude(dto.getLatitude());
        vehicle.setLastLongitude(dto.getLongitude());
        vehicleRepository.save(vehicle);
    }

    private void analyzeAnomalies(Vehicle vehicle, TelematicsData currentData) {
        // Проверка на превышение скорости
        if (currentData.getSpeed() != null && currentData.getSpeed() > speedLimit) {
            String address = googleMapsService.getAddressFromCoordinates(currentData.getLatitude(), currentData.getLongitude());
            createAlert(vehicle, currentData, "SPEEDING",
                    String.format("Превышение скорости: %.0f км/ч. Место: %s", currentData.getSpeed(), address),
                    BigDecimal.ZERO);
        }

        // Проверка на резкое падение уровня топлива (Слив)
        if (vehicle.getCurrentFuelLevel() != null) {
            double fuelDifference = vehicle.getCurrentFuelLevel() - currentData.getFuelLevel();

            // Если разница больше допустимого порога (например, пропало больше 5 литров за раз)
            if (fuelDifference > fuelDropThreshold) {
                BigDecimal currentFuelPrice = fuelPriceService.getCurrentFuelPrice();
                BigDecimal financialLoss = currentFuelPrice.multiply(BigDecimal.valueOf(fuelDifference));

                String address = googleMapsService.getAddressFromCoordinates(currentData.getLatitude(), currentData.getLongitude());

                createAlert(vehicle, currentData, "FUEL_DROP",
                        String.format("Слив топлива: %.2f л. Место: %s. Ущерб: %.2f руб", fuelDifference, address, financialLoss),
                        financialLoss);
            }
        }
    }

    private void createAlert(Vehicle vehicle, TelematicsData data, String type, String description, BigDecimal loss) {
        TelematicsAlert alert = new TelematicsAlert();
        alert.setVehicle(vehicle);
        alert.setTimestamp(data.getTimestamp());
        alert.setLatitude(data.getLatitude());
        alert.setLongitude(data.getLongitude());
        alert.setType(type);
        alert.setDescription(description);
        alert.setFinancialLoss(loss);

        alertRepository.save(alert);
    }
}