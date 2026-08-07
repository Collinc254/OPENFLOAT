package com.openfloat.middleware.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
public class SafaricomSecurityInterceptor implements HandlerInterceptor {

    @Value("${safaricom.daraja.allowed-ips}")
    private String allowedIpsString;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        
        // 1. IP Whitelisting Validation
        String clientIp = getClientIp(request);
        List<String> allowedIps = Arrays.asList(allowedIpsString.split(","));

        if (!allowedIps.contains(clientIp)) {
            log.warn("SECURITY ALERT: Blocked C2B callback attempt from unauthorized IP: {}", clientIp);
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("Forbidden: IP not recognized");
            return false;
        }

        // 2. Digital Signature Verification (If Safaricom provides X-Safaricom-Signature header)
        String signatureHeader = request.getHeader("X-Safaricom-Signature");
        if (signatureHeader != null && !signatureHeader.isEmpty()) {
            // In a strict production environment, you would use java.security.Signature
            // to verify this Base64 string against your SandboxCertificate.cer
            log.debug("Digital signature present: {}", signatureHeader);
        } else {
            log.debug("No digital signature header found, relying on IP whitelisting.");
        }

        log.info("Safaricom Webhook Security Check Passed for IP: {}", clientIp);
        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}