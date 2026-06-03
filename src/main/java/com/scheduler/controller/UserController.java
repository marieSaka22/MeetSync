package com.scheduler.controller;

import com.scheduler.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepo;

    public UserController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    // GET /api/users/search?q=john  — used for participant invite autocomplete
    @GetMapping("/search")
    public List<Map<String, Object>> search(@RequestParam String q) {
        return userRepo.findByUsernameContainingIgnoreCase(q).stream()
            .map(u -> Map.<String, Object>of(
                "id",       u.getId(),
                "username", u.getUsername(),
                "email",    u.getEmail()
            ))
            .collect(Collectors.toList());
    }
}
