# OpenFloat Enterprise Middleware

The official Spring Boot backend for the OpenFloat Enterprise Middleware Portal. This service acts as the central API gateway, handling Safaricom Daraja API integrations, asynchronous webhook deliveries, and secure payment processing for external client systems.

## Technology Stack

* **Framework:** Spring Boot (Java 21)
* **Database:** PostgreSQL (NeonDB) with Spring Data JPA
* **Message Broker:** RabbitMQ (CloudAMQP) for asynchronous webhooks
* **Caching:** Redis for configuration caching and idempotency
* **Security:** Spring Security with JWT Authentication & AES-256 Column Encryption
* **Build Tool:** Maven

## Local Development Setup

To run this middleware on your local machine, ensure you have Java 21 and Maven installed.

### 1. Environment Variables Configuration

The application requires specific environment variables to connect to external databases and APIs. Create a `.env` file in the root directory (or export these to your local environment) with the following keys:

```properties
# Database Credentials (NeonDB)
DB_URL=jdbc:postgresql://your-neon-db-url
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

# Message Broker (CloudAMQP)
RABBITMQ_URL=amqp://your-cloudamqp-url

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Security Secrets
ADMIN_USERNAME=your_admin_user
ADMIN_PASSWORD=your_admin_password
ENCRYPTION_SECRET=YourSuperSecretAES256KeyHere

System Architecture Highlights
Dynamic Multi-Tenancy: Daraja credentials (STK Push, B2C, C2B) are securely stored in the PostgreSQL database and retrieved dynamically, allowing for multiple active client Paybills.

Asynchronous Webhooks: Daraja callbacks are instantly acknowledged and routed to RabbitMQ. A separate worker process handles HTTP delivery to external client systems, ensuring Safaricom connections never timeout.

Zero-Downtime Swapping: Sandbox and Production credentials can be swapped via the Admin Console without requiring a server restart.