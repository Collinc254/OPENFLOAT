package com.openfloat.middleware.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${openfloat.rabbitmq.queue}")
    private String queueName;

    @Value("${openfloat.rabbitmq.exchange}")
    private String exchangeName;

    @Value("${openfloat.rabbitmq.routing-key}")
    private String routingKey;

    // 1. Upgraded Main Queue: Configured with Dead-Letter Exchange rules
    @Bean
    public Queue queue() {
        return QueueBuilder.durable(queueName)
                .withArgument("x-dead-letter-exchange", exchangeName)
                .withArgument("x-dead-letter-routing-key", routingKey + ".dlq")
                .build();
    }

    // 2. Dead-Letter Queue (DLQ): Where failed payloads are parked for monitoring
    @Bean
    public Queue deadLetterQueue() {
        return QueueBuilder.durable(queueName + ".dlq").build();
    }

    // 3. Primary Direct Exchange
    @Bean
    public DirectExchange exchange() {
        return new DirectExchange(exchangeName);
    }

    // 4. Bind the Main Queue to the Exchange using your primary Routing Key
    @Bean
    public Binding binding(Queue queue, DirectExchange exchange) {
        return BindingBuilder.bind(queue).to(exchange).with(routingKey);
    }

    // 5. Bind the DLQ to the Exchange using the DLQ Routing Key
    @Bean
    public Binding dlqBinding(Queue deadLetterQueue, DirectExchange exchange) {
        return BindingBuilder.bind(deadLetterQueue).to(exchange).with(routingKey + ".dlq");
    }

    // 6. Configure Jackson to convert Java objects to JSON strings automatically
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    // 7. Configure RabbitTemplate with explicit type safety to clear IDE warnings
    @Bean
    public AmqpTemplate amqpTemplate(ConnectionFactory connectionFactory) {
        final RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }
}