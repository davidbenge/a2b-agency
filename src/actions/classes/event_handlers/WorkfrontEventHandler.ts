import { EventManager } from "../EventManager";
import aioLogger from "@adobe/aio-lib-core-logging";

export class WorkfrontEventHandler {
    async handleEvent(event: any): Promise<any> {
        const logger = aioLogger("WorkfrontEventHandler", { level: event.LOG_LEVEL || "info" });
        logger.info("Workfront Event Handler called", event);
        
        const eventManager = new EventManager(event);

        switch (event.type) {
            case 'workfront.task.created':
                logger.info("Workfront task created event", event);
                await eventManager.processEvent(
                    'com.adobe.a2b.workfront.task.created',
                    null,  // No brand for workfront events
                    event.data
                );
                break;

            case 'workfront.task.updated':
                logger.info("Workfront task updated event", event);
                await eventManager.processEvent(
                    'com.adobe.a2b.workfront.task.updated',
                    null,  // No brand for workfront events
                    event.data
                );
                break;

            case 'workfront.task.completed':
                logger.info("Workfront task completed event", event);
                await eventManager.processEvent(
                    'com.adobe.a2b.workfront.task.completed',
                    null,  // No brand for workfront events
                    event.data
                );
                break;

            default:
                logger.info("Workfront event not handled", event);
        }

        return {
            statusCode: 200,
            body: {
                message: 'Workfront event processed successfully',
            }
        }
    }
} 