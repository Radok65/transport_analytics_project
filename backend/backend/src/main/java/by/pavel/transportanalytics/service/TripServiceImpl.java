package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.TripDto;
import by.pavel.transportanalytics.model.Driver;
import by.pavel.transportanalytics.model.Trip;
import by.pavel.transportanalytics.model.Vehicle;
import by.pavel.transportanalytics.repository.DriverRepository;
import by.pavel.transportanalytics.repository.TripRepository;
import by.pavel.transportanalytics.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;


@Service
@RequiredArgsConstructor
public class TripServiceImpl implements TripService {

    private final TripRepository tripRepository;
    private final VehicleRepository vehicleRepository;
    private final DriverRepository driverRepository;

    @Override
    @Transactional
    public TripDto addTrip(TripDto tripDto) {
        // Этот метод не используется напрямую, так как ему не хватает ID автомобиля.
        // Из контроллера вызывается метод addTripToVehicle.
        throw new UnsupportedOperationException("This method requires vehicleId. Please use addTripToVehicle.");
    }

    // Правильный метод для использования в контроллере
    @Transactional
    public TripDto addTripToVehicle(Long vehicleId, TripDto tripDto) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new EntityNotFoundException("Vehicle with id " + vehicleId + " not found"));

        Driver driver = driverRepository.findById(tripDto.getDriverId())
                .orElseThrow(() -> new EntityNotFoundException("Driver with id " + tripDto.getDriverId() + " not found"));

        Trip trip = convertToEntity(tripDto, vehicle, driver);
        Trip savedTrip = tripRepository.save(trip);

        return convertToDto(savedTrip);
    }


    @Override
    @Transactional
    public TripDto updateTrip(Long tripId, TripDto tripDto) {
        Trip existingTrip = tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Trip with id " + tripId + " not found"));

        Driver driver = driverRepository.findById(tripDto.getDriverId())
                .orElseThrow(() -> new EntityNotFoundException("Driver with id " + tripDto.getDriverId() + " not found"));

        existingTrip.setDate(tripDto.getDate());
        existingTrip.setMileageStart(tripDto.getMileageStart());
        existingTrip.setMileageEnd(tripDto.getMileageEnd());
        existingTrip.setFuelUsed(tripDto.getFuelUsed());
        existingTrip.setDriver(driver);
        // Автомобиль не меняется, так как поездка привязана к одному ТС

        Trip updatedTrip = tripRepository.save(existingTrip);
        return convertToDto(updatedTrip);
    }

    @Override
    @Transactional
    public void deleteTrip(Long tripId) {
        if (!tripRepository.existsById(tripId)) {
            throw new EntityNotFoundException("Trip with id " + tripId + " not found");
        }
        tripRepository.deleteById(tripId);
    }

    private TripDto convertToDto(Trip trip) {
        TripDto dto = new TripDto();
        dto.setId(trip.getId());
        dto.setDate(trip.getDate());
        dto.setMileageStart(trip.getMileageStart());
        dto.setMileageEnd(trip.getMileageEnd());
        dto.setFuelUsed(trip.getFuelUsed());
        if (trip.getDriver() != null) {
            dto.setDriverId(trip.getDriver().getId());
        }
        return dto;
    }

    private Trip convertToEntity(TripDto dto, Vehicle vehicle, Driver driver) {
        Trip trip = new Trip();
        trip.setDate(dto.getDate());
        trip.setMileageStart(dto.getMileageStart());
        trip.setMileageEnd(dto.getMileageEnd());
        trip.setFuelUsed(dto.getFuelUsed());
        trip.setVehicle(vehicle);
        trip.setDriver(driver);
        return trip;
    }
}
