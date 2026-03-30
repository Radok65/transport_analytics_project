package by.pavel.transportanalytics.repository;

import by.pavel.transportanalytics.model.TelematicsData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TelematicsDataRepository extends JpaRepository<TelematicsData, Long> {
    // Получить всю историю движения конкретного автомобиля, отсортированную по времени
    List<TelematicsData> findAllByVehicleIdOrderByTimestampDesc(Long vehicleId);

}