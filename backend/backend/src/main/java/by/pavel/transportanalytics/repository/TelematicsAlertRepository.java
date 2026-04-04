package by.pavel.transportanalytics.repository;

import by.pavel.transportanalytics.model.TelematicsAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface TelematicsAlertRepository extends JpaRepository<TelematicsAlert, Long> {

    @Query("SELECT COALESCE(SUM(a.financialLoss), 0) FROM TelematicsAlert a")
    BigDecimal calculateTotalAlertLosses();

    @Query("SELECT COALESCE(SUM(a.financialLoss), 0) FROM TelematicsAlert a WHERE a.vehicle.id = :vehicleId")
    BigDecimal calculateAlertLossesByVehicleId(@Param("vehicleId") Long vehicleId);

    @Query("SELECT a.vehicle.id, COALESCE(SUM(a.financialLoss), 0) FROM TelematicsAlert a GROUP BY a.vehicle.id")
    List<Object[]> calculateAlertLossesGroupedByVehicle();

    @Query("SELECT a FROM TelematicsAlert a JOIN FETCH a.vehicle ORDER BY a.timestamp DESC")
    List<TelematicsAlert> findAllWithVehicleOrderByTimestampDesc();
}