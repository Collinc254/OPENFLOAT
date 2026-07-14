package com.openfloat.middleware;

import com.openfloat.middleware.model.Tenant;
import com.openfloat.middleware.repository.TenantRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class MiddlewareApplication {

	public static void main(String[] args) {
		SpringApplication.run(MiddlewareApplication.class, args);
	}

	@Bean
	CommandLineRunner seedTenant(TenantRepository tenantRepository) {
		return args -> {
			if (tenantRepository.findByTenantIdAndIsActiveTrue("tenant-1").isEmpty()) {
				Tenant tenant = new Tenant();
				tenant.setTenantId("tenant-1");
				tenant.setName("Demo Tenant");
				tenant.setActive(true);
				tenant.setCallbackUrl("https://example.com/callback");
				tenantRepository.save(tenant);
			}
		};
	}

}
