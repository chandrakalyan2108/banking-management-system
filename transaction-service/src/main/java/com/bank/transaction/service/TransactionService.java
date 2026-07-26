package com.bank.transaction.service;

import com.bank.transaction.client.AccountServiceClient;
import com.bank.transaction.client.NotificationServiceClient;
import com.bank.transaction.dto.TransferRequest;
import com.bank.transaction.exception.TransactionFailedException;
import com.bank.transaction.model.Transaction;
import com.bank.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountServiceClient accountServiceClient;
    private final NotificationServiceClient notificationServiceClient;

    @Transactional
    public Transaction transfer(TransferRequest request) {
        String refId = "TXN" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();

        Long toAccountId = accountServiceClient.resolveAccountIdByNumber(request.getToAccountNumber());
        if (toAccountId == null) {
            throw new TransactionFailedException(
                    "No account found with number: " + request.getToAccountNumber());
        }

        if (toAccountId.equals(request.getFromAccountId())) {
            throw new TransactionFailedException("Cannot transfer to the same account.");
        }

        Transaction transaction = Transaction.builder()
                .referenceId(refId)
                .type("TRANSFER")
                .fromAccountId(request.getFromAccountId())
                .toAccountId(toAccountId)
                .amount(request.getAmount())
                .status("PENDING")
                .remarks(request.getRemarks())
                .build();
        transaction = transactionRepository.save(transaction);

        boolean withdrawn = accountServiceClient.withdraw(request.getFromAccountId(), request.getAmount());
        if (!withdrawn) {
            transaction.setStatus("FAILED");
            transactionRepository.save(transaction);
            throw new TransactionFailedException("Withdrawal failed - insufficient funds or invalid account");
        }

        boolean deposited = accountServiceClient.deposit(toAccountId, request.getAmount());
        if (!deposited) {
            // compensating transaction: refund the source account
            accountServiceClient.deposit(request.getFromAccountId(), request.getAmount());
            transaction.setStatus("FAILED");
            transactionRepository.save(transaction);
            throw new TransactionFailedException("Deposit failed - transfer rolled back");
        }

        transaction.setStatus("SUCCESS");
        transaction = transactionRepository.save(transaction);

        notificationServiceClient.sendTransactionNotification(request.getFromAccountId(),
                "Transfer of " + request.getAmount() + " completed successfully. Ref: " + refId);

        return transaction;
    }

    @Transactional
    public Transaction recordDeposit(Long accountId, BigDecimal amount) {
        Transaction transaction = Transaction.builder()
                .referenceId("TXN" + UUID.randomUUID().toString().substring(0, 12).toUpperCase())
                .type("DEPOSIT")
                .toAccountId(accountId)
                .amount(amount)
                .status("SUCCESS")
                .build();
        return transactionRepository.save(transaction);
    }

    @Transactional
    public Transaction recordWithdrawal(Long accountId, BigDecimal amount) {
        Transaction transaction = Transaction.builder()
                .referenceId("TXN" + UUID.randomUUID().toString().substring(0, 12).toUpperCase())
                .type("WITHDRAWAL")
                .fromAccountId(accountId)
                .amount(amount)
                .status("SUCCESS")
                .build();
        return transactionRepository.save(transaction);
    }

    public List<Transaction> getHistoryForAccount(Long accountId) {
        return transactionRepository.findByFromAccountIdOrToAccountIdOrderByCreatedAtDesc(accountId, accountId);
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }
}
