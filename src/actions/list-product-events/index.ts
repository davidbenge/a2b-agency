/**
 * list-product-events action
 * 
 * This action lists all supported Adobe Product events (AEM, Creative Cloud, etc.) 
 * that can be routed through the adobe-product-event-handler.
 * It provides an API endpoint for discovering available product events.
 * 
 * Query parameters:
 * - category: Filter by event category (product)
 * - eventCode: Get details for a specific event code
 */

import { 
    getAllProductEventCodes, 
    getProductEventsByCategory, 
    getProductEventDefinition, 
    getProductEventCategories, 
    EVENT_REGISTRY,
    getProductEventCountByCategory,
    isValidProductEventCode
} from '../../shared/classes/ProductEventRegistry';
import { ProductEventDefinition } from '../../shared/types';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants';
import aioLogger from '@adobe/aio-lib-core-logging';

interface ListProductEventsParams {
    category?: ProductEventDefinition['category'];
    eventCode?: string;
    LOG_LEVEL?: string;
}

interface SuccessResponse {
    statusCode: number;
    body: {
        success: true;
        data: any;
    };
}

interface ErrorResponse {
    statusCode: number;
    body: {
        success: false;
        error: string;
        details?: any;
    };
}

type ActionResponse = SuccessResponse | ErrorResponse;

/**
 * Main action handler
 */
async function main(params: ListProductEventsParams): Promise<ActionResponse> {
    const logger = aioLogger('list-product-events', { level: params.LOG_LEVEL || 'info' });
    
    try {
        logger.info('List product events action called', { 
            category: params.category, 
            eventCode: params.eventCode 
        });

        const { category, eventCode } = params;

        // Handle specific event lookup
        if (eventCode) {
            logger.debug(`Looking up product event: ${eventCode}`);
            
            if (!isValidProductEventCode(eventCode)) {
                logger.warn(`Product event code not found: ${eventCode}`);
                return {
                    statusCode: HTTP_STATUS.NOT_FOUND,
                    body: {
                        success: false,
                        error: `Product event code '${eventCode}' not found in registry`,
                        details: {
                            availableEventCodes: getAllProductEventCodes()
                        }
                    }
                };
            }

            const event = getProductEventDefinition(eventCode);
            return {
                statusCode: HTTP_STATUS.OK,
                body: {
                    success: true,
                    data: {
                        event,
                        timestamp: new Date().toISOString()
                    }
                }
            };
        }

        // Handle category filter
        if (category) {
            logger.debug(`Filtering by category: ${category}`);
            
            const validCategories = getProductEventCategories();
            if (!validCategories.includes(category)) {
                logger.warn(`Invalid category: ${category}`);
                return {
                    statusCode: HTTP_STATUS.BAD_REQUEST,
                    body: {
                        success: false,
                        error: `Invalid category '${category}'`,
                        details: {
                            validCategories
                        }
                    }
                };
            }

            const events = getProductEventsByCategory(category);
            return {
                statusCode: HTTP_STATUS.OK,
                body: {
                    success: true,
                    data: {
                        category,
                        count: events.length,
                        events,
                        timestamp: new Date().toISOString()
                    }
                }
            };
        }

        // Return all product events with summary
        logger.debug('Returning all product events');
        const categories = getProductEventCategories();
        const eventCounts = getProductEventCountByCategory();
        
        return {
            statusCode: HTTP_STATUS.OK,
            body: {
                success: true,
                data: {
                    summary: {
                        totalEvents: getAllProductEventCodes().length,
                        categories,
                        eventCounts
                    },
                    events: EVENT_REGISTRY,
                    timestamp: new Date().toISOString()
                }
            }
        };

    } catch (error: unknown) {
        const err = error as Error;
        logger.error('Error in list-product-events action', { 
            error: err.message, 
            stack: err.stack 
        });
        
        return {
            statusCode: HTTP_STATUS.INTERNAL_ERROR,
            body: {
                success: false,
                error: ERROR_MESSAGES.PROCESSING_ERROR,
                details: {
                    message: err.message
                }
            }
        };
    }
}

exports.main = main;

