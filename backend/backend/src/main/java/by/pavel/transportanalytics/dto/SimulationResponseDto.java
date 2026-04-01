package by.pavel.transportanalytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimulationResponseDto {
    private boolean success;           // Хватило ли топлива
    private String message;            // Сообщение для пользователя (ошибка или успех)
    private double distanceKm;         // Итоговая дистанция
    private double fuelNeeded;         // Сколько нужно топлива с учетом погоды
    private double currentFuel;        // Сколько сейчас в баке
    private List<double[]> pathPoints; // Ровно 800 точек [lat, lon] для плавной анимации на фронте
}