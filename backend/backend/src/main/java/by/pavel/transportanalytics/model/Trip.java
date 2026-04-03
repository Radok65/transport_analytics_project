package by.pavel.transportanalytics.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "trips")
@Getter
@Setter
public class Trip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "trip_date", nullable = false)
    private LocalDate date;

    @Column(name = "mileage_start", nullable = false)
    private Integer mileageStart;

    @Column(name = "mileage_end", nullable = false)
    private Integer mileageEnd;

    @Column(name = "fuel_used", nullable = false, precision = 7, scale = 2)
    private BigDecimal fuelUsed;

    @Column(nullable = false)
    private String status = "PLANNED";

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "fuel_cost", precision = 10, scale = 2)
    private BigDecimal fuelCost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id", nullable = false)
    private Driver driver;
}
