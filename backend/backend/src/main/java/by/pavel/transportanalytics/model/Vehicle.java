package by.pavel.transportanalytics.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vehicles")
@Getter
@Setter
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plate_number", nullable = false, unique = true)
    private String plateNumber;

    @Column(nullable = false)
    private String model;

    @Column(name = "manufacture_year", nullable = false)
    private Integer year;

    @Column(name = "fuel_norm", nullable = false, precision = 5, scale = 2)
    private BigDecimal fuelNorm;

    // Связь: Один автомобиль -> Много ремонтов
    @OneToMany(
            mappedBy = "vehicle",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Repair> repairs = new ArrayList<>();

    // Связь: Один автомобиль -> Много поездок
    @OneToMany(
            mappedBy = "vehicle",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Trip> trips = new ArrayList<>();
}