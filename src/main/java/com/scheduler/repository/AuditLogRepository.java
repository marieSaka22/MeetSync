package com.scheduler.repository;

import com.scheduler.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop50ByOrderByChangedAtDesc();
    List<AuditLog> findByTargetTableAndTargetId(String targetTable, Long targetId);
}
