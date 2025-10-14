import { a2bEvent } from '../A2bEvent';
import { WORKFRONT_EVENT_CODE } from '../../constants';

export class WorkfrontTaskCreatedEvent extends a2bEvent {
    constructor(taskData: any) {
        super();
        this.type = WORKFRONT_EVENT_CODE.TASK_CREATED;
        this.data = taskData;
    }
}
