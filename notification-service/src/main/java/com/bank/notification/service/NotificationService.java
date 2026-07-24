package com.bank.notification.service;

import com.bank.notification.dto.NotificationRequest;
import com.bank.notification.model.Notification;
import com.bank.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    private final NotificationRepository notificationRepository;

    public Notification send(NotificationRequest request) {
        Notification notification = Notification.builder()
                .customerId(request.getCustomerId())
                .message(request.getMessage())
                .channel(request.getChannel() != null ? request.getChannel() : "EMAIL")
                .status("SENT")
                .build();

        try {
            if ("EMAIL".equalsIgnoreCase(notification.getChannel()) && mailSender != null && request.getEmail() != null) {
                SimpleMailMessage mail = new SimpleMailMessage();
                mail.setTo(request.getEmail());
                mail.setSubject("Banking Management System Notification");
                mail.setText(request.getMessage());
                mailSender.send(mail);
            } else {
                log.info("[{}] Notification to customer {}: {}", notification.getChannel(), request.getCustomerId(), request.getMessage());
            }
        } catch (Exception e) {
            notification.setStatus("FAILED");
            log.error("Failed to send notification: {}", e.getMessage());
        }

        return notificationRepository.save(notification);
    }

    public List<Notification> getByCustomer(Long customerId) {
        return notificationRepository.findByCustomerIdOrderByCreatedAtDesc(customerId);
    }
}
