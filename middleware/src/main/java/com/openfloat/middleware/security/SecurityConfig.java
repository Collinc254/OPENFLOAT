
package com.openfloat.middleware.security;

import com.openfloat.middleware.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value; // <-- MISSING IMPORT
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
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
            // 1. PUBLIC: Authentication endpoints & Spring Error page
            .requestMatchers("/api/v1/auth/**", "/error").permitAll()
            
            // 2. PUBLIC: Safaricom Callbacks MUST bypass security so Daraja can deliver receipts
            .requestMatchers("/api/v1/callbacks/**", "/api/v1/callback/**").permitAll()
            
            // 3. ADMIN ONLY: Admin Console, Key Rotation, and System Config
            .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
            
            // 4. OPERATOR & ADMIN: Executing Payments (STK, B2C, C2B)
            .requestMatchers("/api/v1/stk/**", "/api/v1/payments/**", "/api/v1/b2c/**", "/api/v1/c2b/**")
                .hasAnyRole("OPERATOR", "ADMIN")
            
            // 5. VIEWER & FINANCE: Viewing Invoices and History
            .requestMatchers("/api/v1/invoices/**")
                .hasAnyRole("VIEWER", "FINANCE", "OPERATOR", "ADMIN")
            
            // Everything else requires a valid JWT token
            .anyRequest().authenticated()
        )
        .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authenticationProvider(authenticationProvider()) 
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

    return http.build();
}


@Bean
public CommandLineRunner syncAdminPassword(
        UserRepository userRepository, 
        PasswordEncoder passwordEncoder,
        @Value("${ADMIN_PASSWORD:demo123}") String newPassword) {
            
    return args -> {
        System.out.println(">>> RUNNING PASSWORD SYNC...");
        
        userRepository.findByUsername("admin@openfloat.com").ifPresentOrElse(admin -> {
            admin.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(admin);
            System.out.println(">>> SUCCESS: Admin password updated in database!");
        }, () -> {
            System.out.println(">>> ERROR: Could not find user 'admin@openfloat.com' in the database. Password was NOT updated.");
        });
    };
}

   @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Added https://hoppscotch.io to the allowed origins
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000", 
            "https://openfloat.vercel.app",
            "https://hoppscotch.io" 
        ));
        
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        
        // Changed to allow all headers so Hoppscotch doesn't trigger a strict header rejection
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
