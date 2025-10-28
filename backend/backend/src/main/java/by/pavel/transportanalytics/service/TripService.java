package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.TripDto;

public interface TripService {

    /**
     * Добавляет новую запись о поездке (путевой лист).
     *
     * @param tripDto DTO с данными о поездке
     * @return DTO созданной записи о поездке
     */
    TripDto addTrip(TripDto tripDto);

    /**
     * Обновляет существующую запись о поездке.
     *
     * @param tripId ID поездки для обновления
     * @param tripDto DTO с новыми данными
     * @return DTO обновленной поездки
     */
    TripDto updateTrip(Long tripId, TripDto tripDto);

    /**
     * Удаляет запись о поездке по ее ID.
     *
     * @param tripId ID поездки для удаления
     */
    void deleteTrip(Long tripId);
}