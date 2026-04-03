package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.DestinationDto;
import by.pavel.transportanalytics.model.Destination;
import by.pavel.transportanalytics.repository.DestinationRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DestinationService {

    private final DestinationRepository destinationRepository;

    @PostConstruct
    public void initDefaultDestinations() {
        if (destinationRepository.count() == 0) {
            List<Destination> defaults = Arrays.asList(
                    new Destination(null, "ТЛЦ \"Колядичи\" (Минск-Юг)", 53.8055, 27.5615),
                    new Destination(null, "ТЛЦ \"Прилесье\" (Минск-Восток)", 53.8105, 27.7942),
                    new Destination(null, "Таможня \"Минск-2\" (Аэропорт)", 53.8967, 28.0333),
                    new Destination(null, "Брест (ПТЦ \"Козловичи\")", 52.1250, 23.6800),
                    new Destination(null, "Гомель (СЭЗ)", 52.4345, 30.9754),
                    new Destination(null, "Гродно (Брузги)", 53.6236, 23.6644),
                    new Destination(null, "Витебск (Свободная эконом. зона)", 55.1904, 30.2049),
                    new Destination(null, "Могилев (Кроноспан)", 53.8828, 30.3326),
                    new Destination(null, "Барановичи (Логистический парк)", 53.1326, 26.0139),
                    new Destination(null, "Пинск (Речной порт)", 52.1153, 26.1023),
                    new Destination(null, "Бобруйск (Белшина)", 53.1618, 29.1935),
                    new Destination(null, "Москва (МКАД Запад)", 55.7153, 37.3822),
                    new Destination(null, "Санкт-Петербург (Шушары)", 59.8115, 30.3857),
                    new Destination(null, "Смоленск (ТЛЦ Стабна)", 54.8517, 32.0526)
            );
            destinationRepository.saveAll(defaults);
        }
    }

    @Transactional(readOnly = true)
    public List<DestinationDto> getAllDestinations() {
        return destinationRepository.findAll().stream()
                .map(d -> DestinationDto.builder()
                        .id(d.getId())
                        .name(d.getName())
                        .latitude(d.getLatitude())
                        .longitude(d.getLongitude())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public DestinationDto createDestination(DestinationDto dto) {
        Destination destination = Destination.builder()
                .name(dto.getName())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .build();

        Destination saved = destinationRepository.save(destination);

        return DestinationDto.builder()
                .id(saved.getId())
                .name(saved.getName())
                .latitude(saved.getLatitude())
                .longitude(saved.getLongitude())
                .build();
    }
}