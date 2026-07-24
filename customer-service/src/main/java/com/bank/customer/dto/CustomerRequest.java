package com.bank.customer.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class CustomerRequest {
    @NotNull
    private Long userId;
    @NotBlank
    private String fullName;
    @NotBlank @Email
    private String email;
    private String phone;
    private String address;
    private LocalDate dateOfBirth;
    private String nationalId;
}
