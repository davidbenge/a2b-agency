import { IoEvent } from '../IoEvent';
import { IBrand, IEventData, IAdobeProject } from '../../types/index';

export class NewBrandRegistrationEvent extends IoEvent {
    constructor(brand: IBrand, adobeProject?: IAdobeProject) {
        super();
        this.type = 'com.adobe.a2b.registration.received';
        
        // Create enhanced event data from brand
        const eventData: IEventData = {
            ...brand,
            eventType: 'brand_registration',
            eventTimestamp: new Date(),
            eventSource: 'brand_registration_handler'
        };

        // Add Adobe Developer Console context if provided
        if (adobeProject) {
            eventData.adobeProject = adobeProject;
            eventData.imsId = adobeProject.org.ims_org_id;
            eventData.imsOrgName = adobeProject.org.name;
            eventData.primaryWorkspaceId = adobeProject.workspace.id;
        }

        this.data = eventData;
    }
} 