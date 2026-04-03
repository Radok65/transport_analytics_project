package by.pavel.transportanalytics.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "telematics_alerts")
@Getter
@Setter
public class TelematicsAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private String type;

    private Double latitude;
    private Double longitude;

    private String description;

    @Column(name = "financial_loss", precision = 10, scale = 2)
    private BigDecimal financialLoss;
}