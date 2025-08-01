import { IoEvent } from '../IoEvent';
import { IEventData, IAdobeProject } from '../../types/index';

export class WorkfrontTaskCompletedEvent extends IoEvent {
    constructor(taskData: any, adobeProject?: IAdobeProject) {
        super();
        this.type = 'com.adobe.a2b.workfront.task.completed';
        
        // Create enhanced event data
        const eventData: IEventData = {
            ...taskData,
            eventType: 'workfront_task_completed',
            eventTimestamp: new Date(),
            eventSource: 'workfront_handler'
        };

        // Add Adobe Developer Console context if provided
        if (adobeProject) {
            eventData.adobeProject = adobeProject;
            eventData.imsId = adobeProject.org.ims_org_id;
            eventData.imsOrgName = adobeProject.org.name;
            eventData.primaryWorkspaceId = adobeProject.workspace.id;
        }

        this.data = eventData;
    }
} 