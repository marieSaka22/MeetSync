package com.scheduler.controller;

import com.scheduler.model.Meeting;
import com.scheduler.service.MeetingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meetings")
public class MeetingController {

    private final MeetingService meetingService;

    public MeetingController(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    // GET /api/meetings — all meetings for logged-in user
    @GetMapping
    public List<Meeting> getMyMeetings() {
        return meetingService.getMyMeetings();
    }

    // GET /api/meetings/upcoming
    @GetMapping("/upcoming")
    public List<Meeting> getUpcoming() {
        return meetingService.getUpcoming();
    }

    // GET /api/meetings/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getMeeting(@PathVariable Long id) {
        return meetingService.getMeeting(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/meetings
    @PostMapping
    public ResponseEntity<?> createMeeting(@RequestBody Map<String, Object> body) {
        try {
            Meeting meeting = meetingService.createMeeting(body);
            return ResponseEntity.ok(meeting);
        } catch (IllegalStateException e) {
            // Conflict detected
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/meetings/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMeeting(@PathVariable Long id,
                                            @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(meetingService.updateMeeting(id, body));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/meetings/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMeeting(@PathVariable Long id) {
        try {
            meetingService.deleteMeeting(id);
            return ResponseEntity.ok(Map.of("message", "Meeting deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
