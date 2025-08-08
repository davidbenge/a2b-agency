import { AEM_ASSET_SYNC_EVENT_CODE } from '../../constants';
import { IoEvent } from '../IoEvent';

export class AssetSyncNewEvent extends IoEvent {
    constructor(assetData: any) {
        super();
        this.type = AEM_ASSET_SYNC_EVENT_CODE.NEW;
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