package com.scheduler.controller;

import com.scheduler.model.Meeting;
import com.scheduler.model.Reminder;
import com.scheduler.repository.ReminderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;

@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

    private final ReminderRepository reminderRepo;

    // frontend popup queue
    private final Queue<Map<String, Object>> pendingPopups =
            new ConcurrentLinkedQueue<>();

    public ReminderController(ReminderRepository reminderRepo) {
        this.reminderRepo = reminderRepo;
    }

    // ── Scheduler: runs every 60 seconds ─────────────────────────────
    @Scheduled(fixedRate = 60000)
    public void checkReminders() {

        // ✅ IMPORTANT: using fetch join method
        List<Reminder> due = reminderRepo.findDueReminders(LocalDateTime.now());

        for (Reminder r : due) {

            Meeting m = r.getMeeting(); // already loaded safely

            System.out.println("⏰ Reminder triggered for: " + m.getTitle());

            // send to frontend queue
            pendingPopups.add(Map.of(
                    "reminderId", r.getId(),
                    "meetingId", m.getId(),
                    "title", m.getTitle(),
                    "startTime", m.getStartTime().toString(),
                    "location", m.getLocation() != null ? m.getLocation() : ""
            ));

            // mark as sent
            r.setSent(true);
            reminderRepo.save(r);
        }
    }

    // ── Frontend polling endpoint ─────────────────────────────
    @GetMapping("/pending")
    public ResponseEntity<?> getPending() {

        List<Map<String, Object>> popups = new ArrayList<>();

        while (!pendingPopups.isEmpty()) {
            popups.add(pendingPopups.poll());
        }

        return ResponseEntity.ok(popups);
    }

    // ── Reminders for specific meeting ─────────────────────────
    @GetMapping("/meeting/{meetingId}")
    public List<Reminder> getForMeeting(@PathVariable Long meetingId) {
        return reminderRepo.findByMeetingId(meetingId);
    }

    // ── Delete reminder ────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReminder(@PathVariable Long id) {
        reminderRepo.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Reminder deleted"));
    }
}