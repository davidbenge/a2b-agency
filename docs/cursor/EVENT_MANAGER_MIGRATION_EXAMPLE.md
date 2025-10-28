# EventManager Migration Example

This document shows side-by-side comparison of OLD vs NEW EventManager patterns.

## Example: Asset Sync Handler

### OLD Pattern (Before Refactoring)

```typescript
import aioLogger from "@adobe/aio-lib-core-logging";
import { EventManager } from '../classes/EventManager';
import { AssetSyncUpdateEvent } from '../classes/a2b_events/AssetSyncUpdateEvent';
import { AssetSyncNewEvent } from '../classes/a2b_events/AssetSyncNewEvent';
import { BrandManager } from "../classes/BrandManager";
import { ApplicationRuntimeInfo } from "../classes/ApplicationRuntimeInfo";
import { AgencyIdentification } from "../classes/AgencyIdentification";
import { getEventDefinition } from "../../shared/classes/AppEventRegistry";

export async function main(params: any): Promise<any> {
  const logger = aioLogger('asset-sync-handler', { level: params.LOG_LEVEL || "info" });
  
  // OLD: Need to get event definition first
  const eventDefinition = getEventDefinition('com.adobe.a2b.assetsync.new');
  if (!eventDefinition) {
    throw new Error('Event definition not found');
  }
  
  // OLD: Pass event definition to constructor
  const eventManager = new EventManager(params, eventDefinition);
  const brandManager = new BrandManager(params.LOG_LEVEL);
  
  try {
    // Get AEM asset data...
    const aemAssetData = await getAemAssetData(aemHostUrl, aemAssetPath, params, logger);
    const metadata = aemAssetData["jcr:content"].metadata;
    const brandId = customer;
    const brand = await brandManager.getBrand(brandId);
    
    if (aemAssetData["jcr:content"].metadata["a2b__last_sync"]) {
      // ===== UPDATE EVENT =====
      
      // OLD: Manually get runtime info
      const appRtInfo = eventManager.getApplicationRuntimeInfo();
      
      // OLD: Manually construct event data
      const updateEventData = {
        app_runtime_info: appRtInfo.serialize(),
        asset_id: aemAssetData["jcr:uuid"],
        asset_path: aemAssetPath,
        metadata: metadata,
        brandId: brandId,
        asset_presigned_url: presignedUrl
      };
      
      // OLD: Create event instance manually
      const assetSyncEventUpdate = new AssetSyncUpdateEvent(updateEventData);
      
      // OLD: Manually get agency identification and set it
      const agencyId = AgencyIdentification.getAgencyIdentificationFromActionParams(params);
      if (agencyId) {
        assetSyncEventUpdate.setAgencyIdentification(agencyId);
      }
      
      if(brand && brand.enabled){
        try{
          // OLD: Manually send to brand
          logger.info('Sending update event to brand');
          const brandSendResponse = await brand.sendCloudEventToEndpoint(assetSyncEventUpdate);
          logger.info('Brand response:', brandSendResponse);

          // OLD: Manually publish to IO Events
          assetSyncEventUpdate.setSource(eventManager.getAssetSyncProviderId());
          await eventManager.publishEvent(assetSyncEventUpdate);
          logger.info('Update event published to IO');
        } catch(error: unknown){
          logger.error('Error sending update event to brand', error);
        }
      }
      
    } else {
      // ===== NEW EVENT =====
      
      // OLD: Manually get runtime info
      const appRtInfo = eventManager.getApplicationRuntimeInfo();
      const sourceProviderId = eventManager.getAssetSyncProviderId();
      
      // OLD: Create event with many parameters
      const assetSyncEventNew = new AssetSyncNewEvent(
        appRtInfo,
        aemAssetData["jcr:uuid"],
        aemAssetPath,
        metadata,
        presignedUrl,
        brandId,
        sourceProviderId
      );
      
      // OLD: Manually get agency identification and set it
      const agencyId = AgencyIdentification.getAgencyIdentificationFromActionParams(params);
      if (agencyId) {
        assetSyncEventNew.setAgencyIdentification(agencyId);
      }

      if(brand && brand.enabled){
        try{
          // OLD: Manually send to brand
          logger.info('Sending new event to brand');
          const brandSendResponse = await brand.sendCloudEventToEndpoint(assetSyncEventNew);
          logger.info('Brand response:', brandSendResponse);

          // OLD: Manually publish to IO Events
          assetSyncEventNew.setSource(eventManager.getAssetSyncProviderId());
          await eventManager.publishEvent(assetSyncEventNew);
          logger.info('New event published to IO');
        } catch(error: unknown){
          logger.error('Error sending event to brand', error);
        }
      }
    }

    return {
      statusCode: 200,
      body: { message: 'Asset event processed successfully' }
    };
  } catch (error: unknown) {
    return {
      statusCode: 500,
      body: { 
        message: 'Error processing IO event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}
```

### NEW Pattern (After Refactoring)

```typescript
import aioLogger from "@adobe/aio-lib-core-logging";
import { EventManager } from '../classes/EventManager';
import { BrandManager } from "../classes/BrandManager";

export async function main(params: any): Promise<any> {
  const logger = aioLogger('asset-sync-handler', { level: params.LOG_LEVEL || "info" });
  
  // NEW: No event definition needed - just pass params
  const eventManager = new EventManager(params);
  const brandManager = new BrandManager(params.LOG_LEVEL);
  
  try {
    // Get AEM asset data...
    const aemAssetData = await getAemAssetData(aemHostUrl, aemAssetPath, params, logger);
    const metadata = aemAssetData["jcr:content"].metadata;
    const brandId = customer;
    const brand = await brandManager.getBrand(brandId);
    
    if (aemAssetData["jcr:content"].metadata["a2b__last_sync"]) {
      // ===== UPDATE EVENT =====
      
      // NEW: Just prepare the data object
      const eventData = {
        asset_id: aemAssetData["jcr:uuid"],
        asset_path: aemAssetPath,
        metadata: metadata,
        brandId: brandId,
        asset_presigned_url: presignedUrl
      };
      
      // NEW: Single call handles everything - validation, injection, routing
      const result = await eventManager.processEvent(
        'com.adobe.a2b.assetsync.update',
        brand,
        eventData
      );
      
      logger.info('Update event published', {
        brandSent: !!result.brandSendResult,
        ioPublished: result.ioEventPublished
      });
      
    } else {
      // ===== NEW EVENT =====
      
      // NEW: Just prepare the data object
      const eventData = {
        asset_id: aemAssetData["jcr:uuid"],
        asset_path: aemAssetPath,
        metadata: metadata,
        brandId: brandId,
        asset_presigned_url: presignedUrl
      };
      
      // NEW: Single call handles everything
      const result = await eventManager.processEvent(
        'com.adobe.a2b.assetsync.new',
        brand,
        eventData
      );
      
      logger.info('New event published', {
        brandSent: !!result.brandSendResult,
        ioPublished: result.ioEventPublished
      });
    }

    return {
      statusCode: 200,
      body: { message: 'Asset event processed successfully' }
    };
  } catch (error: unknown) {
    return {
      statusCode: 500,
      body: { 
        message: 'Error processing IO event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}
```

## Key Differences

### Constructor

**OLD:**
```typescript
const eventDefinition = getEventDefinition('com.adobe.a2b.assetsync.new');
const eventManager = new EventManager(params, eventDefinition);
```

**NEW:**
```typescript
const eventManager = new EventManager(params);
```

### Event Construction

**OLD:**
```typescript
const appRtInfo = eventManager.getApplicationRuntimeInfo();
const agencyId = AgencyIdentification.getAgencyIdentificationFromActionParams(params);
const assetSyncEventNew = new AssetSyncNewEvent(
  appRtInfo,
  assetId,
  assetPath,
  metadata,
  presignedUrl,
  brandId,
  sourceProviderId
);
assetSyncEventNew.setAgencyIdentification(agencyId);
```

**NEW:**
```typescript
const eventData = {
  asset_id: assetId,
  asset_path: assetPath,
  metadata: metadata,
  brandId: brandId,
  asset_presigned_url: presignedUrl
};
```

### Publishing

**OLD:**
```typescript
// Send to brand
if(brand && brand.enabled) {
  const brandSendResponse = await brand.sendCloudEventToEndpoint(event);
}

// Publish to IO Events
event.setSource(eventManager.getAssetSyncProviderId());
await eventManager.publishEvent(event);
```

**NEW:**
```typescript
// Single call handles both brand send and IO Events publish
const result = await eventManager.processEvent(
  'com.adobe.a2b.assetsync.new',
  brand,
  eventData
);
```

## Code Reduction

**Lines of code:**
- OLD: ~60 lines for event handling
- NEW: ~20 lines for event handling

**Reduction: ~67% fewer lines of code**

## Benefits Summary

### 1. Simpler Code
- No manual event class instantiation
- No manual injection of runtime info or agency identification
- No manual routing decisions

### 2. Automatic Validation
```typescript
// NEW: Automatically validates required fields from event registry
const missingFields = eventDefinition.requiredFields.filter(
  field => !(field in eventData)
);
```

### 3. Automatic Injection
```typescript
// NEW: Automatically injects based on event definition
if (eventDefinition.injectedObjects?.includes('app_runtime_info')) {
  completeEventData.app_runtime_info = { ... };
}
if (eventDefinition.injectedObjects?.includes('agency_identification')) {
  completeEventData.agency_identification = { ... };
}
```

### 4. Intelligent Routing
```typescript
// NEW: Automatically decides whether to send to brand
const shouldSendToBrand = brand && 
  (brand.enabled || eventCode === 'com.adobe.a2b.registration.disabled') &&
  eventDefinition.sendSecretHeader;
```

### 5. Better Error Handling
```typescript
// NEW: Clear error messages
throw new Error(`Missing required fields for 'com.adobe.a2b.assetsync.new': asset_id, asset_path`);
```

### 6. Better Return Value
```typescript
// NEW: Get results of both operations
const result = await eventManager.processEvent(...);
// result = {
//   brandSendResult?: IBrandEventPostResponse,
//   ioEventPublished: boolean
// }
```

## Migration Checklist

For each action that publishes events:

- [ ] Remove event definition lookup at top of action
- [ ] Update EventManager constructor to only pass params
- [ ] Replace event class instantiation with simple data object
- [ ] Remove manual `setAgencyIdentification()` calls
- [ ] Remove manual `setSource()` calls
- [ ] Remove manual `setSourceUri()` calls
- [ ] Replace separate `brand.sendCloudEventToEndpoint()` and `eventManager.publishEvent()` calls
- [ ] Use single `eventManager.processEvent()` call
- [ ] Update error handling to use new return value
- [ ] Test with different event types
- [ ] Update tests to match new pattern

## Testing the Migration

### Before Migration Test
```typescript
describe('OLD: Asset Sync Handler', () => {
  it('should publish new asset event', async () => {
    const params = { /* ... */ };
    const eventDefinition = getEventDefinition('com.adobe.a2b.assetsync.new');
    const eventManager = new EventManager(params, eventDefinition);
    const appRtInfo = eventManager.getApplicationRuntimeInfo();
    const event = new AssetSyncNewEvent(appRtInfo, /* ... */);
    await eventManager.publishEvent(event);
    // Assert...
  });
});
```

### After Migration Test
```typescript
describe('NEW: Asset Sync Handler', () => {
  it('should publish new asset event', async () => {
    const params = { /* ... */ };
    const eventManager = new EventManager(params);
    const eventData = {
      asset_id: 'test-123',
      asset_path: '/test/path',
      metadata: {},
      brandId: 'brand-123',
      asset_presigned_url: 'https://presigned.url'
    };
    const result = await eventManager.processEvent(
      'com.adobe.a2b.assetsync.new',
      brand,
      eventData
    );
    expect(result.ioEventPublished).toBe(true);
    expect(result.brandSendResult).toBeDefined();
  });
});
```

## Common Pitfalls

### 1. Forgetting to Update Tests
**Problem:** Old tests still use event classes
**Solution:** Update all tests to use `processEvent()`

### 2. Missing Required Fields
**Problem:** Event fails validation
**Solution:** Check event registry `requiredFields` array

### 3. Wrong Event Code
**Problem:** `Event code 'com.adobe.a2b.assetsync.new' not found in registry`
**Solution:** Verify event code exists in `AppEventRegistry`

### 4. Passing Wrong Brand Object
**Problem:** Brand is null when it should be defined
**Solution:** Check brand retrieval logic: `await brandManager.getBrand(brandId)`

## Related Files to Update

Common files that need migration:

1. `src/actions/agency-assetsync-internal-handler-process-complete/index.ts`
2. `src/actions/agency-assetsync-internal-handler-metadata-updated/index.ts`
3. `src/actions/new-brand-registration/index.ts`
4. `src/actions/update-brand/index.ts`
5. `src/actions/delete-brand/index.ts`
6. Any other action that uses `EventManager`

## Summary

The new `processEvent()` method provides a cleaner, more maintainable way to publish events:

- ✅ Less boilerplate code
- ✅ Automatic validation
- ✅ Automatic injection
- ✅ Intelligent routing
- ✅ Better error messages
- ✅ Clearer return values
- ✅ Easier to test

**Migration effort:** ~15-30 minutes per action
**Code reduction:** ~60-70% fewer lines
**Maintenance benefit:** Significant - changes to event structure only need updates in registry

