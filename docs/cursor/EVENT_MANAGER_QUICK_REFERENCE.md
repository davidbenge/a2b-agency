# EventManager Quick Reference

## 🚀 Quick Start

### Initialize EventManager

```typescript
import { EventManager } from '../classes/EventManager';

const eventManager = new EventManager(params);
```

### Publish an Event

```typescript
const result = await eventManager.processEvent(
    'com.adobe.a2b.assetsync.new',  // Event code from registry
    brand,                           // Brand object or null
    {                                // Event data
        asset_id: 'asset-123',
        asset_path: '/path/to/asset',
        metadata: {},
        brandId: 'brand-456',
        asset_presigned_url: 'https://...'
    }
);

console.log('Brand sent:', result.brandSendResult);
console.log('IO published:', result.ioEventPublished);
```

## 📋 Event Codes

### Registration Events
- `com.adobe.a2b.registration.received`
- `com.adobe.a2b.registration.enabled`
- `com.adobe.a2b.registration.disabled`

### Asset Sync Events
- `com.adobe.a2b.assetsync.new`
- `com.adobe.a2b.assetsync.update`
- `com.adobe.a2b.assetsync.delete`

### Workfront Events
- `com.adobe.a2b.workfront.task.created`
- `com.adobe.a2b.workfront.task.updated`
- `com.adobe.a2b.workfront.task.completed`

## 🔧 Common Patterns

### Pattern 1: Asset Sync Event

```typescript
const eventManager = new EventManager(params);
const brandManager = new BrandManager(params.LOG_LEVEL);
const brand = await brandManager.getBrand(brandId);

const result = await eventManager.processEvent(
    'com.adobe.a2b.assetsync.new',
    brand,
    {
        asset_id: assetId,
        asset_path: assetPath,
        metadata: metadata,
        brandId: brandId,
        asset_presigned_url: presignedUrl
    }
);
```

### Pattern 2: Registration Event (No Brand)

```typescript
const eventManager = new EventManager(params);

const result = await eventManager.processEvent(
    'com.adobe.a2b.registration.received',
    null,  // No brand yet
    {
        name: brandName,
        endPointUrl: endpointUrl
    }
);
```

### Pattern 3: Update Existing Brand

```typescript
const eventManager = new EventManager(params);
const brand = await brandManager.getBrand(brandId);

const result = await eventManager.processEvent(
    'com.adobe.a2b.assetsync.update',
    brand,
    {
        asset_id: assetId,
        brandId: brandId,
        metadata: updatedMetadata
    }
);
```

### Pattern 4: Disable Brand

```typescript
const eventManager = new EventManager(params);
const brand = await brandManager.getBrand(brandId);

// This event is sent even to disabled brands
const result = await eventManager.processEvent(
    'com.adobe.a2b.registration.disabled',
    brand,
    {
        brandId: brandId,
        enabled: false,
        endPointUrl: brand.endPointUrl
    }
);
```

## 🎯 What Gets Injected Automatically

The following are automatically injected by EventManager based on the event definition:

### app_runtime_info
```typescript
{
    consoleId: string,
    projectName: string,
    workspace: string,
    app_name: string,
    action_package_name: string
}
```

### agency_identification
```typescript
{
    agencyId: string,
    orgId: string
}
```

**You don't need to add these manually - EventManager handles it!**

## ✅ Required Fields by Event Type

### Registration Events

**registration.received:**
- `name`
- `endPointUrl`

**registration.enabled:**
- `brandId`
- `secret`
- `enabled`

**registration.disabled:**
- `brandId`
- `enabled`
- `endPointUrl`

### Asset Sync Events

**assetsync.new:**
- `asset_id`
- `asset_path`
- `metadata`
- `brandId`
- `asset_presigned_url`

**assetsync.update:**
- `asset_id`
- `brandId`

**assetsync.delete:**
- `asset_id`
- `brandId`

### Workfront Events

**workfront.task.created:**
- `taskId`

**workfront.task.updated:**
- `taskId`

**workfront.task.completed:**
- `taskId`

## ⚠️ Common Errors

### Error: Event code not found in registry
```typescript
throw new Error(`EventManager:processEvent: Event code 'com.adobe.a2b.invalid' not found in registry`);
```
**Solution:** Use a valid event code from the registry

### Error: Missing required fields
```typescript
throw new Error(`EventManager:processEvent: Missing required fields for 'com.adobe.a2b.assetsync.new': asset_id, asset_path`);
```
**Solution:** Include all required fields in eventData

### Error: Missing APPLICATION_RUNTIME_INFO
```typescript
throw new Error('Missing APPLICATION_RUNTIME_INFO');
```
**Solution:** Ensure `APPLICATION_RUNTIME_INFO` is in your .env and mapped in app.config.yaml

## 🔍 Return Value

The `processEvent()` method returns:

```typescript
{
    brandSendResult?: IBrandEventPostResponse,  // Response from brand (if sent)
    ioEventPublished: boolean                   // Whether published to IO Events
}
```

### Example Usage:
```typescript
const result = await eventManager.processEvent(eventCode, brand, eventData);

if (result.ioEventPublished) {
    console.log('Successfully published to IO Events');
}

if (result.brandSendResult) {
    console.log('Brand response:', result.brandSendResult);
}
```

## 🧪 Testing

### Unit Test Example

```typescript
import { EventManager } from '../classes/EventManager';
import { Brand } from '../classes/Brand';

describe('EventManager', () => {
    it('should publish event with correct data', async () => {
        const params = {
            LOG_LEVEL: 'debug',
            S2S_CLIENT_ID: 'test-client',
            S2S_CLIENT_SECRET: 'test-secret',
            // ... other required params
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
            asset_path: '/test/path',
            metadata: {},
            brandId: 'test-brand',
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

## 📚 Related Documentation

- **Detailed Guide:** `docs/cursor/EVENT_MANAGER_REFACTORING.md`
- **Migration Examples:** `docs/cursor/EVENT_MANAGER_MIGRATION_EXAMPLE.md`
- **Summary:** `docs/cursor/EVENT_MANAGER_REFACTORING_SUMMARY.md`
- **Event Registry:** `docs/cursor/APP_EVENT_REGISTRY_DOCUMENTATION.md`
- **Event Examples:** `docs/events/`

## 💡 Tips

### Tip 1: Use TypeScript for Better Autocomplete
```typescript
import { AppEventDefinition } from '../../shared/types';
import { getEventDefinition } from '../../shared/classes/AppEventRegistry';

const eventDef = getEventDefinition('com.adobe.a2b.assetsync.new');
// Now you have type information and required fields!
```

### Tip 2: Check Event Definition for Required Fields
```typescript
const eventDef = getEventDefinition('com.adobe.a2b.assetsync.new');
console.log('Required fields:', eventDef?.requiredFields);
// ['asset_id', 'asset_path', 'metadata', 'brandId', 'asset_presigned_url']
```

### Tip 3: Handle Errors Gracefully
```typescript
try {
    const result = await eventManager.processEvent(eventCode, brand, eventData);
    logger.info('Event published successfully');
} catch (error) {
    logger.error('Failed to publish event:', error);
    // Continue with other operations
}
```

### Tip 4: Don't Fail on Brand Send Errors
```typescript
// EventManager automatically continues to IO Events even if brand send fails
const result = await eventManager.processEvent(eventCode, brand, eventData);

if (result.brandSendResult) {
    logger.info('Brand acknowledged event');
} else {
    logger.warn('Brand did not acknowledge event (might be disabled or unreachable)');
}

// IO Events publish is separate
if (result.ioEventPublished) {
    logger.info('Event recorded in IO Events');
}
```

## 🚨 Do's and Don'ts

### ✅ DO
- Use `processEvent()` for new code
- Include all required fields
- Handle errors gracefully
- Check return value
- Use event codes from registry

### ❌ DON'T
- Don't manually create event classes
- Don't manually inject `app_runtime_info` or `agency_identification`
- Don't manually route to brand or IO Events
- Don't use deprecated `publishEvent()` method for new code
- Don't guess event codes - use registry

## 🔗 Quick Links

- [AppEventRegistry](../../src/shared/classes/AppEventRegistry.ts)
- [EventManager](../../src/actions/classes/EventManager.ts)
- [Brand](../../src/actions/classes/Brand.ts)
- [A2bEvent](../../src/actions/classes/A2bEvent.ts)

---

**Last Updated:** October 18, 2025  
**Version:** 2.0 (Refactored)

