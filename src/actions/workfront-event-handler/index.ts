/**
 * workfront-event-handler
 *
 * This action handles Workfront events and processes them accordingly.
 * It uses the WorkfrontEventHandler to manage different types of Workfront events
 * and publishes them to the Adobe Event Hub.
 */

import { WorkfrontEventHandler } from '../classes/event_handlers/WorkfrontEventHandler';
import aioLogger from "@adobe/aio-lib-core-logging";

export async function main(params: any): Promise<any> {
    // handle IO webhook challenge
    if (params.challenge) {
        const response = {
            statusCode: 200,
            body: { challenge: params.challenge }
        }
        return response;
    }

    try {
        // Initialize logger
        const logger = aioLogger("workfront-event-handler", { level: params.LOG_LEVEL || "info" });
        logger.debug("Received Workfront event", params);

        // Initialize and use the Workfront event handler
        const workfrontHandler = new WorkfrontEventHandler();
        const result = await workfrontHandler.handleEvent(params);

        return {
            statusCode: 200,
            body: {
                message: 'Workfront event processed successfully',
                result
            }
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: {
                message: 'Error processing Workfront event',
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }
} 