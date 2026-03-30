package by.pavel.transportanalytics.repository;

import by.pavel.transportanalytics.model.TelematicsAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TelematicsAlertRepository extends JpaRepository<TelematicsAlert, Long> {
    // Получить все инциденты (сливы/превышения) по машине
    List<TelematicsAlert> findAllByVehicleIdOrderByTimestampDesc(Long vehicleId);
}