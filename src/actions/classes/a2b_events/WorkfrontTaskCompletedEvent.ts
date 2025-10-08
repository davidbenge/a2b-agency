import { a2bEvent } from '../A2bEvent';

export class WorkfrontTaskCompletedEvent extends a2bEvent {
    constructor(taskData: any) {
        super();
        this.type = 'com.adobe.a2b.workfront.task.completed';
        this.data = taskData;
    }
}
