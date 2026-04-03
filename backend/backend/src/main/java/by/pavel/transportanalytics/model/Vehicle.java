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

    @Column(name = "current_fuel_level")
    private Double currentFuelLevel;

    @Column(name = "last_latitude")
    private Double lastLatitude;

    @Column(name = "last_longitude")
    private Double lastLongitude;

    @Column(name = "tank_capacity")
    private Double tankCapacity;

    @Column(nullable = false, columnDefinition = "varchar(255) default 'СВОБОДЕН'")
    private String status = "СВОБОДЕН";

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TelematicsData> telematicsData = new ArrayList<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TelematicsAlert> alerts = new ArrayList<>();

    @OneToMany(
            mappedBy = "vehicle",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Repair> repairs = new ArrayList<>();

    @OneToMany(
            mappedBy = "vehicle",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<Trip> trips = new ArrayList<>();
}