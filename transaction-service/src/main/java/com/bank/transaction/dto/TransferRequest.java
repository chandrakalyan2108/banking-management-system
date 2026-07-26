package com.bank.transaction.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class TransferRequest {
    @NotNull
    private Long fromAccountId;
    @NotBlank
    private String toAccountNumber;
    @NotNull @DecimalMin(value = "0.01")
    private BigDecimal amount;
    private String remarks;
}
