package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.RepairDto;
import by.pavel.transportanalytics.dto.TripDto;
import by.pavel.transportanalytics.dto.VehicleDto;
import by.pavel.transportanalytics.model.Vehicle;
import by.pavel.transportanalytics.repository.DriverRepository;
import by.pavel.transportanalytics.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;

    @Override
    @Transactional(readOnly = true)
    public List<VehicleDto> findAllVehicles() {
        return vehicleRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public VehicleDto findVehicleById(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle with id " + id + " not found"));
        return convertToDto(vehicle);
    }

    @Override
    @Transactional
    public VehicleDto createVehicle(VehicleDto vehicleDto) {
        Vehicle vehicle = convertToEntity(vehicleDto);
        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        return convertToDto(savedVehicle);
    }

    @Override
    @Transactional
    public VehicleDto updateVehicle(Long id, VehicleDto vehicleDto) {
        Vehicle existingVehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle with id " + id + " not found"));

        existingVehicle.setPlateNumber(vehicleDto.getPlateNumber());
        existingVehicle.setModel(vehicleDto.getModel());
        existingVehicle.setYear(vehicleDto.getYear());
        existingVehicle.setFuelNorm(vehicleDto.getFuelNorm());

        Vehicle updatedVehicle = vehicleRepository.save(existingVehicle);
        return convertToDto(updatedVehicle);
    }

    @Override
    @Transactional
    public void deleteVehicle(Long id) {
        // --- ИСПРАВЛЕННАЯ ЛОГИКА ---
        // 1. Сначала находим сущность, чтобы она была под управлением Hibernate
        Vehicle vehicleToDelete = vehicleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle with id " + id + " not found"));

        // 2. Находим водителя, который может быть закреплен за этим ТС.
        driverRepository.findByAssignedVehicleId(id).ifPresent(driver -> {
            // 3. Открепляем ТС от водителя.
            driver.setAssignedVehicle(null);
            driverRepository.save(driver);
        });

        // 4. Теперь безопасно удаляем саму сущность ТС. Каскадное удаление
        //    (для поездок и ремонтов) сработает корректно.
        vehicleRepository.delete(vehicleToDelete);
    }

    private VehicleDto convertToDto(Vehicle vehicle) {
        VehicleDto dto = new VehicleDto();
        dto.setId(vehicle.getId());
        dto.setPlateNumber(vehicle.getPlateNumber());
        dto.setModel(vehicle.getModel());
        dto.setYear(vehicle.getYear());
        dto.setFuelNorm(vehicle.getFuelNorm());

        List<RepairDto> repairDtos = vehicle.getRepairs().stream().map(repair -> {
            RepairDto repairDto = new RepairDto();
            repairDto.setId(repair.getId());
            repairDto.setDate(repair.getDate());
            repairDto.setDescription(repair.getDescription());
            repairDto.setCost(repair.getCost());
            return repairDto;
        }).collect(Collectors.toList());
        dto.setRepairs(repairDtos);

        List<TripDto> tripDtos = vehicle.getTrips().stream().map(trip -> {
            TripDto tripDto = new TripDto();
            tripDto.setId(trip.getId());
            tripDto.setDate(trip.getDate());
            tripDto.setMileageStart(trip.getMileageStart());
            tripDto.setMileageEnd(trip.getMileageEnd());
            tripDto.setFuelUsed(trip.getFuelUsed());
            if (trip.getDriver() != null) {
                tripDto.setDriverId(trip.getDriver().getId());
            }
            return tripDto;
        }).collect(Collectors.toList());
        dto.setTrips(tripDtos);

        return dto;
    }

    private Vehicle convertToEntity(VehicleDto dto) {
        Vehicle vehicle = new Vehicle();
        vehicle.setPlateNumber(dto.getPlateNumber());
        vehicle.setModel(dto.getModel());
        vehicle.setYear(dto.getYear());
        vehicle.setFuelNorm(dto.getFuelNorm());
        return vehicle;
    }
}

