package by.pavel.transportanalytics.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;

@Service
public class FuelPriceService {

    public BigDecimal getCurrentFuelPrice() {
        try {
            // Место для интеграции реального API цен на топливо
            // Например: return restTemplate.getForObject(fuelApiUrl, FuelDto.class).getPrice();

            // Заглушка для курсового проекта (цена за 1 литр)
            return new BigDecimal("2.45");
        } catch (Exception e) {
            System.err.println("Ошибка получения цены на топливо: " + e.getMessage());
            return new BigDecimal("2.45");
        }
    }
}