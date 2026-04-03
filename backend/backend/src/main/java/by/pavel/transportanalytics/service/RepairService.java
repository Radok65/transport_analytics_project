package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.RepairDto;

public interface RepairService {

    RepairDto addRepairToVehicle(Long vehicleId, RepairDto repairDto);

    RepairDto updateRepair(Long repairId, RepairDto repairDto);

    void deleteRepair(Long repairId);
}