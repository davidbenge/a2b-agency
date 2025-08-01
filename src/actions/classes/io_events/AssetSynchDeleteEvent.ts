import { IoEvent } from '../IoEvent';
import { IEventData, IAdobeProject } from '../../types/index';

export class AssetSynchDeleteEvent extends IoEvent {
    constructor(assetData: any, adobeProject?: IAdobeProject) {
        super();
        this.type = 'com.adobe.a2b.assetsynch.delete';
        
        // Create enhanced event data
        const eventData: IEventData = {
            ...assetData,
            eventType: 'asset_synch_delete',
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