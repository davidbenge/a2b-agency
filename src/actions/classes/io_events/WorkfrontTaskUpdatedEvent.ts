import { IoEvent } from '../IoEvent';

export class WorkfrontTaskUpdatedEvent extends IoEvent {
    constructor(taskData: any) {
        super();
        this.type = 'com.adobe.a2b.workfront.task.updated';
        this.data = taskData;
    }
} 