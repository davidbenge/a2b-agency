import { a2bEvent } from '../A2bEvent';

export class WorkfrontTaskUpdatedEvent extends a2bEvent {
    constructor(taskData: any) {
        super();
        this.type = 'com.adobe.a2b.workfront.task.updated';
        this.data = taskData;
    }
}
