import { CloudEvent } from 'cloudevents';
import { IIoEvent } from '../types/index';

export abstract class IoEvent implements IIoEvent {
    source: string;
    type: string;
    datacontenttype: string;
    data: any;
    id: string;

    constructor() {
        // Abstract class constructor
    }

    validate(): boolean {
        return (
            this.data.bid !== undefined &&
            this.data.secret !== undefined &&
            this.data.name !== undefined &&
            this.data.endPointUrl !== undefined &&
            typeof this.data.enabled === 'boolean'
        );
    }

    toJSON(): any {
        return {
            source: this.source,
            type: this.type,
            datacontenttype: this.datacontenttype,
            data: this.data,
            id: this.id
        };
    }

    setSource(sourceProviderId: string): void {
        this.source = sourceProviderId = `urn:uuid:${sourceProviderId}`;
    }

    toCloudEvent(): CloudEvent {
        const cloudEvent = new CloudEvent(this.toJSON());
        return cloudEvent;
    }
} 