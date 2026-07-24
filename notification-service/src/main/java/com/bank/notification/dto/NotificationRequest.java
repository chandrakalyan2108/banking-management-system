package com.bank.notification.dto;

import lombok.Data;

@Data
public class NotificationRequest {
    private Long customerId;
    private String message;
    private String channel;
    private String email;
    private String phone;
}
