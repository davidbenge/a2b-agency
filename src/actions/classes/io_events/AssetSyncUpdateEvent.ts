import { AEM_ASSET_SYNC_EVENT_CODE } from '../../constants';
import { IoEvent } from '../IoEvent';

export class AssetSyncUpdateEvent extends IoEvent {
    constructor(assetData: any) {
        super();
        this.type = AEM_ASSET_SYNC_EVENT_CODE.UPDATE;
        this.data = assetData;
    }

    validate() {
        const missing: string[] = [];
        if (this.data.asset_id === undefined) missing.push('asset_id');
        if (this.data.asset_path === undefined) missing.push('asset_path');
        if (this.data.metadata === undefined) missing.push('metadata');
        if (this.data.brandId === undefined) missing.push('brandId');
        const valid = missing.length === 0;
        return {
            valid,
            message: valid ? undefined : `AssetSyncUpdateEvent validation failed: missing field(s): ${missing.join(', ')}`,
            missing: valid ? undefined : missing
        };
    }
} 