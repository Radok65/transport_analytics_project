package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.RegisterRequestDto;
import by.pavel.transportanalytics.model.User;

public interface UserService {
    void deleteUser(Long id);
    User registerUser(RegisterRequestDto registerRequest);
}