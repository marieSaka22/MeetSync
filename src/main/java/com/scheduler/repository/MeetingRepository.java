package com.scheduler.repository;

import com.scheduler.model.Meeting;
import com.scheduler.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MeetingRepository extends JpaRepository<Meeting, Long> {

    // All meetings organized by a user
    List<Meeting> findByOrganizer(User organizer);

    // Meetings where user is a participant
    @Query("SELECT m FROM Meeting m JOIN m.participants p WHERE p = :user")
    List<Meeting> findByParticipant(@Param("user") User user);

    // All meetings for a user (organizer OR participant)
    @Query("SELECT DISTINCT m FROM Meeting m LEFT JOIN m.participants p " +
           "WHERE m.organizer = :user OR p = :user ORDER BY m.startTime ASC")
    List<Meeting> findAllForUser(@Param("user") User user);

    // Upcoming meetings in next N hours (for reminders)
    @Query("SELECT m FROM Meeting m WHERE m.startTime BETWEEN :now AND :future AND m.status = 'SCHEDULED'")
    List<Meeting> findUpcoming(@Param("now") LocalDateTime now, @Param("future") LocalDateTime future);

    // Conflict detection: does this time slot overlap for this user?
    @Query("SELECT m FROM Meeting m JOIN m.participants p WHERE p = :user " +
           "AND m.status != 'CANCELLED' " +
           "AND m.startTime < :endTime AND m.endTime > :startTime")
    List<Meeting> findConflicts(@Param("user") User user,
                                 @Param("startTime") LocalDateTime startTime,
                                 @Param("endTime") LocalDateTime endTime);
}
