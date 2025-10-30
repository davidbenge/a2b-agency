/**
 * workfront-internal-event-handler
 *
 * This internal handler processes Workfront events and publishes them to Adobe I/O Events.
 * It handles task created, updated, and completed events from Workfront.
 */

import { EventManager } from '../../../classes/EventManager';
import aioLogger from "@adobe/aio-lib-core-logging";
import { sanitizeEventForLogging } from '../../../utils/eventSanitizer';

export async function main(params: any): Promise<any> {
    const ACTION_NAME = 'agency:workfront-internal-event-handler';
    const logger = aioLogger(ACTION_NAME, { level: params.LOG_LEVEL || "info" });

    // Log sanitized incoming event
    logger.info(`${ACTION_NAME}: Received event`, sanitizeEventForLogging(params));

    // handle IO webhook challenge
    if (params.challenge) {
        const response = {
            statusCode: 200,
            body: { challenge: params.challenge }
        }
        return response;
    }

    try {
        logger.info(`${ACTION_NAME}: Processing Workfront event type: ${params.type}`);
        
        // Create EventManager for processing
        const eventManager = new EventManager(params);

        // Route based on event type
        switch (params.type) {
            case 'workfront.task.created':
                logger.info(`${ACTION_NAME}: Processing task created event`);
                await eventManager.processEvent(
                    'com.adobe.a2b.workfront.task.created',
                    null,  // No brand for workfront events - published to Adobe I/O Events
                    params.data
                );
                break;

            case 'workfront.task.updated':
                logger.info(`${ACTION_NAME}: Processing task updated event`);
                await eventManager.processEvent(
                    'com.adobe.a2b.workfront.task.updated',
                    null,  // No brand for workfront events - published to Adobe I/O Events
                    params.data
                );
                break;

            case 'workfront.task.completed':
                logger.info(`${ACTION_NAME}: Processing task completed event`);
                await eventManager.processEvent(
                    'com.adobe.a2b.workfront.task.completed',
                    null,  // No brand for workfront events - published to Adobe I/O Events
                    params.data
                );
                break;

            default:
                logger.warn(`${ACTION_NAME}: Unhandled Workfront event type: ${params.type}`);
                return {
                    statusCode: 400,
                    body: {
                        message: `Unhandled Workfront event type: ${params.type}`,
                        error: 'Event type not supported'
                    }
                };
        }

        return {
            statusCode: 200,
            body: {
                message: 'Workfront event processed successfully',
                eventType: params.type
            }
        };

    } catch (error: unknown) {
        logger.error(`${ACTION_NAME}: Error processing Workfront event`, error as any);
        return {
            statusCode: 500,
            body: {
                message: 'Error processing Workfront event',
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        };
    }
}

