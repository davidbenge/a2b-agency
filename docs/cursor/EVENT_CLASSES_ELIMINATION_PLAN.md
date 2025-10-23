# Event Classes Elimination Plan

## Current State

We have 10 specific event classes that are now **redundant** with the new `processEvent()` method:

### a2b_events/
- AssetSyncDeleteEvent.ts
- AssetSyncNewEvent.ts
- AssetSyncUpdateEvent.ts
- NewBrandRegistrationEvent.ts
- RegistrationDisabledEvent.ts
- RegistrationEnabledEvent.ts
- WorkfrontTaskCompletedEvent.ts
- WorkfrontTaskCreatedEvent.ts
- WorkfrontTaskUpdatedEvent.ts

### b2a_events/
- BrandRegistrationRequestEvent.ts

## Why They're Redundant

The new `processEvent()` method already creates events dynamically:

```typescript
// Inside processEvent() - we create a generic event on the fly
const event = new (class extends A2bEvent {
    constructor() {
        super();
        this.type = eventCode;
        this.data = completeEventData;
    }
    
    validate() {
        const missing: string[] = [];
        eventDefinition.requiredFields.forEach(field => {
            if (!(field in this.data)) {
                missing.push(field);
            }
        });
        return {
            valid: missing.length === 0,
            message: missing.length > 0 ? `Missing required fields: ${missing.join(', ')}` : undefined,
            missing: missing.length > 0 ? missing : undefined
        };
    }
})();
```

## Proposed Architecture

### Keep Only Base Classes

**Keep:**
- `A2bEvent` (abstract base class) - For agency-to-brand events
- `B2aEvent` (abstract base class) - For brand-to-agency events
- Shared interface: `Ia2bEvent`

**Remove:**
- All 10 specific event classes

### Event Structure Comes From Registry

All event metadata (type, required fields, injection rules) comes from:
- `AppEventRegistry` - For app events (a2b)
- `ProductEventRegistry` - For product events (from Adobe products)

## Migration Steps

### Step 1: Update Remaining Actions to Use `processEvent()`

Replace:
```typescript
// OLD
import { AssetSyncNewEvent } from '../classes/a2b_events/AssetSyncNewEvent';

const event = new AssetSyncNewEvent(appRtInfo, assetId, assetPath, ...);
await eventManager.publishEvent(event);
```

With:
```typescript
// NEW
const eventData = {
    asset_id: assetId,
    asset_path: assetPath,
    metadata: metadata,
    brandId: brandId,
    asset_presigned_url: presignedUrl
};

await eventManager.processEvent('com.adobe.a2b.assetsync.new', brand, eventData);
```

### Step 2: Update Event Registry Completeness

Ensure all events are fully defined in the registry with:
- `code` - Event type code
- `category` - Event category
- `requiredFields` - Fields that must be present
- `optionalFields` - Fields that are optional
- `injectedObjects` - What gets automatically injected
- `routingRules` - How to route the event
- `sendSecretHeader` - Whether to send to brand
- `sendSignedKey` - Whether to sign the event

### Step 3: Remove Specific Event Classes

After migrating all usages, delete:
- `src/actions/classes/a2b_events/` (entire directory)
- `src/actions/classes/b2a_events/` (entire directory)

### Step 4: Optionally Add Generic Event Factory

If we want a cleaner API than the inline anonymous class, we can add:

```typescript
// src/actions/classes/GenericA2bEvent.ts
import { A2bEvent } from './A2bEvent';
import { AppEventDefinition } from '../../shared/types';

export class GenericA2bEvent extends A2bEvent {
    private eventDefinition: AppEventDefinition;

    constructor(eventCode: string, eventData: any, eventDefinition: AppEventDefinition) {
        super();
        this.type = eventCode;
        this.data = eventData;
        this.eventDefinition = eventDefinition;
    }

    validate() {
        const missing: string[] = [];
        this.eventDefinition.requiredFields.forEach(field => {
            if (!(field in this.data)) {
                missing.push(field);
            }
        });
        return {
            valid: missing.length === 0,
            message: missing.length > 0 ? `Missing required fields: ${missing.join(', ')}` : undefined,
            missing: missing.length > 0 ? missing : undefined
        };
    }
}

// And similar for B2a
export class GenericB2aEvent extends B2aEvent {
    // Same pattern
}
```

Then in `processEvent()`:
```typescript
const event = new GenericA2bEvent(eventCode, completeEventData, eventDefinition);
```

## Benefits

### 1. Less Code to Maintain
**Before:** 10 event classes × ~50 lines = ~500 lines  
**After:** 2 generic classes × ~30 lines = ~60 lines  
**Reduction:** ~88% less code

### 2. Single Source of Truth
Event structure defined in registry, not scattered across classes.

### 3. Easier to Add New Events
```typescript
// Before: Create new class file
class NewEventType extends A2bEvent {
    constructor(...many params...) {
        // validation logic
        // field mapping
        // etc.
    }
}

// After: Just add to registry
{
    code: 'com.adobe.a2b.new.event',
    requiredFields: ['field1', 'field2'],
    // ... done!
}
```

### 4. Consistent Validation
All events validated the same way based on registry definition.

### 5. Better Testing
Test the registry and generic event creation, not 10 different classes.

### 6. Type Safety Through Registry
TypeScript can validate against registry definitions.

## Migration Checklist

- [ ] Update `agency-assetsync-internal-handler-metadata-updated/index.ts`
- [ ] Update `agency-assetsync-internal-handler-process-complete/index.ts`
- [ ] Update `new-brand-registration/index.ts`
- [ ] Update `delete-brand/index.ts`
- [ ] Update `update-brand/index.ts`
- [ ] Update `classes/event_handlers/WorkfrontEventHandler.ts`
- [ ] Test all actions
- [ ] Delete `src/actions/classes/a2b_events/` directory
- [ ] Delete `src/actions/classes/b2a_events/` directory
- [ ] Update tests to use new pattern
- [ ] Update documentation

## Files to Update

### 1. agency-assetsync-internal-handler-metadata-updated/index.ts
```typescript
// Remove
import { AssetSyncUpdateEvent } from '../classes/a2b_events/AssetSyncUpdateEvent';
import { AssetSyncNewEvent } from '../classes/a2b_events/AssetSyncNewEvent';

// Replace usages with processEvent()
```

### 2. agency-assetsync-internal-handler-process-complete/index.ts
```typescript
// Remove
import { AssetSyncUpdateEvent } from '../classes/a2b_events/AssetSyncUpdateEvent';
import { AssetSyncNewEvent } from '../classes/a2b_events/AssetSyncNewEvent';

// Replace usages with processEvent()
```

### 3. new-brand-registration/index.ts
```typescript
// Remove
import { NewBrandRegistrationEvent } from "../classes/a2b_events/NewBrandRegistrationEvent";

// Replace with processEvent()
await eventManager.processEvent(
    'com.adobe.a2b.registration.received',
    null, // No brand yet
    {
        name: savedBrand.name,
        endPointUrl: savedBrand.endPointUrl,
        // ... other fields
    }
);
```

### 4. delete-brand/index.ts
```typescript
// Remove
import { RegistrationDisabledEvent } from "../classes/a2b_events/RegistrationDisabledEvent";

// Replace with processEvent()
await eventManager.processEvent(
    'com.adobe.a2b.registration.disabled',
    brand,
    {
        brandId: brand.brandId,
        enabled: false,
        endPointUrl: brand.endPointUrl
    }
);
```

### 5. update-brand/index.ts
```typescript
// Remove
import { RegistrationEnabledEvent } from "../classes/a2b_events/RegistrationEnabledEvent";
import { RegistrationDisabledEvent } from "../classes/a2b_events/RegistrationDisabledEvent";

// Replace with processEvent() calls
```

### 6. classes/event_handlers/WorkfrontEventHandler.ts
```typescript
// Remove
import { WorkfrontTaskCreatedEvent } from "../a2b_events/WorkfrontTaskCreatedEvent";
import { WorkfrontTaskUpdatedEvent } from "../a2b_events/WorkfrontTaskUpdatedEvent";
import { WorkfrontTaskCompletedEvent } from "../a2b_events/WorkfrontTaskCompletedEvent";

// Replace with processEvent() calls
```

## Shared Interface

The shared interface `Ia2bEvent` already exists and defines the contract:

```typescript
export interface Ia2bEvent {
    source: string;
    type: string;
    datacontenttype: string;
    data: any;
    id: string;
    
    validate(): IValidationResult;
    toJSON(): any;
    setSource(sourceInput: string): void;
    setSourceUri(applicationRuntimeInfo: IApplicationRuntimeInfo): void;
    setAgencyIdentification(agencyIdentification: IAgencyIdentification): void;
    toCloudEvent(): CloudEvent;
}
```

Both `A2bEvent` and `B2aEvent` implement this interface.

## Example: Before vs After

### Before (Specific Class)

**AssetSyncNewEvent.ts:**
```typescript
export class AssetSyncNewEvent extends A2bEvent {
    constructor(
        applicationRuntimeInfo: IApplicationRuntimeInfo,
        assetId: string,
        assetPath: string,
        metadata: any,
        presignedUrl: string,
        brandId: string,
        sourceProviderId: string
    ) {
        super();
        this.type = 'com.adobe.a2b.assetsync.new';
        this.setSourceUri(applicationRuntimeInfo);
        this.data = {
            app_runtime_info: applicationRuntimeInfo.serialize(),
            asset_id: assetId,
            asset_path: assetPath,
            metadata: metadata,
            brandId: brandId,
            asset_presigned_url: presignedUrl
        };
    }

    validate(): IValidationResult {
        const missing: string[] = [];
        if (!this.data.asset_id) missing.push('asset_id');
        if (!this.data.asset_path) missing.push('asset_path');
        if (!this.data.metadata) missing.push('metadata');
        if (!this.data.brandId) missing.push('brandId');
        if (!this.data.asset_presigned_url) missing.push('asset_presigned_url');
        // ... validation logic
    }
}
```

**Usage:**
```typescript
const event = new AssetSyncNewEvent(
    appRtInfo,
    assetId,
    assetPath,
    metadata,
    presignedUrl,
    brandId,
    sourceProviderId
);
await eventManager.publishEvent(event);
```

### After (Generic + Registry)

**AppEventRegistry.ts:**
```typescript
{
    code: 'com.adobe.a2b.assetsync.new',
    requiredFields: ['asset_id', 'asset_path', 'metadata', 'brandId', 'asset_presigned_url'],
    injectedObjects: ['app_runtime_info', 'agency_identification'],
    // ... other metadata
}
```

**Usage:**
```typescript
const eventData = {
    asset_id: assetId,
    asset_path: assetPath,
    metadata: metadata,
    brandId: brandId,
    asset_presigned_url: presignedUrl
};

await eventManager.processEvent('com.adobe.a2b.assetsync.new', brand, eventData);
```

## Validation Comparison

### Before (In Each Class)
Each event class had its own validation logic:
- AssetSyncNewEvent: validates asset_id, asset_path, etc.
- WorkfrontTaskCreatedEvent: validates taskId
- RegistrationDisabledEvent: validates brandId, enabled, etc.

**Problem:** 10 different validation implementations to maintain

### After (In Registry)
One validation implementation in `processEvent()` that reads from registry:

```typescript
const missingFields = eventDefinition.requiredFields.filter(
    field => !(field in eventData)
);
```

**Benefit:** Single validation logic, defined by data (registry)

## Testing Strategy

### Before
Test each event class:
- Test AssetSyncNewEvent validation
- Test WorkfrontTaskCreatedEvent validation
- Test RegistrationDisabledEvent validation
- ... 10 test suites

### After
Test the generic pattern + registry:
- Test GenericA2bEvent with different registry definitions
- Test processEvent() with different event codes
- Test registry completeness
- ... 3 test suites

## Timeline

**Estimated effort:** 2-3 hours
- 1 hour: Migrate 6 actions to use `processEvent()`
- 30 min: Test migrations
- 30 min: Delete old classes
- 30 min: Update tests and documentation

## Recommendation

**Proceed with elimination:** ✅

The specific event classes served their purpose but are now:
1. Redundant with the registry-based approach
2. Harder to maintain (10 files vs 1 registry)
3. Less flexible (need new class for each event)
4. Inconsistent (each has slightly different patterns)

The registry + generic event pattern is:
1. Simpler (less code)
2. More maintainable (single source of truth)
3. More flexible (add events by editing registry)
4. More consistent (all events handled the same way)

## Next Steps

1. **Review this plan** - Get approval
2. **Migrate actions** - Update 6 files to use `processEvent()`
3. **Test thoroughly** - Ensure all events still work
4. **Delete old classes** - Remove a2b_events/ and b2a_events/
5. **Update tests** - Reflect new pattern
6. **Sync to a2b-brand** - Apply same changes

