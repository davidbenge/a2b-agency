import { a2bEvent } from '../A2bEvent';

export class WorkfrontTaskCreatedEvent extends a2bEvent {
    constructor(taskData: any) {
        super();
        this.type = 'com.adobe.a2b.workfront.task.created';
        this.data = taskData;
    }
}
