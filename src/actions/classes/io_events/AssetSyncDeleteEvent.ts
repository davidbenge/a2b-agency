import { IoEvent } from '../IoEvent';
import { AEM_ASSET_SYNC_EVENT_CODE } from '../../constants';

export class AssetSyncDeleteEvent extends IoEvent {
    constructor(assetData: any) {
        super();
        this.type = AEM_ASSET_SYNC_EVENT_CODE.DELETE;
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