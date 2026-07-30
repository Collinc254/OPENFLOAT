package com.openfloat.middleware.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // 💥 FIX 1: Activates @PreAuthorize in our controllers
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .authorizeHttpRequests(auth -> auth
                
                // 0. EXPLICITLY ALLOW CORS PREFLIGHT
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // 1. PUBLIC: Authentication endpoints & Spring Error page
                .requestMatchers("/api/v1/auth/**", "/error").permitAll()
                
                // 2. PUBLIC: Safaricom Callbacks MUST bypass security
                .requestMatchers(
                        "/api/v1/callbacks/**", 
                        "/api/v1/callback/**", 
                        "/api/v1/payments/callback",
                        "/api/v1/b2c/result",
                        "/api/v1/b2c/timeout"
                ).permitAll()
                
                // 3. ADMIN CONSOLE & USER MANAGEMENT: Strict Admin lock
                // 💥 FIX 2: Added /api/v1/users/** so the register endpoint is locked here as well
                .requestMatchers("/api/v1/admin/**", "/api/v1/users/**").hasRole("ADMIN")
                
                // 4. PAYMENTS & TRANSACTIONS: 
                // 💥 FIX 3: Updated old roles to match the new Enum roles (STAFF, MANAGER, ADMIN)
                .requestMatchers("/api/v1/stk/**", "/api/v1/payments/**", "/api/v1/b2c/**", "/api/v1/c2b/**")
                    .hasAnyRole("STAFF", "MANAGER", "ADMIN")
                
                // 5. FINANCE
                .requestMatchers("/api/v1/invoices/**")
                    .hasAnyRole("MANAGER", "ADMIN")
                
                // Everything else requires authentication
                .anyRequest().authenticated()
            )
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider()) 
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000", 
            "https://openfloat.vercel.app",
            "https://hoppscotch.io" 
        ));
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*")); 
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}