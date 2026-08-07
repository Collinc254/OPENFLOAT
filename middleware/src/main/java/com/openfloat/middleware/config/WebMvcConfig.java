package com.openfloat.middleware.config;

import com.openfloat.middleware.security.SafaricomSecurityInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class WebMvcConfig implements WebMvcConfigurer {

    private final SafaricomSecurityInterceptor safaricomSecurityInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Apply the IP Whitelist guard exclusively to incoming Safaricom webhooks
        registry.addInterceptor(safaricomSecurityInterceptor)
                .addPathPatterns("/api/v1/c2b/validation")
                .addPathPatterns("/api/v1/c2b/confirmation")
                .addPathPatterns("/api/v1/reversals/result")
                .addPathPatterns("/api/v1/reversals/timeout");
    }
}