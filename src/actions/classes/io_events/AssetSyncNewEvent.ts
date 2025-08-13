import { AEM_ASSET_SYNC_EVENT_CODE } from '../../constants';
import { IValidationResult } from '../../types';
import { IoEvent } from '../IoEvent';

export class AssetSyncNewEvent extends IoEvent {
    private _assetId!: string;
    private _assetPath!: string;
    private _metadata!: any;
    private _brandId!: string;

    get assetId(): string { return this._assetId; }
    set assetId(value: string) { this._assetId = value; if (this.data) this.data.asset_id = value; }

    get assetPath(): string { return this._assetPath; }
    set assetPath(value: string) { this._assetPath = value; if (this.data) this.data.asset_path = value; }

    get metadata(): any { return this._metadata; }
    set metadata(value: any) { this._metadata = value; if (this.data) this.data.metadata = value; }

    get brandId(): string { return this._brandId; }
    set brandId(value: string) { this._brandId = value; if (this.data) this.data.brandId = value; }

    /****
     * constructor
     * 
     * @param assetId - the asset id
     * @param assetPath - the asset path
     * @param metadata - the metadata
     * @param brandId - the brand id    
     * @param sourceProviderId - the source provider id
     * 
     * @returns void
     *******/
    constructor(assetId: string, assetPath: string, metadata: any, brandId: string, sourceProviderId: string) {
        super();
        this.type = AEM_ASSET_SYNC_EVENT_CODE.NEW;
        // check for missing params and throw an descriptive error
        if (!assetId || assetId.length === 0) {
            throw new Error('AssetSyncNewEvent: constructor: assetId is required');
        }
        if (!assetPath || assetPath.length === 0) {
            throw new Error('AssetSyncNewEvent: constructor: assetPath is required');
        }
        if (!metadata || typeof metadata !== 'object') {
            throw new Error('AssetSyncNewEvent: constructor: metadata is required');
        }
        if (!brandId || brandId.length === 0) {
            throw new Error('AssetSyncNewEvent: constructor: brandId is required');
        }
        if (!sourceProviderId || sourceProviderId.length === 0) {
            throw new Error('AssetSyncNewEvent: constructor: sourceProviderId is required');
        }
        this._assetId = assetId;
        this._assetPath = assetPath;
        this._metadata = metadata;
        this._brandId = brandId;
        // set the event provider source id
        super.setSource(sourceProviderId);

        this.data = {
            asset_id: this._assetId,
            asset_path: this._assetPath,
            metadata: this._metadata,
            brandId: this._brandId
        };
    }

    /****
     * validate - validate the event
     * 
     * @returns IValidationResult   
     */
    validate(): IValidationResult {
        const ev = this.toJSON();
      
        const missing: string[] = [];
        const isPlainObject = (v: unknown) => v !== null && typeof v === 'object' && !Array.isArray(v);
        const isUuid = (v: unknown) =>
          typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
        const isUrnUuid = (v: unknown) =>
          typeof v === 'string' && /^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
      
        if (!isUrnUuid(ev.source)) missing.push('source');
      
        if (!isPlainObject(ev.data)) {
          missing.push('data');
        } else {
          const d: any = ev.data;
      
          // asset_id
          if (!isUuid(d.asset_id)) missing.push('asset_id');
      
          // asset_path (robust)
          const rawPath = d.asset_path;
          const pathStr = typeof rawPath === 'string' ? rawPath : String(rawPath ?? '');
          const cleaned = pathStr.replace(/[\u200B-\u200D\uFEFF]/g, '').trim(); // strip zero‑width/BOM and trim
          if (cleaned.length === 0 || !cleaned.startsWith('/')) missing.push('asset_path');
      
          // metadata
          if (!isPlainObject(d.metadata)) missing.push('metadata');
      
          // brandId
          if (!isUuid(d.brandId)) missing.push('brandId');
        }
      
        const valid = missing.length === 0;
        return {
          valid,
          message: valid ? undefined : `AssetSyncNewEvent validation failed: ${missing.join(', ')}`,
          missing: valid ? undefined : missing
        };
    }
} 