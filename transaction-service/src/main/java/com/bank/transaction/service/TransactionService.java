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
            throw new TransactionFailedException("Withdrawal failed - insufficient funds, account not active, or invalid account");
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
                "Transfer of Rs. " + request.getAmount() + " completed successfully. Ref: " + refId);

        return transaction;
    }

    /**
     * Deposits money into an account. This actually calls account-service to
     * adjust the balance AND records the transaction -- previously these two
     * things happened in two disconnected places (account-service adjusted
     * balance directly, this method only logged a record with no real
     * effect), so deposits never showed up correctly and could be recorded
     * without ever truly happening.
     */
    @Transactional
    public Transaction recordDeposit(Long accountId, BigDecimal amount, String remarks) {
        String refId = "TXN" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();

        Transaction transaction = Transaction.builder()
                .referenceId(refId)
                .type("DEPOSIT")
                .toAccountId(accountId)
                .amount(amount)
                .status("PENDING")
                .remarks(remarks)
                .build();
        transaction = transactionRepository.save(transaction);

        boolean deposited = accountServiceClient.deposit(accountId, amount);
        if (!deposited) {
            transaction.setStatus("FAILED");
            transactionRepository.save(transaction);
            throw new TransactionFailedException("Deposit failed - account not found or not active");
        }

        transaction.setStatus("SUCCESS");
        transaction = transactionRepository.save(transaction);

        notificationServiceClient.sendTransactionNotification(accountId,
                "Deposit of Rs. " + amount + " credited to your account. Ref: " + refId);

        return transaction;
    }

    /**
     * Withdraws money from an account, actually adjusting the balance via
     * account-service (which also enforces sufficient-funds and active-status
     * checks) and recording the transaction.
     */
    @Transactional
    public Transaction recordWithdrawal(Long accountId, BigDecimal amount, String remarks) {
        String refId = "TXN" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();

        Transaction transaction = Transaction.builder()
                .referenceId(refId)
                .type("WITHDRAWAL")
                .fromAccountId(accountId)
                .amount(amount)
                .status("PENDING")
                .remarks(remarks)
                .build();
        transaction = transactionRepository.save(transaction);

        boolean withdrawn = accountServiceClient.withdraw(accountId, amount);
        if (!withdrawn) {
            transaction.setStatus("FAILED");
            transactionRepository.save(transaction);
            throw new TransactionFailedException("Withdrawal failed - insufficient funds, account not active, or invalid account");
        }

        transaction.setStatus("SUCCESS");
        transaction = transactionRepository.save(transaction);

        notificationServiceClient.sendTransactionNotification(accountId,
                "Withdrawal of Rs. " + amount + " debited from your account. Ref: " + refId);

        return transaction;
    }

    public List<Transaction> getHistoryForAccount(Long accountId) {
        return transactionRepository.findByFromAccountIdOrToAccountIdOrderByCreatedAtDesc(accountId, accountId);
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }
}
