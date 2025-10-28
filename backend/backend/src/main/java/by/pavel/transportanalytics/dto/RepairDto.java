package by.pavel.transportanalytics.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class RepairDto {
    private Long id;
    private LocalDate date;
    private String description;
    private BigDecimal cost;
}
