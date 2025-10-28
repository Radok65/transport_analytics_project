package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.DriverDto;
import by.pavel.transportanalytics.model.Driver;
import by.pavel.transportanalytics.model.Vehicle;
import by.pavel.transportanalytics.repository.DriverRepository;
import by.pavel.transportanalytics.repository.TripRepository;
import by.pavel.transportanalytics.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriverServiceImpl implements DriverService {

    private final DriverRepository driverRepository;
    private final VehicleRepository vehicleRepository;
    private final TripRepository tripRepository;

    @Override
    @Transactional(readOnly = true)
    public List<DriverDto> findAllDrivers() {
        return driverRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public DriverDto createDriver(DriverDto driverDto) {
        Driver driver = new Driver();
        driver.setFullName(driverDto.getFullName());
        driver.setContact(driverDto.getContact());
        Long newVehicleId = driverDto.getAssignedVehicleId();
        if (newVehicleId != null) {
            driverRepository.findByAssignedVehicleId(newVehicleId).ifPresent(oldDriver -> {
                oldDriver.setAssignedVehicle(null);
                driverRepository.saveAndFlush(oldDriver);
            });
            Vehicle vehicle = vehicleRepository.findById(newVehicleId)
                    .orElseThrow(() -> new EntityNotFoundException("Vehicle with id " + newVehicleId + " not found"));
            driver.setAssignedVehicle(vehicle);
        }
        Driver savedDriver = driverRepository.save(driver);
        return convertToDto(savedDriver);
    }

    @Override
    @Transactional
    public DriverDto updateDriver(Long id, DriverDto driverDto) {
        Driver driverToUpdate = driverRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Driver with id " + id + " not found"));
        Long newVehicleId = driverDto.getAssignedVehicleId();
        if (newVehicleId != null) {
            Optional<Driver> driverWithThisVehicle = driverRepository.findByAssignedVehicleId(newVehicleId);
            if (driverWithThisVehicle.isPresent() && !driverWithThisVehicle.get().getId().equals(driverToUpdate.getId())) {
                Driver oldDriver = driverWithThisVehicle.get();
                oldDriver.setAssignedVehicle(null);
                driverRepository.saveAndFlush(oldDriver);
            }
        }
        driverToUpdate.setFullName(driverDto.getFullName());
        driverToUpdate.setContact(driverDto.getContact());
        Vehicle assignedVehicle = null;
        if (newVehicleId != null) {
            assignedVehicle = vehicleRepository.findById(newVehicleId)
                    .orElseThrow(() -> new EntityNotFoundException("Vehicle with id " + newVehicleId + " not found"));
        }
        driverToUpdate.setAssignedVehicle(assignedVehicle);
        Driver updatedDriver = driverRepository.save(driverToUpdate);
        return convertToDto(updatedDriver);
    }

    @Override
    @Transactional
    public void deleteDriver(Long id) {
        if (!tripRepository.findAllByDriverId(id).isEmpty()) {
            throw new IllegalStateException("Нельзя удалить водителя, так как за ним числятся поездки. Удаление нарушит целостность истории.");
        }

        Driver driverToDelete = driverRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Driver with id " + id + " not found"));

        driverRepository.delete(driverToDelete);
    }

    private DriverDto convertToDto(Driver driver) {
        DriverDto dto = new DriverDto();
        dto.setId(driver.getId());
        dto.setFullName(driver.getFullName());
        dto.setContact(driver.getContact());
        if (driver.getAssignedVehicle() != null) {
            dto.setAssignedVehicleId(driver.getAssignedVehicle().getId());
        }
        return dto;
    }
}