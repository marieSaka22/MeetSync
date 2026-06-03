package com.scheduler.service;

import com.scheduler.model.*;
import com.scheduler.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class MeetingService {

    private final MeetingRepository meetingRepo;
    private final UserRepository userRepo;
    private final ReminderRepository reminderRepo;
    private final AuditLogRepository auditRepo;

    public MeetingService(MeetingRepository meetingRepo, UserRepository userRepo,
                          ReminderRepository reminderRepo, AuditLogRepository auditRepo) {
        this.meetingRepo  = meetingRepo;
        this.userRepo     = userRepo;
        this.reminderRepo = reminderRepo;
        this.auditRepo    = auditRepo;
    }

    private User currentUser() {

        Object principal = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        if (principal instanceof User user) {
            return user;
        }

        return userRepo.findByUsername("test")
                .orElseThrow(() -> new RuntimeException("Test user not found"));
    }

    public List<Meeting> getMyMeetings() {
        return meetingRepo.findAllForUser(currentUser());
    }

    public Optional<Meeting> getMeeting(Long id) {
        return meetingRepo.findById(id);
    }

    @Transactional
    public Meeting createMeeting(Map<String, Object> body) {
        User organizer = currentUser();

        LocalDateTime start = LocalDateTime.parse(body.get("startTime").toString());
        LocalDateTime end   = LocalDateTime.parse(body.get("endTime").toString());

        List<Meeting> conflicts = meetingRepo.findConflicts(organizer, start, end);
        if (!conflicts.isEmpty()) {
            throw new IllegalStateException("Time conflict with existing meeting: " + conflicts.get(0).getTitle());
        }

        Meeting meeting = Meeting.builder()
                .title(body.get("title").toString())
                .description(body.getOrDefault("description", "").toString())
                .location(body.getOrDefault("location", "").toString())
                .startTime(start)
                .endTime(end)
                .color(body.getOrDefault("color", "#3788d8").toString())
                .status(Meeting.Status.SCHEDULED)
                .organizer(organizer)
                .build();

        Meeting saved = meetingRepo.save(meeting);

        Reminder reminder = Reminder.builder()
                .meeting(saved)
                .remindAt(start.minusMinutes(30))
                .type(Reminder.ReminderType.POPUP)
                .sent(false)
                .build();

        reminderRepo.save(reminder);

        log(organizer, "CREATE", "meetings", saved.getId(), "Created meeting: " + saved.getTitle());

        return saved;
    }

    @Transactional
    public Meeting updateMeeting(Long id, Map<String, Object> body) {
        Meeting meeting = meetingRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        if (body.containsKey("title"))       meeting.setTitle(body.get("title").toString());
        if (body.containsKey("description")) meeting.setDescription(body.get("description").toString());
        if (body.containsKey("location"))    meeting.setLocation(body.get("location").toString());
        if (body.containsKey("color"))       meeting.setColor(body.get("color").toString());
        if (body.containsKey("status"))      meeting.setStatus(Meeting.Status.valueOf(body.get("status").toString()));
        if (body.containsKey("startTime"))   meeting.setStartTime(LocalDateTime.parse(body.get("startTime").toString()));
        if (body.containsKey("endTime"))     meeting.setEndTime(LocalDateTime.parse(body.get("endTime").toString()));

        Meeting saved = meetingRepo.save(meeting);

        log(currentUser(), "UPDATE", "meetings", id, "Updated meeting: " + meeting.getTitle());

        return saved;
    }

    @Transactional
    public void deleteMeeting(Long id) {
        Meeting meeting = meetingRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        reminderRepo.findByMeetingId(id).forEach(reminderRepo::delete);

        meetingRepo.delete(meeting);

        log(currentUser(), "DELETE", "meetings", id, "Deleted meeting: " + meeting.getTitle());
    }

    public List<Meeting> getUpcoming() {
        return meetingRepo.findUpcoming(LocalDateTime.now(), LocalDateTime.now().plusDays(7));
    }

    private void log(User user, String action, String table, Long targetId, String details) {
        auditRepo.save(AuditLog.builder()
                .user(user)
                .action(action)
                .targetTable(table)
                .targetId(targetId)
                .details(details)
                .build());
    }
}