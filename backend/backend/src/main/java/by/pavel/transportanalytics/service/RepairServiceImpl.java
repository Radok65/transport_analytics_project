package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.RepairDto;
import by.pavel.transportanalytics.model.Repair;
import by.pavel.transportanalytics.model.Vehicle;
import by.pavel.transportanalytics.repository.RepairRepository;
import by.pavel.transportanalytics.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RepairServiceImpl implements RepairService {

    private final RepairRepository repairRepository;
    private final VehicleRepository vehicleRepository;

    @Override
    @Transactional
    public RepairDto addRepairToVehicle(Long vehicleId, RepairDto repairDto) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle with id " + vehicleId + " not found"));

        Repair repair = new Repair();
        repair.setDate(repairDto.getDate());
        repair.setDescription(repairDto.getDescription());
        repair.setCost(repairDto.getCost());
        repair.setVehicle(vehicle);

        Repair savedRepair = repairRepository.save(repair);
        return convertToDto(savedRepair);
    }

    @Override
    @Transactional
    public RepairDto updateRepair(Long repairId, RepairDto repairDto) {
        Repair existingRepair = repairRepository.findById(repairId)
                .orElseThrow(() -> new EntityNotFoundException("Repair with id " + repairId + " not found"));

        existingRepair.setDate(repairDto.getDate());
        existingRepair.setDescription(repairDto.getDescription());
        existingRepair.setCost(repairDto.getCost());

        Repair updatedRepair = repairRepository.save(existingRepair);
        return convertToDto(updatedRepair);
    }

    @Override
    @Transactional
    public void deleteRepair(Long repairId) {
        if (!repairRepository.existsById(repairId)) {
            throw new EntityNotFoundException("Repair with id " + repairId + " not found");
        }
        repairRepository.deleteById(repairId);
    }

    private RepairDto convertToDto(Repair repair) {
        RepairDto dto = new RepairDto();
        dto.setId(repair.getId());
        dto.setDate(repair.getDate());
        dto.setDescription(repair.getDescription());
        dto.setCost(repair.getCost());
        return dto;
    }
}