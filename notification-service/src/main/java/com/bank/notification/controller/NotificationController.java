package com.bank.notification.controller;

import com.bank.notification.dto.NotificationRequest;
import com.bank.notification.model.Notification;
import com.bank.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/send")
    public ResponseEntity<Notification> send(@RequestBody NotificationRequest request) {
        return ResponseEntity.ok(notificationService.send(request));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Notification>> getByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(notificationService.getByCustomer(customerId));
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "notification-service"));
    }
}
