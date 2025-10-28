package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.RepairDto;

public interface RepairService {

    /**
     * Добавляет новую запись о ремонте для указанного ТС.
     *
     * @param vehicleId ID транспортного средства
     * @param repairDto DTO с данными о ремонте
     * @return DTO созданной записи о ремонте
     */
    RepairDto addRepairToVehicle(Long vehicleId, RepairDto repairDto);

    /**
     * Обновляет существующую запись о ремонте.
     *
     * @param repairId ID записи о ремонте для обновления
     * @param repairDto DTO с новыми данными
     * @return DTO обновленной записи
     */
    RepairDto updateRepair(Long repairId, RepairDto repairDto);

    /**
     * Удаляет запись о ремонте по ее ID.
     *
     * @param repairId ID записи о ремонте для удаления
     */
    void deleteRepair(Long repairId);
}