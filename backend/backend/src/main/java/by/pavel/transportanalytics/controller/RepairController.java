package by.pavel.transportanalytics.controller;

import by.pavel.transportanalytics.dto.RepairDto;
import by.pavel.transportanalytics.service.RepairService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/repairs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") // Все операции с ремонтами - только для админа
public class RepairController {

    private final RepairService repairService;

    @PutMapping("/{id}")
    public ResponseEntity<RepairDto> updateRepair(@PathVariable Long id, @RequestBody RepairDto repairDto) {
        RepairDto updatedRepair = repairService.updateRepair(id, repairDto);
        return ResponseEntity.ok(updatedRepair);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRepair(@PathVariable Long id) {
        repairService.deleteRepair(id);
        return ResponseEntity.noContent().build();
    }
}