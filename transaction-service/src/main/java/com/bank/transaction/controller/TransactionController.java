package com.bank.transaction.controller;

import com.bank.transaction.dto.TransferRequest;
import com.bank.transaction.exception.TransactionFailedException;
import com.bank.transaction.model.Transaction;
import com.bank.transaction.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping("/transfer")
    public ResponseEntity<Transaction> transfer(@Valid @RequestBody TransferRequest request) {
        return ResponseEntity.ok(transactionService.transfer(request));
    }

    @PostMapping("/deposit/{accountId}")
    public ResponseEntity<Transaction> deposit(@PathVariable Long accountId, @RequestBody Map<String, Object> body) {
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String remarks = body.getOrDefault("remarks", "").toString();
        return ResponseEntity.ok(transactionService.recordDeposit(accountId, amount, remarks));
    }

    @PostMapping("/withdrawal/{accountId}")
    public ResponseEntity<Transaction> withdrawal(@PathVariable Long accountId, @RequestBody Map<String, Object> body) {
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String remarks = body.getOrDefault("remarks", "").toString();
        return ResponseEntity.ok(transactionService.recordWithdrawal(accountId, amount, remarks));
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<Transaction>> history(@PathVariable Long accountId) {
        return ResponseEntity.ok(transactionService.getHistoryForAccount(accountId));
    }

    @GetMapping
    public ResponseEntity<List<Transaction>> all() {
        return ResponseEntity.ok(transactionService.getAllTransactions());
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "UP", "service", "transaction-service"));
    }

    @ExceptionHandler(TransactionFailedException.class)
    public ResponseEntity<?> handleFailed(TransactionFailedException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
    }
}
