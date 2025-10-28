package by.pavel.transportanalytics.repository;

import by.pavel.transportanalytics.model.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<Trip, Long> {
    // Находит все поездки, совершенные определенным водителем
    List<Trip> findAllByDriverId(Long driverId);
}
