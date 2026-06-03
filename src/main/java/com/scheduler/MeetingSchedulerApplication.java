package com.scheduler;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling   // enables the background reminder checker
public class MeetingSchedulerApplication {

    public static void main(String[] args) {
        SpringApplication.run(MeetingSchedulerApplication.class, args);
        System.out.println("✅ Meeting Scheduler running at http://localhost:8080");
    }
}
