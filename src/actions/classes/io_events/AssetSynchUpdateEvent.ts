import { IoEvent } from '../IoEvent';

export class AssetSynchUpdateEvent extends IoEvent {
    constructor(assetData: any) {
        super();
        this.type = 'com.adobe.a2b.assetsynch.update';
        this.data = assetData;
    }
} 