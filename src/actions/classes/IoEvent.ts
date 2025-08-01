import { CloudEvent } from 'cloudevents';
import { IIoEvent, IEventData } from '../types/index';

export abstract class IoEvent implements IIoEvent {
    source: string;
    type: string;
    datacontenttype: string;
    data: IEventData;
    id: string;

    constructor() {
        // Abstract class constructor
        this.datacontenttype = 'application/json';
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
        this.source = `urn:uuid:${sourceProviderId}`;
    }

    toCloudEvent(): CloudEvent {
        const cloudEvent = new CloudEvent(this.toJSON());
        return cloudEvent;
    }

    // NEW: Helper methods for Adobe Developer Console data
    getAdobeProjectId(): string | undefined {
        return this.data.adobeProject?.id;
    }

    getAdobeWorkspaceId(): string | undefined {
        return this.data.adobeProject?.workspace.id;
    }

    getAdobeRuntimeUrl(): string | undefined {
        return this.data.adobeProject?.workspace.action_url;
    }

    getAdobeImsOrgId(): string | undefined {
        return this.data.adobeProject?.org.ims_org_id;
    }

    getAdobeOrgName(): string | undefined {
        return this.data.adobeProject?.org.name;
    }
} 