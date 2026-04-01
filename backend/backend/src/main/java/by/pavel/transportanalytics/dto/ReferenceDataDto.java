package by.pavel.transportanalytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReferenceDataDto {
    private BigDecimal fuelPricePerLiter;
    private List<DestinationDto> destinations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DestinationDto {
        private String name;
        private double lat;
        private double lon;
    }
}