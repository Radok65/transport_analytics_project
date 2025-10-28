package by.pavel.transportanalytics.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "drivers")
@Getter
@Setter
public class Driver {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column
    private String contact;

    // Связь: Один водитель -> Один закрепленный автомобиль
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_vehicle_id", referencedColumnName = "id")
    private Vehicle assignedVehicle;

    // Связь: Один водитель -> Много поездок
    @OneToMany(
            mappedBy = "driver"
    )
    private List<Trip> trips = new ArrayList<>();
}