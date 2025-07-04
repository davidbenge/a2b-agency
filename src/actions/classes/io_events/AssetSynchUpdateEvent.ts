import { IoEvent } from '../IoEvent';

export class AssetSynchUpdateEvent extends IoEvent {
    constructor(assetData: any) {
        super();
        this.type = 'com.adobe.a2b.assetsynch.update';
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