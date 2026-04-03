package by.pavel.transportanalytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DestinationDto {
    private Long id;
    private String name;
    private Double latitude;
    private Double longitude;
}