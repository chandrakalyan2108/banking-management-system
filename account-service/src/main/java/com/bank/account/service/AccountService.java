package com.bank.account.service;

import com.bank.account.dto.OpenAccountRequest;
import com.bank.account.exception.AccountNotFoundException;
import com.bank.account.exception.InsufficientFundsException;
import com.bank.account.model.Account;
import com.bank.account.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public Account openAccount(OpenAccountRequest request) {
        Account account = Account.builder()
                .accountNumber(generateAccountNumber())
                .customerId(request.getCustomerId())
                .accountType(request.getAccountType() != null ? request.getAccountType() : "SAVINGS")
                .balance(request.getInitialDeposit() != null ? request.getInitialDeposit() : BigDecimal.ZERO)
                .currency(request.getCurrency() != null ? request.getCurrency() : "USD")
                .status("ACTIVE")
                .build();
        return accountRepository.save(account);
    }

    @Cacheable(value = "accounts", key = "#id")
    public Account getAccountById(Long id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + id));
    }

    public Account getAccountByNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + accountNumber));
    }

    public List<Account> getAccountsByCustomer(Long customerId) {
        return accountRepository.findByCustomerId(customerId);
    }

    public List<Account> getAllAccounts() {
        return accountRepository.findAll();
    }

    @Transactional
    @CacheEvict(value = "accounts", key = "#id")
    public Account deposit(Long id, BigDecimal amount) {
        Account account = getAccountByIdForUpdate(id);
        account.setBalance(account.getBalance().add(amount));
        return accountRepository.save(account);
    }

    @Transactional
    @CacheEvict(value = "accounts", key = "#id")
    public Account withdraw(Long id, BigDecimal amount) {
        Account account = getAccountByIdForUpdate(id);
        if (account.getBalance().compareTo(amount) < 0) {
            throw new InsufficientFundsException("Insufficient funds in account: " + account.getAccountNumber());
        }
        account.setBalance(account.getBalance().subtract(amount));
        return accountRepository.save(account);
    }

    private Account getAccountByIdForUpdate(Long id) {
        return accountRepository.findById(id)
                .orElseThrow(() -> new AccountNotFoundException("Account not found: " + id));
    }

    @Transactional
    @CacheEvict(value = "accounts", key = "#id")
    public Account closeAccount(Long id) {
        Account account = getAccountByIdForUpdate(id);
        account.setStatus("CLOSED");
        return accountRepository.save(account);
    }

    private String generateAccountNumber() {
        StringBuilder sb = new StringBuilder("AC");
        for (int i = 0; i < 10; i++) {
            sb.append(RANDOM.nextInt(10));
        }
        return sb.toString();
    }
}
