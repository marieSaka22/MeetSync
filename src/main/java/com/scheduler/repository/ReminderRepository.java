package com.scheduler.repository;

import com.scheduler.model.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    // FIXED: fetch join version (no LazyInitializationException)
    @Query("""
        select r from Reminder r
        join fetch r.meeting m
        where r.sent = false
        and r.remindAt <= :now
    """)
    List<Reminder> findDueReminders(@Param("now") LocalDateTime now);

    // Optional old version (you can delete it if not needed)
    @Query("""
        select r from Reminder r
        where r.sent = false
        and r.remindAt <= :now
    """)
    List<Reminder> findPendingReminders(@Param("now") LocalDateTime now);

    // All reminders for a specific meeting
    List<Reminder> findByMeetingId(Long meetingId);
}