import { IoCustomEventManager } from "../IoCustomEventManager";
import { WorkfrontTaskCreatedEvent } from "../a2b_events/WorkfrontTaskCreatedEvent";
import { WorkfrontTaskUpdatedEvent } from "../a2b_events/WorkfrontTaskUpdatedEvent";
import { WorkfrontTaskCompletedEvent } from "../a2b_events/WorkfrontTaskCompletedEvent";
import aioLogger from "@adobe/aio-lib-core-logging";

export class WorkfrontEventHandler {
    async handleEvent(event: any): Promise<any> {
        const logger = aioLogger("WorkfrontEventHandler", { level: event.LOG_LEVEL || "info" });
        logger.info("Workfront Event Handler called", event);
        const s2s = {
            clientId: event.S2S_CLIENT_ID,
            clientSecret: event.S2S_CLIENT_SECRET,
            scopes: Array.isArray(event.S2S_SCOPES) ? event.S2S_SCOPES.join(',') : String(event.S2S_SCOPES),
            orgId: event.ORG_ID
        } as any;
        const applicationRuntimeInfo = {
            consoleId: '',
            projectName: '',
            workspace: '',
            actionPackageName: event.AIO_ACTION_PACKAGE_NAME,
            app_name: event.AIO_app_name
        } as any;
        const ioCustomEventManager = new IoCustomEventManager(
            event.LOG_LEVEL,
            s2s,
            applicationRuntimeInfo
        );

        switch (event.type) {
            case 'workfront.task.created':
                logger.info("Workfront task created event", event);
                await ioCustomEventManager.publishEvent(new WorkfrontTaskCreatedEvent(event.data));
                break;

            case 'workfront.task.updated':
                logger.info("Workfront task updated event", event);
                await ioCustomEventManager.publishEvent(new WorkfrontTaskUpdatedEvent(event.data));
                break;

            case 'workfront.task.completed':
                logger.info("Workfront task completed event", event);
                await ioCustomEventManager.publishEvent(new WorkfrontTaskCompletedEvent(event.data));
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