import { IoEvent } from '../IoEvent';

export class WorkfrontTaskCreatedEvent extends IoEvent {
    constructor(taskData: any) {
        super();
        this.type = 'com.adobe.a2b.workfront.task.created';
        this.data = taskData;
    }
} 