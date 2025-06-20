import { IoEvent } from '../IoEvent';

export class AssetSynchDeleteEvent extends IoEvent {
    constructor(assetData: any) {
        super();
        this.type = 'com.adobe.a2b.assetsynch.delete';
        this.data = assetData;
    }

    validate(): boolean {
        return (
            this.data.asset_id !== undefined &&
            this.data.asset_path !== undefined &&
            this.data.metadate !== undefined &&
            this.data.brandId !== undefined
        );
    }
} 