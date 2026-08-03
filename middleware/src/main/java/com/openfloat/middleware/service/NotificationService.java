package com.openfloat.middleware.service;

import com.openfloat.middleware.model.NotificationAlert;
import com.openfloat.middleware.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /**
     * Creates and saves a new system notification.
     * 
     * @param eventType The category (e.g., "UNKNOWN_REFERENCE", "NEW_CLIENT")
     * @param message   The detailed alert message for the admin
     */
    public void createAlert(String eventType, String message) {
        try {
            NotificationAlert alert = new NotificationAlert(eventType, message);
            notificationRepository.save(alert);
            log.info("ALERT GENERATED [{}]: {}", eventType, message);
        } catch (Exception e) {
            log.error("Failed to save notification alert: {}", e.getMessage());
        }
    }

    public List<NotificationAlert> getUnreadAlerts() {
        return notificationRepository.findByIsReadFalseOrderByCreatedAtDesc();
    }

    public void markAsRead(Long id) {
        notificationRepository.findById(id).ifPresent(alert -> {
            alert.setRead(true);
            notificationRepository.save(alert);
        });
    }

    public void markAllAsRead() {
        List<NotificationAlert> unreadAlerts = notificationRepository.findByIsReadFalseOrderByCreatedAtDesc();
        unreadAlerts.forEach(alert -> alert.setRead(true));
        notificationRepository.saveAll(unreadAlerts);
    }
}
