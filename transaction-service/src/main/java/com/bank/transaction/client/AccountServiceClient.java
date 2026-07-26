package com.bank.transaction.client;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AccountServiceClient {

    private final RestTemplate restTemplate;

    @Value("${services.account-service.url}")
    private String accountServiceUrl;

    public JsonNode getAccount(Long accountId) {
        return restTemplate.getForObject(accountServiceUrl + "/api/accounts/" + accountId, JsonNode.class);
    }

    /**
     * Resolves a customer-visible account number (e.g. "AC7518998885") to its
     * internal database ID. Returns null if no account with that number exists.
     */
    public Long resolveAccountIdByNumber(String accountNumber) {
        try {
            JsonNode account = restTemplate.getForObject(
                    accountServiceUrl + "/api/accounts/number/" + accountNumber, JsonNode.class);
            if (account != null && account.has("id")) {
                return account.get("id").asLong();
            }
            return null;
        } catch (HttpClientErrorException.NotFound e) {
            return null;
        }
    }

    public boolean deposit(Long accountId, BigDecimal amount) {
        return callAmountEndpoint(accountId, amount, "deposit");
    }

    public boolean withdraw(Long accountId, BigDecimal amount) {
        return callAmountEndpoint(accountId, amount, "withdraw");
    }

    private boolean callAmountEndpoint(Long accountId, BigDecimal amount, String action) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, BigDecimal>> entity = new HttpEntity<>(Map.of("amount", amount), headers);
            restTemplate.exchange(
                    accountServiceUrl + "/api/accounts/" + accountId + "/" + action,
                    HttpMethod.POST, entity, JsonNode.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
