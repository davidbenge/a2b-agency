import { CloudEvent } from 'cloudevents';
import { IIoEvent, IValidationResult } from '../types/index';
import { v4 as uuidv4 } from 'uuid';

export abstract class IoEvent implements IIoEvent {
    source: string;
    type: string;
    datacontenttype: string;
    data: any;
    id: string;

    constructor() {
        // Abstract class constructor
        this.datacontenttype = 'application/json';
        this.id = uuidv4(); // set the id
    }

    validate(): IValidationResult {
        const missing: string[] = [];
        if (this.data.brandId === undefined) missing.push('brandId');
        if (this.data.secret === undefined) missing.push('secret');
        if (this.data.name === undefined) missing.push('name');
        if (this.data.endPointUrl === undefined) missing.push('endPointUrl');
        if (typeof this.data.enabled !== 'boolean') missing.push('enabled(boolean)');
        const valid = missing.length === 0;
        return {
            valid,
            message: valid ? undefined : `Missing or invalid required field(s): ${missing.join(', ')}`,
            missing: valid ? undefined : missing
        };
    }

    /****
     * toJSON - convert the event to a JSON object
     * 
     * @returns any
     *******/
    toJSON(): any {
        var returnJson = {
            "source": `${this.source}`,
            "type": `${this.type}`,
            "datacontenttype": `${this.datacontenttype}`,
            "id": `${this.id}`,
            "data": {} as any
        };

        // if the data is an object and has a toJSON function, use it
        if (typeof this.data.toJSON === 'function') {
            returnJson.data = this.data.toJSON();
        }else{
            returnJson.data = this.data;
        }
        
        return returnJson;
    }

    setSource(sourceProviderId: string): void {
        this.source = sourceProviderId = `urn:uuid:${sourceProviderId}`;
    }

    toCloudEvent(): CloudEvent {
        const cloudEvent = new CloudEvent(this.toJSON());
        return cloudEvent;
    }

} 