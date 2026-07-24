package com.bank.transaction.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String referenceId;

    @Column(nullable = false)
    private String type; // DEPOSIT, WITHDRAWAL, TRANSFER

    private Long fromAccountId;
    private Long toAccountId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Builder.Default
    private String status = "PENDING"; // PENDING, SUCCESS, FAILED

    private String remarks;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
