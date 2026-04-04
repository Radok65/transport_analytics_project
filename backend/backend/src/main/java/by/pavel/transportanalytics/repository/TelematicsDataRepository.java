package by.pavel.transportanalytics.repository;

import by.pavel.transportanalytics.model.TelematicsData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TelematicsDataRepository extends JpaRepository<TelematicsData, Long> {

    @Query("SELECT d FROM TelematicsData d JOIN FETCH d.vehicle LEFT JOIN FETCH d.trip WHERE d.vehicle.id = :vehicleId ORDER BY d.timestamp DESC")
    List<TelematicsData> findAllByVehicleIdWithVehicleAndTripOrderByTimestampDesc(@Param("vehicleId") Long vehicleId);

    Optional<TelematicsData> findTopByVehicleIdOrderByTimestampDesc(Long vehicleId);
}