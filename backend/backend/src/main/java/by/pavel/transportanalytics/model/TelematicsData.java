package by.pavel.transportanalytics.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "telematics_data")
@Getter
@Setter
public class TelematicsData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    // Привязываем точку к поездке (может быть null, если машина просто заведена на базе)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id")
    private Trip trip;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    private Double speed;

    @Column(name = "fuel_level", nullable = false)
    private Double fuelLevel; // Текущий уровень топлива в баке в литрах

    // --- Данные от OpenWeatherMap API ---
    @Column(name = "weather_condition")
    private String weatherCondition; // Например: "Rain", "Snow", "Clear"

    private Double temperature; // Температура воздуха
}