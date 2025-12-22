import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Kafka } from 'kafkajs';

const mockProducer = {
    connect: jest.fn(),
    send: jest.fn(),
    disconnect: jest.fn()
};

const mockConsumer = {
    connect: jest.fn(),
    subscribe: jest.fn(),
    run: jest.fn(),
    disconnect: jest.fn()
};

const mockKafka = {
    producer: jest.fn(() => mockProducer),
    consumer: jest.fn(() => mockConsumer)
};

jest.mock('kafkajs', () => ({
    Kafka: jest.fn(() => mockKafka)
}));

jest.mock('../../../src/services/gorseRecommendationService', () => ({
    gorseService: { trackInteraction: jest.fn() }
}));

import { kafkaEventService } from '../../../src/services/kafkaEventService';

describe('KafkaEventService - Brutal Unit Tests', () => {
    beforeEach(() => {
        process.env.KAFKA_BROKERS = 'localhost:9092';
        jest.clearAllMocks();
    });

    describe('initialize', () => {
        it('should connect producer and consumer', async () => {
            await kafkaEventService.initialize();
            expect(mockProducer.connect).toHaveBeenCalled();
            expect(mockConsumer.connect).toHaveBeenCalled();
            expect(mockConsumer.subscribe).toHaveBeenCalled();
            expect(mockConsumer.run).toHaveBeenCalled();
        });
    });

    describe('trackEvent', () => {
        it('should send event to kafka', async () => {
            // Ensure producer is "connected"
            await kafkaEventService.initialize();

            const event = {
                sessionId: 'sess_1',
                eventType: 'view' as const,
                entityType: 'note' as const,
                entityId: 'note_1',
                timestamp: new Date()
            };

            const result = await kafkaEventService.trackEvent(event);

            expect(result).toBe(true);
            expect(mockProducer.send).toHaveBeenCalledWith(expect.objectContaining({
                topic: 'user-events',
                messages: expect.arrayContaining([expect.objectContaining({
                    key: 'sess_1'
                })])
            }));
        });

        it('should fail if producer not connected', async () => {
            (kafkaEventService as any).isProducerConnected = false;
            const result = await kafkaEventService.trackEvent({} as any);
            expect(result).toBe(false);
        });
    });

    describe('shutdown', () => {
        it('should disconnect clients', async () => {
            // Fake connections
            (kafkaEventService as any).isProducerConnected = true;
            (kafkaEventService as any).isConsumerConnected = true;

            await kafkaEventService.shutdown();

            expect(mockProducer.disconnect).toHaveBeenCalled();
            expect(mockConsumer.disconnect).toHaveBeenCalled();
        });
    });
});
