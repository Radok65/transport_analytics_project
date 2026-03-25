package by.pavel.transportanalytics.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "analytics_events")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;
    @Column(name = "event_type")
    private String eventType;
    private String category;
    private String eventName;
    private String parameter;
    private String description;
    private LocalDateTime timestamp;
    private String userLogin;
}