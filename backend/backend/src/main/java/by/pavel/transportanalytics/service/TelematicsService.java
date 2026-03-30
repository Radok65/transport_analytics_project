package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.TelematicsDataDto;
import by.pavel.transportanalytics.model.TelematicsAlert;
import by.pavel.transportanalytics.model.TelematicsData;
import by.pavel.transportanalytics.model.Vehicle;
import by.pavel.transportanalytics.repository.TelematicsAlertRepository;
import by.pavel.transportanalytics.repository.TelematicsDataRepository;
import by.pavel.transportanalytics.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class TelematicsService {

    private final TelematicsDataRepository dataRepository;
    private final TelematicsAlertRepository alertRepository;
    private final VehicleRepository vehicleRepository;
    private final MapsService mapsService;

    @Value("${telematics.speed.limit:90.0}")
    private double speedLimit;

    @Value("${telematics.fuel.drop.threshold:5.0}")
    private double fuelDropThreshold;

    public TelematicsService(
            TelematicsDataRepository dataRepository,
            TelematicsAlertRepository alertRepository,
            VehicleRepository vehicleRepository,
            MapsService mapsService
    ) {
        this.dataRepository = dataRepository;
        this.alertRepository = alertRepository;
        this.vehicleRepository = vehicleRepository;
        this.mapsService = mapsService;
    }

    public void processIncomingData(TelematicsDataDto dto) {
        Optional<Vehicle> vehicleOpt = vehicleRepository.findById(dto.getVehicleId());
        if (vehicleOpt.isEmpty()) {
            return;
        }

        Vehicle vehicle = vehicleOpt.get();

        Optional<TelematicsData> lastDataOpt = dataRepository.findTopByVehicleIdOrderByTimestampDesc(vehicle.getId());

        TelematicsData newData = new TelematicsData();
        newData.setVehicle(vehicle);
        newData.setLatitude(dto.getLatitude());
        newData.setLongitude(dto.getLongitude());
        newData.setSpeed(dto.getSpeed());
        newData.setFuelLevel(dto.getFuelLevel());
        newData.setTimestamp(LocalDateTime.now());
        dataRepository.save(newData);

        vehicle.setLastLatitude(dto.getLatitude());
        vehicle.setLastLongitude(dto.getLongitude());
        vehicle.setCurrentFuelLevel(dto.getFuelLevel());
        vehicleRepository.save(vehicle);

        checkForSpeeding(vehicle, newData);

        // IDEA Warning FIX: Используем функциональный стиль
        lastDataOpt.ifPresent(lastData -> checkForFuelDrop(vehicle, lastData, newData));
    }

    private void checkForSpeeding(Vehicle vehicle, TelematicsData data) {
        if (data.getSpeed() != null && data.getSpeed() > speedLimit) {
            String address = mapsService.getAddressFromCoordinates(data.getLatitude(), data.getLongitude());

            TelematicsAlert alert = new TelematicsAlert();
            alert.setVehicle(vehicle);
            alert.setTimestamp(LocalDateTime.now());
            alert.setType("SPEEDING");
            alert.setDescription("Превышение скорости: " + data.getSpeed() + " км/ч. Место: " + address);
            // FIX: Преобразуем double в BigDecimal
            alert.setFinancialLoss(BigDecimal.ZERO);

            alertRepository.save(alert);
        }
    }

    private void checkForFuelDrop(Vehicle vehicle, TelematicsData lastData, TelematicsData newData) {
        if (lastData.getFuelLevel() == null || newData.getFuelLevel() == null) {
            return;
        }

        // Защита от ложных срабатываний: если скорость > 5, то падение топлива - это норма
        if (newData.getSpeed() != null && newData.getSpeed() > 5.0) {
            return;
        }

        double drop = lastData.getFuelLevel() - newData.getFuelLevel();

        if (drop >= fuelDropThreshold) {
            String address = mapsService.getAddressFromCoordinates(newData.getLatitude(), newData.getLongitude());
            double lossAmount = drop * 2.57;

            TelematicsAlert alert = new TelematicsAlert();
            alert.setVehicle(vehicle);
            alert.setTimestamp(LocalDateTime.now());
            alert.setType("FUEL_DROP");
            alert.setDescription(String.format("Резкое падение топлива: -%.1f л. Место: %s", drop, address));
            // FIX: Преобразуем double в BigDecimal
            alert.setFinancialLoss(BigDecimal.valueOf(lossAmount));

            alertRepository.save(alert);
        }
    }
}