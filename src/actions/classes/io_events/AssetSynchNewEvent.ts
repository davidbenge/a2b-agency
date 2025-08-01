import { IoEvent } from '../IoEvent';
import { IEventData, IAdobeProject } from '../../types/index';

export class AssetSynchNewEvent extends IoEvent {
    constructor(assetData: any, adobeProject?: IAdobeProject) {
        super();
        this.type = 'com.adobe.a2b.assetsynch.new';
        
        // Create enhanced event data
        const eventData: IEventData = {
            ...assetData,
            eventType: 'asset_synch_new',
            eventTimestamp: new Date(),
            eventSource: 'aem_asset_handler'
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