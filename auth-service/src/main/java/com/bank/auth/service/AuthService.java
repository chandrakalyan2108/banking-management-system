package com.bank.auth.service;

import com.bank.auth.dto.*;
import com.bank.auth.model.User;
import com.bank.auth.repository.UserRepository;
import com.bank.auth.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("CUSTOMER")
                .enabled(true)
                .build();
        user = userRepository.save(user);
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getId());
        return new AuthResponse(token, user.getUsername(), user.getRole(), user.getId());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getId());
        return new AuthResponse(token, user.getUsername(), user.getRole(), user.getId());
    }

    public boolean validate(String token) {
        return jwtUtil.validateToken(token);
    }
}
