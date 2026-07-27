package com.bank.account.service;

import com.bank.account.dto.OpenAccountRequest;
import com.bank.account.exception.AccountNotActiveException;
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
        // New accounts start PENDING and must be approved by an admin before
        // any deposit, withdrawal, or transfer can happen on them. This is
        // an account APPLICATION, complete with the applicant's own details,
        // not an instantly-usable account.
        Account account = Account.builder()
                .accountNumber(generateAccountNumber())
                .customerId(request.getCustomerId())
                .accountType(request.getAccountType() != null ? request.getAccountType() : "SAVINGS")
                .balance(request.getInitialDeposit() != null ? request.getInitialDeposit() : BigDecimal.ZERO)
                .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
                .status("PENDING")
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .dateOfBirth(request.getDateOfBirth())
                .aadharNumber(request.getAadharNumber())
                .panNumber(request.getPanNumber())
                .place(request.getPlace())
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
    public Account approveAccount(Long id) {
        Account account = getAccountByIdForUpdate(id);
        account.setStatus("ACTIVE");
        return accountRepository.save(account);
    }

    @Transactional
    @CacheEvict(value = "accounts", key = "#id")
    public Account deposit(Long id, BigDecimal amount) {
        Account account = getAccountByIdForUpdate(id);
        requireActive(account);
        account.setBalance(account.getBalance().add(amount));
        return accountRepository.save(account);
    }

    @Transactional
    @CacheEvict(value = "accounts", key = "#id")
    public Account withdraw(Long id, BigDecimal amount) {
        Account account = getAccountByIdForUpdate(id);
        requireActive(account);
        if (account.getBalance().compareTo(amount) < 0) {
            throw new InsufficientFundsException("Insufficient funds in account: " + account.getAccountNumber());
        }
        account.setBalance(account.getBalance().subtract(amount));
        return accountRepository.save(account);
    }

    private void requireActive(Account account) {
        if (!"ACTIVE".equals(account.getStatus())) {
            throw new AccountNotActiveException(
                    "Account " + account.getAccountNumber() + " is " + account.getStatus()
                            + " and cannot be used for transactions until an admin approves it.");
        }
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
