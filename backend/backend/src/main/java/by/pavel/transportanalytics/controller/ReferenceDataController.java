package by.pavel.transportanalytics.controller;

import by.pavel.transportanalytics.dto.ReferenceDataDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/reference-data")
public class ReferenceDataController {

    @GetMapping
    public ResponseEntity<ReferenceDataDto> getReferenceData() {
        List<ReferenceDataDto.DestinationDto> destinations = Arrays.asList(
                new ReferenceDataDto.DestinationDto("ТЛЦ \"Колядичи\" (Минск-Юг)", 53.8055, 27.5615),
                new ReferenceDataDto.DestinationDto("ТЛЦ \"Прилесье\" (Минск-Восток)", 53.8105, 27.7942),
                new ReferenceDataDto.DestinationDto("Таможня \"Минск-2\" (Аэропорт)", 53.8967, 28.0333),
                new ReferenceDataDto.DestinationDto("Брест (ПТЦ \"Козловичи\")", 52.1250, 23.6800),
                new ReferenceDataDto.DestinationDto("Гомель (СЭЗ)", 52.4345, 30.9754),
                new ReferenceDataDto.DestinationDto("Гродно (Брузги)", 53.6236, 23.6644),
                new ReferenceDataDto.DestinationDto("Витебск (Свободная эконом. зона)", 55.1904, 30.2049),
                new ReferenceDataDto.DestinationDto("Могилев (Кроноспан)", 53.8828, 30.3326),
                new ReferenceDataDto.DestinationDto("Барановичи (Логистический парк)", 53.1326, 26.0139),
                new ReferenceDataDto.DestinationDto("Пинск (Речной порт)", 52.1153, 26.1023),
                new ReferenceDataDto.DestinationDto("Бобруйск (Белшина)", 53.1618, 29.1935),
                new ReferenceDataDto.DestinationDto("Москва (МКАД Запад)", 55.7153, 37.3822),
                new ReferenceDataDto.DestinationDto("Санкт-Петербург (Шушары)", 59.8115, 30.3857),
                new ReferenceDataDto.DestinationDto("Смоленск (ТЛЦ Стабна)", 54.8517, 32.0526)
        );

        ReferenceDataDto dto = ReferenceDataDto.builder()
                .fuelPricePerLiter(new BigDecimal("2.57"))
                .destinations(destinations)
                .build();

        return ResponseEntity.ok(dto);
    }
}