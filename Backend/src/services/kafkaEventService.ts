/**
 * KAFKA EVENT TRACKING SERVICE
 * 
 * Real-time event streaming for user behavior tracking
 * FREE: Apache 2.0 license, self-hosted
 * 
 * Events tracked:
 * - Note views
 * - Note clicks
 * - Purchases
 * - Searches
 * - Wishlist additions
 */

import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { gorseService } from './gorseRecommendationService';

interface UserEvent {
    userId?: string;
    sessionId: string;
    eventType: 'view' | 'click' | 'purchase' | 'search' | 'wishlist_add';
    entityType: 'note' | 'category' | 'seller';
    entityId: string;
    metadata?: {
        query?: string;
        scrollDepth?: number;
        timeSpent?: number;
        device?: string;
        ipAddress?: string;
        userAgent?: string;
    };
    timestamp: Date;
}

class KafkaEventService {
    private kafka: Kafka | null = null;
    private producer: Producer | null = null;
    private consumer: Consumer | null = null;
    private isProducerConnected = false;
    private isConsumerConnected = false;
    private isEnabled = false;

    constructor() {
        // Only enable if KAFKA_BROKERS is explicitly set
        if (!process.env.KAFKA_BROKERS) {
            console.log('NOTICE: KAFKA_BROKERS not set. Kafka event tracking disabled.');
            return;
        }

        this.isEnabled = true;
        const brokers = process.env.KAFKA_BROKERS.split(',');
        const clientId = process.env.KAFKA_CLIENT_ID || 'studyvault-backend';

        try {
            this.kafka = new Kafka({
                clientId,
                brokers,
                retry: {
                    retries: 3,
                    initialRetryTime: 100,
                    maxRetryTime: 30000
                }
            });

            this.producer = this.kafka.producer();
            this.consumer = this.kafka.consumer({
                groupId: 'recommendation-group',
                sessionTimeout: 30000,
                heartbeatInterval: 3000
            });
        } catch (error) {
            console.error('❌ Failed to initialize Kafka client:', error);
            this.isEnabled = false;
        }
    }

    /**
     * Initialize Kafka producer and consumer
     */
    async initialize(): Promise<boolean> {
        if (!this.isEnabled || !this.kafka) return false;

        try {
            // Connect producer
            if (this.producer && !this.isProducerConnected) {
                await this.producer.connect();
                this.isProducerConnected = true;
                console.log('✅ Kafka producer connected');
            }

            // Connect consumer
            if (this.consumer && !this.isConsumerConnected) {
                await this.consumer.connect();
                await this.consumer.subscribe({
                    topic: 'user-events',
                    fromBeginning: false
                });
                this.isConsumerConnected = true;
                console.log('✅ Kafka consumer connected');

                // Start consuming
                this.startConsuming();
            }
            return true;
        } catch (error) {
            console.error('❌ Kafka initialization error:', error);
            // Disable on error to prevent further attempts
            this.isEnabled = false;
            return false;
        }
    }

    /**
     * Track a user event
     * This is the main entry point for all tracking
     */
    async trackEvent(event: UserEvent): Promise<boolean> {
        if (!this.isEnabled || !this.producer || !this.isProducerConnected) {
            return false;
        }

        try {
            const message = {
                key: event.userId || event.sessionId,
                value: JSON.stringify({
                    ...event,
                    timestamp: event.timestamp.toISOString()
                }),
                headers: {
                    eventType: event.eventType,
                    entityType: event.entityType
                }
            };

            await this.producer.send({
                topic: 'user-events',
                messages: [message]
            });

            // console.log(`📊 Event tracked: ${event.eventType} - ${event.entityId}`);
            return true;
        } catch (error) {
            console.error('❌ Kafka track event error:', error);
            return false;
        }
    }

    /**
     * Process events in real-time
     * Sends relevant events to Gorse for recommendation updates
     */
    private async startConsuming(): Promise<void> {
        if (!this.consumer) return;

        await this.consumer.run({
            eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
                try {
                    const event: UserEvent = JSON.parse(message.value!.toString());

                    // Send to Gorse based on event type
                    if (event.userId && event.entityType === 'note') {
                        const feedbackType = this.mapEventToFeedback(event.eventType);

                        if (feedbackType) {
                            await gorseService.trackInteraction(
                                event.userId,
                                event.entityId,
                                feedbackType
                            );
                        }
                    }

                    // Additional processing can go here:
                    // - Update Redis counters
                    // - Log to analytics
                    // - Send to other services

                } catch (error) {
                    console.error('❌ Event processing error:', error);
                }
            }
        });
    }

    /**
     * Map our event types to Gorse feedback types
     */
    private mapEventToFeedback(
        eventType: UserEvent['eventType']
    ): 'view' | 'purchase' | 'click' | 'like' | null {
        switch (eventType) {
            case 'view':
                return 'view';
            case 'purchase':
                return 'purchase';
            case 'click':
                return 'click';
            case 'wishlist_add':
                return 'like';
            default:
                return null;
        }
    }

    /**
     * Graceful shutdown
     */
    async shutdown(): Promise<void> {
        if (!this.isEnabled) return;

        try {
            if (this.producer && this.isProducerConnected) {
                await this.producer.disconnect();
                this.isProducerConnected = false;
                console.log('Kafka producer disconnected');
            }

            if (this.consumer && this.isConsumerConnected) {
                await this.consumer.disconnect();
                this.isConsumerConnected = false;
                console.log('Kafka consumer disconnected');
            }
        } catch (error) {
            console.error('Kafka shutdown error:', error);
        }
    }
}

// Singleton instance
export const kafkaEventService = new KafkaEventService();

// Graceful shutdown on process exit
process.on('SIGTERM', async () => {
    await kafkaEventService.shutdown();
});

process.on('SIGINT', async () => {
    await kafkaEventService.shutdown();
});
