package com.bank.transaction.client;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class NotificationServiceClient {

    private final RestTemplate restTemplate;

    @Value("${services.notification-service.url}")
    private String notificationServiceUrl;

    public void sendTransactionNotification(Long customerId, String message) {
        try {
            restTemplate.postForObject(
                    notificationServiceUrl + "/api/notifications/send",
                    Map.of("customerId", customerId, "message", message, "channel", "EMAIL"),
                    Void.class);
        } catch (Exception ignored) {
            // Notification failures should not block the transaction flow
        }
    }
}
