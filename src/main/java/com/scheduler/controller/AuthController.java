package com.scheduler.controller;

import com.scheduler.config.JwtUtil;
import com.scheduler.model.User;
import com.scheduler.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final PasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserRepository userRepo, PasswordEncoder encoder, JwtUtil jwtUtil) {
        this.userRepo = userRepo;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
    }

    // ── POST /api/auth/register ──────────────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String email    = body.get("email");
        String password = body.get("password");

        if (userRepo.existsByUsername(username))
            return ResponseEntity.badRequest().body(Map.of("error", "Username already taken"));
        if (userRepo.existsByEmail(email))
            return ResponseEntity.badRequest().body(Map.of("error", "Email already registered"));

        User user = User.builder()
                .username(username)
                .email(email)
                .passwordHash(encoder.encode(password))
                .role(User.Role.ORGANIZER)
                .build();

        userRepo.save(user);
        String token = jwtUtil.generateToken(username);

        return ResponseEntity.ok(Map.of(
            "token", token,
            "username", username,
            "role", user.getRole().name()
        ));
    }

    // ── POST /api/auth/login ─────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        return userRepo.findByUsername(username)
            .filter(u -> encoder.matches(password, u.getPasswordHash()))
            .map(u -> {
                String token = jwtUtil.generateToken(u.getUsername());
                return ResponseEntity.ok(Map.of(
                    "token", token,
                    "username", u.getUsername(),
                    "role", u.getRole().name(),
                    "userId", u.getId()
                ));
            })
            .orElse(ResponseEntity.status(401).body(Map.of("error", "Invalid username or password")));
    }

    // ── GET /api/auth/me ─────────────────────────────────────────────────────
    @GetMapping("/me")
    public ResponseEntity<?> me(jakarta.servlet.http.HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer "))
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

        String token = header.substring(7);
        if (!jwtUtil.validateToken(token))
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));

        String username = jwtUtil.extractUsername(token);
        return userRepo.findByUsername(username)
            .map(u -> ResponseEntity.ok(Map.of(
                "id", u.getId(),
                "username", u.getUsername(),
                "email", u.getEmail(),
                "role", u.getRole().name()
            )))
            .orElse(ResponseEntity.status(404).body(Map.of("error", "User not found")));
    }
}
