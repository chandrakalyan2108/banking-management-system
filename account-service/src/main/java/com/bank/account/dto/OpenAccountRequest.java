package com.bank.account.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class OpenAccountRequest {
    @NotNull
    private Long customerId;
    private String accountType = "SAVINGS";
    private BigDecimal initialDeposit = BigDecimal.ZERO;
    private String currency = "INR";
}
