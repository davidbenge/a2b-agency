import { IoEvent } from '../IoEvent';

export class WorkfrontTaskCompletedEvent extends IoEvent {
    constructor(taskData: any) {
        super();
        this.type = 'com.adobe.a2b.workfront.task.completed';
        this.data = taskData;
    }
} 