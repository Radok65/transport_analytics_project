package by.pavel.transportanalytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable; // <-- Добавлен импорт

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DestinationDto implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long id;
    private String name;
    private Double latitude;
    private Double longitude;
}