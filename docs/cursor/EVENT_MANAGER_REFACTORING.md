# EventManager Refactoring

## Overview

The EventManager has been refactored to support a more flexible, event-driven architecture. The key changes:

1. **Removed AppEventDefinition from constructor** - Events are now resolved at processing time
2. **Added `processEvent()` method** - New preferred method for event processing
3. **Automatic data validation** - Validates required fields based on event registry
4. **Automatic injection** - Injects app_runtime_info and agency_identification automatically
5. **Intelligent routing** - Evaluates routing rules, flags, and brand config to determine execution

## New Constructor

```typescript
// OLD: Required event definition at construction
const eventManager = new EventManager(params, appEventDefinition);

// NEW: Only requires params
const eventManager = new EventManager(params);
```

## New Event Processing Method

### Method Signature

```typescript
async processEvent(
    eventCode: string, 
    brand: Brand | null, 
    eventData: any
): Promise<{ 
    brandSendResult?: IBrandEventPostResponse; 
    ioEventPublished: boolean 
}>
```

### Parameters

- **eventCode**: Event code from the registry (e.g., `'com.adobe.a2b.assetsync.new'`)
- **brand**: Brand object or null (for events not tied to a specific brand)
- **eventData**: Event-specific data object

### Return Value

Returns an object with:
- **brandSendResult**: Response from brand endpoint (if sent)
- **ioEventPublished**: Boolean indicating if event was published to Adobe I/O Events

## Usage Examples

### Example 1: Asset Sync Event

```typescript
import { EventManager } from './classes/EventManager';
import { BrandManager } from './classes/BrandManager';

export async function main(params: any) {
    // Initialize EventManager (no event definition needed)
    const eventManager = new EventManager(params);
    const brandManager = new BrandManager(params.LOG_LEVEL);
    
    // Get the brand
    const brand = await brandManager.getBrand(brandId);
    
    // Prepare event data
    const eventData = {
        asset_id: assetId,
        asset_path: assetPath,
        metadata: assetMetadata,
        brandId: brandId,
        asset_presigned_url: presignedUrl
    };
    
    try {
        // Process event with automatic validation, injection, and routing
        const result = await eventManager.processEvent(
            'com.adobe.a2b.assetsync.new',
            brand,
            eventData
        );
        
        console.log('Brand send result:', result.brandSendResult);
        console.log('IO event published:', result.ioEventPublished);
    } catch (error) {
        console.error('Failed to process event:', error);
    }
}
```

### Example 2: Registration Event (No Brand Yet)

```typescript
export async function main(params: any) {
    const eventManager = new EventManager(params);
    
    // For registration.received, brand might not exist yet
    const eventData = {
        name: brandName,
        endPointUrl: endpointUrl,
        // ... other registration data
    };
    
    // Pass null for brand since it doesn't exist yet
    const result = await eventManager.processEvent(
        'com.adobe.a2b.registration.received',
        null,  // No brand yet
        eventData
    );
}
```

### Example 3: Workfront Task Event

```typescript
export async function main(params: any) {
    const eventManager = new EventManager(params);
    const brandManager = new BrandManager(params.LOG_LEVEL);
    
    const brand = await brandManager.getBrand(brandId);
    
    const eventData = {
        taskId: task.id,
        projectId: task.projectId,
        assigneeId: task.assigneeId,
        taskName: task.name,
        dueDate: task.dueDate,
        brandId: brandId
    };
    
    const result = await eventManager.processEvent(
        'com.adobe.a2b.workfront.task.created',
        brand,
        eventData
    );
}
```

## What Happens Behind the Scenes

When you call `processEvent()`, the EventManager:

### 1. Looks up event definition from registry
```typescript
const eventDefinition = getEventDefinition(eventCode);
```

### 2. Validates required fields
```typescript
// Checks that all fields from eventDefinition.requiredFields are present
const missingFields = eventDefinition.requiredFields.filter(
    field => !(field in eventData)
);
```

### 3. Injects app_runtime_info (if specified in event definition)
```typescript
if (eventDefinition.injectedObjects?.includes('app_runtime_info')) {
    completeEventData.app_runtime_info = {
        consoleId: runtimeInfo.consoleId,
        projectName: runtimeInfo.projectName,
        workspace: runtimeInfo.workspace,
        app_name: runtimeInfo.appName,
        action_package_name: runtimeInfo.actionPackageName
    };
}
```

### 4. Injects agency_identification (if specified in event definition)
```typescript
if (eventDefinition.injectedObjects?.includes('agency_identification')) {
    completeEventData.agency_identification = {
        agencyId: agencyId,
        orgId: orgId
    };
}
```

### 5. Creates CloudEvent
```typescript
const event = new A2bEvent();
event.type = eventCode;
event.data = completeEventData;
event.setSourceUri(runtimeInfo);
```

### 6. Decides whether to send to brand
```typescript
const shouldSendToBrand = brand && 
    (brand.enabled || eventCode === 'com.adobe.a2b.registration.disabled') &&
    eventDefinition.sendSecretHeader;
```

Special cases:
- `registration.disabled` events are sent even to disabled brands
- Only sends if event definition has `sendSecretHeader: true`

### 7. Decides whether to publish to IO Events
```typescript
// Currently always publishes to IO Events
// Future: Can evaluate routingRules for conditional publishing
await eventManager.publishEvent(event);
```

## Benefits

### 1. **Simpler Code**
No need to manually construct event objects or worry about injected fields.

```typescript
// Before
const appRtInfo = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(params);
const agencyId = AgencyIdentification.getAgencyIdentificationFromActionParams(params);
const event = new AssetSyncNewEvent(...many params...);
event.setSourceUri(appRtInfo);
event.setAgencyIdentification(agencyId);
const eventManager = new EventManager(params, eventDefinition);
await eventManager.publishEvent(event);

// After
const eventManager = new EventManager(params);
await eventManager.processEvent('com.adobe.a2b.assetsync.new', brand, eventData);
```

### 2. **Automatic Validation**
Field validation happens automatically based on event registry.

### 3. **Consistent Injection**
`app_runtime_info` and `agency_identification` are injected consistently across all events.

### 4. **Intelligent Routing**
EventManager determines whether to send to brand and/or publish to IO Events.

### 5. **Type Safety**
Event codes are validated against the registry at runtime.

### 6. **Error Handling**
Clear error messages for missing fields or invalid event codes.

## Migration Guide

### Updating Existing Actions

1. **Find EventManager construction**
```typescript
// OLD
const eventDefinition = getEventDefinition('com.adobe.a2b.assetsync.new');
const eventManager = new EventManager(params, eventDefinition);
```

2. **Simplify to new pattern**
```typescript
// NEW
const eventManager = new EventManager(params);
```

3. **Replace manual event construction**
```typescript
// OLD
const appRtInfo = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(params);
const event = new AssetSyncNewEvent(appRtInfo, assetId, assetPath, metadata, presignedUrl, brandId, providerId);
const brand = await brandManager.getBrand(brandId);
await brand.sendCloudEventToEndpoint(event);
await eventManager.publishEvent(event);

// NEW
const brand = await brandManager.getBrand(brandId);
const eventData = {
    asset_id: assetId,
    asset_path: assetPath,
    metadata: metadata,
    brandId: brandId,
    asset_presigned_url: presignedUrl
};
await eventManager.publishEventWithData('com.adobe.a2b.assetsync.new', brand, eventData);
```

## Legacy Support

The old `publishEvent()` method is still available for backwards compatibility:

```typescript
// Still works, but marked as @deprecated
await eventManager.publishEvent(event);
```

However, you should migrate to the new `publishEventWithData()` method.

## Event Registry Requirements

For events to work with the new system, they must be properly registered in `AppEventRegistry`:

```typescript
{
    code: 'com.adobe.a2b.assetsync.new',
    category: EventCategory.AGENCY,
    name: 'Asset Sync New',
    description: 'Emitted when a new asset is synced from AEM',
    version: '1.0.0',
    sendSecretHeader: true,
    sendSignedKey: true,
    eventBodyexample: assetsyncNewBody,
    routingRules: [],
    requiredFields: ['asset_id', 'asset_path', 'metadata', 'brandId', 'asset_presigned_url'],
    optionalFields: [],
    injectedObjects: ['app_runtime_info', 'agency_identification']
}
```

Key fields:
- **requiredFields**: Fields that must be present in eventData
- **injectedObjects**: Objects that EventManager will automatically inject
- **sendSecretHeader**: Whether to send to brand endpoint
- **routingRules**: Future use for conditional routing

## Testing

### Unit Test Example

```typescript
import { EventManager } from '../classes/EventManager';
import { Brand } from '../classes/Brand';

describe('EventManager.publishEventWithData', () => {
    it('should publish event with correct data', async () => {
        const params = {
            LOG_LEVEL: 'debug',
            S2S_CLIENT_ID: 'test-client-id',
            S2S_CLIENT_SECRET: 'test-secret',
            // ... other params
        };
        
        const eventManager = new EventManager(params);
        const brand = new Brand({
            brandId: 'test-brand',
            name: 'Test Brand',
            endPointUrl: 'https://test.example.com',
            secret: 'test-secret',
            enabled: true
        });
        
        const eventData = {
            asset_id: 'asset-123',
            asset_path: '/path/to/asset',
            metadata: {},
            brandId: 'test-brand',
            asset_presigned_url: 'https://presigned.url'
        };
        
        const result = await eventManager.publishEventWithData(
            'com.adobe.a2b.assetsync.new',
            brand,
            eventData
        );
        
        expect(result.ioEventPublished).toBe(true);
        expect(result.brandSendResult).toBeDefined();
    });
    
    it('should throw error for missing required fields', async () => {
        const eventManager = new EventManager(params);
        const brand = new Brand({ /* ... */ });
        
        const eventData = {
            asset_id: 'asset-123'
            // Missing other required fields
        };
        
        await expect(
            eventManager.publishEventWithData('com.adobe.a2b.assetsync.new', brand, eventData)
        ).rejects.toThrow('Missing required fields');
    });
});
```

## Future Enhancements

### 1. Routing Rules Evaluation
Currently, events are always published to IO Events. Future versions can evaluate `routingRules` to conditionally publish:

```typescript
if (this.shouldPublishToIO(eventDefinition, eventData)) {
    await eventManager.publishEvent(event);
}
```

### 2. Retry Logic
Add configurable retry logic for failed brand sends:

```typescript
const result = await eventManager.publishEventWithData(
    eventCode,
    brand,
    eventData,
    { retries: 3, retryDelay: 1000 }
);
```

### 3. Event Batching
Support for batching multiple events:

```typescript
await eventManager.publishEventsBatch([
    { eventCode: '...', brand, eventData },
    { eventCode: '...', brand, eventData }
]);
```

## Related Documentation

- `docs/cursor/APP_EVENT_REGISTRY_DOCUMENTATION.md` - Event registry system
- `docs/cursor/EVENT_REGISTRIES_IMPLEMENTATION.md` - Event registry architecture
- `docs/events/` - Event body examples

