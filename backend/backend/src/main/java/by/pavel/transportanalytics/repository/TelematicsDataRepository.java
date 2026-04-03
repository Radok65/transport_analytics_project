package by.pavel.transportanalytics.repository;

import by.pavel.transportanalytics.model.TelematicsData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional; // <-- Не забудь добавить этот импорт

@Repository
public interface TelematicsDataRepository extends JpaRepository<TelematicsData, Long> {
    List<TelematicsData> findAllByVehicleIdOrderByTimestampDesc(Long vehicleId);
    Optional<TelematicsData> findTopByVehicleIdOrderByTimestampDesc(Long vehicleId);
}