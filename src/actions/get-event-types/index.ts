/**
 * Get Event Types Action
 * 
 * Provides a REST API endpoint to retrieve all supported event types
 * for rules management and configuration.
 */

import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { EventTypeRegistry, initializeEventRegistry } from "../classes/EventTypeRegistry";

export async function main(params: any): Promise<any> {
    const logger = aioLogger("get-event-types", { level: params.LOG_LEVEL || "info" });

    try {
        // Initialize the event registry
        initializeEventRegistry();

        const requiredParams: string[] = [];
        const requiredHeaders: string[] = [];
        const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
        if (errorMessage) {
            return errorResponse(400, errorMessage, logger);
        }

        // Get query parameters for filtering
        const category = params.category;
        const includeExamples = params.includeExamples === 'true';
        const format = params.format || 'json';

        let eventTypes;

        if (category) {
            eventTypes = EventTypeRegistry.getEventTypesByCategory(category);
            logger.info(`Retrieved ${eventTypes.length} event types for category: ${category}`);
        } else {
            eventTypes = EventTypeRegistry.getAllEventTypes();
            logger.info(`Retrieved ${eventTypes.length} total event types`);
        }

        // Format response based on requested format
        let responseData;
        switch (format) {
            case 'rules':
                // Format optimized for rules management
                responseData = {
                    eventTypes: eventTypes.map(event => ({
                        type: event.type,
                        category: event.category,
                        description: event.description,
                        handler: event.handler,
                        routingRules: event.routingRules,
                        requiredFields: event.requiredFields,
                        optionalFields: event.optionalFields,
                        ...(includeExamples && { example: event.example })
                    })),
                    categories: [...new Set(eventTypes.map(e => e.category))],
                    totalCount: eventTypes.length
                };
                break;

            case 'simple':
                // Simple list format
                responseData = {
                    eventTypes: eventTypes.map(event => ({
                        type: event.type,
                        category: event.category,
                        description: event.description
                    })),
                    totalCount: eventTypes.length
                };
                break;

            case 'json':
            default:
                // Full metadata format
                responseData = {
                    eventTypes: includeExamples ? eventTypes : eventTypes.map(event => {
                        const { example, ...eventWithoutExample } = event;
                        return eventWithoutExample;
                    }),
                    categories: [...new Set(eventTypes.map(e => e.category))],
                    totalCount: eventTypes.length,
                    supportedFormats: ['json', 'simple', 'rules']
                };
                break;
        }

        return {
            statusCode: 200,
            body: {
                message: 'Event types retrieved successfully',
                data: responseData
            }
        };

    } catch (error: unknown) {
        logger.error('Error retrieving event types', error as any);
        return {
            statusCode: 500,
            body: {
                message: 'Error retrieving event types',
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        };
    }
}
