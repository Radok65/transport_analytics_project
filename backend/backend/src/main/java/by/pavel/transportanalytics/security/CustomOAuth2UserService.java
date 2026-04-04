package by.pavel.transportanalytics.security;

import by.pavel.transportanalytics.model.User;
import by.pavel.transportanalytics.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // Получаем профиль пользователя от Google
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId();
        // У Google ID пользователя хранится в атрибуте 'sub'
        String providerId = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String avatarUrl = oAuth2User.getAttribute("picture");

        // Ищем пользователя по email
        Optional<User> userOptional = userRepository.findByUsername(email);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            // Если пользователь заходил раньше через логин/пароль, привязываем ему Google аккаунт
            if (user.getProvider() == null) {
                user.setProvider(provider);
                user.setProviderId(providerId);
                user.setAvatarUrl(avatarUrl);
                userRepository.save(user);
            }
        } else {
            // Создаем нового пользователя
            User user = new User();
            user.setUsername(email); // Используем почту как логин
            user.setRole("ROLE_USER"); // Или "USER", в зависимости от твоей логики
            user.setProvider(provider);
            user.setProviderId(providerId);
            user.setAvatarUrl(avatarUrl);
            // Пароль не задаем!
            userRepository.save(user);
        }

        return oAuth2User;
    }
}