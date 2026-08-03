package com.openfloat.middleware.repository;

import com.openfloat.middleware.model.NotificationAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationAlert, Long> {
    
    // Fetch only unread notifications, newest first
    List<NotificationAlert> findByIsReadFalseOrderByCreatedAtDesc();
    
    // Fetch all notifications (for a dedicated history page if needed)
    List<NotificationAlert> findAllByOrderByCreatedAtDesc();
}