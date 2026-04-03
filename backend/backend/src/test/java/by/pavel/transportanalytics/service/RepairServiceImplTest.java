package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.RepairDto;
import by.pavel.transportanalytics.model.Repair;
import by.pavel.transportanalytics.model.Vehicle;
import by.pavel.transportanalytics.repository.RepairRepository;
import by.pavel.transportanalytics.repository.VehicleRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RepairServiceImplTest {

    @Mock
    private RepairRepository repairRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @InjectMocks
    private RepairServiceImpl repairService;

    @Test
    void addRepairToVehicle_Success() {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(1L);
        vehicle.setStatus("АКТИВЕН");

        RepairDto dto = new RepairDto();
        dto.setDate(LocalDate.now());
        dto.setDescription("Замена масла");
        dto.setCost(BigDecimal.valueOf(150.0));

        Repair savedRepair = new Repair();
        savedRepair.setId(1L);
        savedRepair.setDate(dto.getDate());
        savedRepair.setDescription(dto.getDescription());
        savedRepair.setCost(dto.getCost());
        savedRepair.setVehicle(vehicle);

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));
        when(repairRepository.save(any(Repair.class))).thenReturn(savedRepair);

        RepairDto result = repairService.addRepairToVehicle(1L, dto);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("В РЕМОНТЕ", vehicle.getStatus());
        verify(vehicleRepository, times(1)).save(vehicle);
    }

    @Test
    void addRepairToVehicle_VehicleNotFound_ThrowsException() {
        when(vehicleRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> repairService.addRepairToVehicle(1L, new RepairDto()));
    }

    @Test
    void updateRepair_Success() {
        Repair existingRepair = new Repair();
        existingRepair.setId(1L);

        RepairDto dto = new RepairDto();
        dto.setDate(LocalDate.now());
        dto.setDescription("Новое описание");
        dto.setCost(BigDecimal.valueOf(200.0));

        when(repairRepository.findById(1L)).thenReturn(Optional.of(existingRepair));
        when(repairRepository.save(any(Repair.class))).thenReturn(existingRepair);

        RepairDto result = repairService.updateRepair(1L, dto);

        assertNotNull(result);
        verify(repairRepository, times(1)).save(existingRepair);
    }

    @Test
    void updateRepair_NotFound_ThrowsException() {
        when(repairRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> repairService.updateRepair(1L, new RepairDto()));
    }

    @Test
    void deleteRepair_Success() {
        when(repairRepository.existsById(1L)).thenReturn(true);
        repairService.deleteRepair(1L);
        verify(repairRepository, times(1)).deleteById(1L);
    }

    @Test
    void deleteRepair_NotFound_ThrowsException() {
        when(repairRepository.existsById(1L)).thenReturn(false);
        assertThrows(EntityNotFoundException.class, () -> repairService.deleteRepair(1L));
        verify(repairRepository, never()).deleteById(anyLong());
    }
}