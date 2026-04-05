package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.RepairDto;
import by.pavel.transportanalytics.dto.TripDto;
import by.pavel.transportanalytics.dto.VehicleDto;
import by.pavel.transportanalytics.model.Vehicle;
import by.pavel.transportanalytics.repository.DriverRepository;
import by.pavel.transportanalytics.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleServiceImpl implements VehicleService {

    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "vehicles")
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
    @CacheEvict(value = "vehicles", allEntries = true)
    public VehicleDto createVehicle(VehicleDto vehicleDto) {
        Vehicle vehicle = convertToEntity(vehicleDto);
        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        return convertToDto(savedVehicle);
    }

    @Override
    @Transactional
    @CacheEvict(value = "vehicles", allEntries = true)
    public VehicleDto updateVehicle(Long id, VehicleDto vehicleDto) {
        Vehicle existingVehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle with id " + id + " not found"));

        existingVehicle.setPlateNumber(vehicleDto.getPlateNumber());
        existingVehicle.setModel(vehicleDto.getModel());
        existingVehicle.setYear(vehicleDto.getYear());
        existingVehicle.setFuelNorm(vehicleDto.getFuelNorm());

        // РЕШЕНИЕ ПРОБЛЕМЫ НЕ-АДМИНОВ: Теперь бэкенд умеет обновлять и сохранять координаты
        if (vehicleDto.getLastLatitude() != null) {
            existingVehicle.setLastLatitude(vehicleDto.getLastLatitude());
        }
        if (vehicleDto.getLastLongitude() != null) {
            existingVehicle.setLastLongitude(vehicleDto.getLastLongitude());
        }
        if (vehicleDto.getCurrentFuelLevel() != null) {
            existingVehicle.setCurrentFuelLevel(vehicleDto.getCurrentFuelLevel());
        }

        Vehicle updatedVehicle = vehicleRepository.save(existingVehicle);
        return convertToDto(updatedVehicle);
    }

    @Override
    @Transactional
    @CacheEvict(value = "vehicles", allEntries = true)
    public void deleteVehicle(Long id) {
        Vehicle vehicleToDelete = vehicleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle with id " + id + " not found"));

        driverRepository.findByAssignedVehicleId(id).ifPresent(driver -> {
            driver.setAssignedVehicle(null);
            driverRepository.save(driver);
        });

        vehicleRepository.delete(vehicleToDelete);
    }

    @Override
    @Transactional
    @CacheEvict(value = "vehicles", allEntries = true)
    public void updateVehicleStatus(Long id, String status) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ТС не найдено"));
        vehicle.setStatus(status);
        vehicleRepository.save(vehicle);
    }

    private VehicleDto convertToDto(Vehicle vehicle) {
        VehicleDto dto = new VehicleDto();
        dto.setId(vehicle.getId());
        dto.setPlateNumber(vehicle.getPlateNumber());
        dto.setModel(vehicle.getModel());
        dto.setYear(vehicle.getYear());
        dto.setFuelNorm(vehicle.getFuelNorm());
        dto.setCurrentFuelLevel(vehicle.getCurrentFuelLevel());
        dto.setLastLatitude(vehicle.getLastLatitude());
        dto.setLastLongitude(vehicle.getLastLongitude());
        dto.setStatus(vehicle.getStatus());

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
        vehicle.setCurrentFuelLevel(dto.getCurrentFuelLevel() != null ? dto.getCurrentFuelLevel() : 100.0);
        vehicle.setLastLatitude(dto.getLastLatitude() != null ? dto.getLastLatitude() : 53.9061);
        vehicle.setLastLongitude(dto.getLastLongitude() != null ? dto.getLastLongitude() : 27.9564);
        vehicle.setStatus(dto.getStatus() != null ? dto.getStatus() : "СВОБОДЕН");
        return vehicle;
    }
}