import { IoEvent } from '../IoEvent';

export class AssetSynchNewEvent extends IoEvent {
    constructor(assetData: any) {
        super();
        this.type = 'com.adobe.a2b.assetsynch.new';
        this.data = assetData;
    }
} 