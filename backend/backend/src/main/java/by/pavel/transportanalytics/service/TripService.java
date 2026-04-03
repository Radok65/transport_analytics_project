package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.TripDto;

public interface TripService {
    TripDto addTrip(TripDto tripDto);
    TripDto updateTrip(Long tripId, TripDto tripDto);
    void deleteTrip(Long tripId);
}