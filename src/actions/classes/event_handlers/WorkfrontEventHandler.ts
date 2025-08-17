import { IoEventHandler } from '../IoEventHandler';
import { IoCustomEventManager } from "../IoCustomEventManager";
import { WorkfrontTaskCreatedEvent } from "../io_events/WorkfrontTaskCreatedEvent";
import { WorkfrontTaskUpdatedEvent } from "../io_events/WorkfrontTaskUpdatedEvent";
import { WorkfrontTaskCompletedEvent } from "../io_events/WorkfrontTaskCompletedEvent";

export class WorkfrontEventHandler extends IoEventHandler {
    /*******
     * handleEvent - handle the Workfront event and determine appropriate action
     * 
     * @param event: any 
     * @returns Promise<any>
     *******/
    async handleEvent(event: any): Promise<any> {
        this.logger.info("Workfront Event Handler called", event);
        const ioCustomEventManager = new IoCustomEventManager(
            event.AIO_AGENCY_EVENTS_WORKFRONT_PROVIDER_ID,
            event.LOG_LEVEL,
            event
        );

        // Handle different Workfront event types
        switch (event.type) {
            case 'workfront.task.created':
                this.logger.info("Workfront task created event", event);
                await ioCustomEventManager.publishEvent(new WorkfrontTaskCreatedEvent(event.data));
                break;

            case 'workfront.task.updated':
                this.logger.info("Workfront task updated event", event);
                await ioCustomEventManager.publishEvent(new WorkfrontTaskUpdatedEvent(event.data));
                break;

            case 'workfront.task.completed':
                this.logger.info("Workfront task completed event", event);
                await ioCustomEventManager.publishEvent(new WorkfrontTaskCompletedEvent(event.data));
                break;

            default:
                this.logger.info("Workfront event not handled", event);
        }

        return {
            statusCode: 200,
            body: {
                message: 'Workfront event processed successfully',
            }
        }
    }
} 