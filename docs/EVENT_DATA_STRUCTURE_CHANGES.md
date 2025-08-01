# Event Data Structure Changes for Adobe Developer Console Integration

## Overview
This branch contains changes to extend the event data structure to include Adobe Developer Console project and workspace information. This enables better context for event processing and multi-tenant support.

## Changes Summary

### 1. TypeScript Interface Updates
- **File**: `src/actions/types/index.ts`
- **Changes**: 
  - Add `IAdobeOrg`, `IAdobeWorkspace`, `IAdobeProject` interfaces
  - Extend `IEventData` interface with Adobe Developer Console fields
  - Update `IIoEvent` interface to use typed `IEventData`

### 2. Base Event Class Updates
- **File**: `src/actions/classes/IoEvent.ts`
- **Changes**:
  - Update `data` property to use `IEventData` type
  - Add helper methods for Adobe Developer Console data access
  - Maintain backward compatibility

### 3. Event Class Updates
- **Files**: 
  - `src/actions/classes/io_events/AssetSynchNewEvent.ts`
  - `src/actions/classes/io_events/NewBrandRegistrationEvent.ts`
  - `src/actions/classes/io_events/WorkfrontTaskCreatedEvent.ts`
- **Changes**:
  - Add optional `adobeProject` parameter to constructors
  - Include Adobe Developer Console context in event data
  - Add event metadata (type, timestamp, source)

### 4. Event Handler Updates
- **File**: `src/actions/classes/event_handlers/AemAssetSynchHandler.ts`
- **Changes**:
  - Extract Adobe Developer Console data from incoming events
  - Pass Adobe Developer Console context to custom events

### 5. Utility Functions
- **File**: `src/actions/utils/adobeConsoleUtils.ts` (NEW)
- **Changes**:
  - Helper functions for creating event data with Adobe Developer Console context
  - Utility for extracting Adobe Developer Console data from events

## Data Structure

### Adobe Developer Console Interfaces
```typescript
interface IAdobeOrg {
    id: string;
    name: string;
    ims_org_id: string;
}

interface IAdobeWorkspace {
    id: string;
    name: string;
    title: string;
    description: string;
    action_url: string;
    app_url: string;
    details: {
        credentials: any[];
        services: any[];
        runtime: { namespaces: any[] };
        events: { registrations: any[] };
        mesh: any;
    };
    endpoints: any;
}

interface IAdobeProject {
    id: string;
    name: string;
    title: string;
    description: string;
    org: IAdobeOrg;
    workspace: IAdobeWorkspace;
}
```

### Enhanced Event Data Interface
```typescript
interface IEventData {
    // Existing brand fields
    bid: string;
    secret: string;
    name: string;
    endPointUrl: string;
    enabled: boolean;
    logo?: string;
    createdAt: Date;
    updatedAt: Date;
    enabledAt: Date;
    
    // NEW: Adobe Developer Console context
    adobeProject?: IAdobeProject;
    imsId?: string;
    imsOrgName?: string;
    primaryWorkspaceId?: string;
    
    // NEW: Event metadata
    eventType?: string;
    eventTimestamp?: Date;
    eventSource?: string;
    
    // Additional event payload
    [key: string]: any;
}
```

## Usage Examples

### Creating Events with Adobe Developer Console Context
```typescript
// Example Adobe Developer Console JSON
const adobeConsoleJson = {
    "project": {
        "id": "4566206088345469660",
        "name": "345MaroonGalliform",
        "org": {
            "id": "1969733",
            "name": "Fusion Product Team",
            "ims_org_id": "9FBD1E54661EE6A90A495E3B@AdobeOrg"
        },
        "workspace": {
            "id": "4566206088345495071",
            "name": "Production",
            "action_url": "https://1969733-345maroongalliform.adobeioruntime.net"
        }
    }
};

// Create event with Adobe Developer Console context
const assetEvent = new AssetSynchNewEvent(
    { assetId: "asset_123", assetName: "brand_logo.png" },
    adobeConsoleJson.project
);

// Access Adobe Developer Console data
console.log('Project ID:', assetEvent.getAdobeProjectId());
console.log('Runtime URL:', assetEvent.getAdobeRuntimeUrl());
console.log('IMS Org ID:', assetEvent.getAdobeImsOrgId());
```

### Event Handler Integration
```typescript
export class AemAssetSynchHandler extends IoEventHandler {
    async handleEvent(event: any): Promise<any> {
        // Extract Adobe Developer Console data from event
        let adobeProject: IAdobeProject | undefined;
        if (event.adobeProject) {
            adobeProject = event.adobeProject;
        }

        // Publish event with Adobe Developer Console context
        await ioCustomEventManager.publishEvent(
            new AssetSynchNewEvent(event.data, adobeProject)
        );
    }
}
```

## Backward Compatibility

All changes maintain backward compatibility:
- Existing events without Adobe Developer Console data continue to work
- All new fields are optional
- Event handlers can work with or without Adobe Developer Console context
- No breaking changes to existing event publishing

## Testing

### Test Cases
1. **Existing Events**: Verify events without Adobe Developer Console data work
2. **New Events**: Verify events with Adobe Developer Console data work
3. **Mixed Events**: Verify handlers can process both types
4. **Helper Methods**: Test Adobe Developer Console data access methods

### Test Commands
```bash
# Run tests
npm test

# Test specific event classes
npm test -- --grep "AssetSynchNewEvent"
npm test -- --grep "NewBrandRegistrationEvent"
```

## Migration Guide

### For Event Handlers
1. Update imports to use new interfaces
2. Add optional Adobe Developer Console parameter handling
3. Use helper methods for Adobe Developer Console data access

### For Event Publishers
1. Optionally include Adobe Developer Console data in events
2. Use utility functions for creating event data
3. Test with both old and new event formats

## Collaboration Notes

- **Branch**: `feature/event-data-structure-adobe-console`
- **Purpose**: Extend event data structure for Adobe Developer Console integration
- **Impact**: Low risk, backward compatible changes
- **Testing**: Focus on event publishing and handling
- **Review**: Check TypeScript interfaces and event class changes

## Files Changed

1. `src/actions/types/index.ts` - Add Adobe Developer Console interfaces
2. `src/actions/classes/IoEvent.ts` - Add helper methods
3. `src/actions/classes/io_events/*.ts` - Update event constructors
4. `src/actions/classes/event_handlers/AemAssetSynchHandler.ts` - Add Adobe Developer Console support
5. `src/actions/utils/adobeConsoleUtils.ts` - Add utility functions (NEW)

## Next Steps

1. Implement TypeScript interface changes
2. Update base event class
3. Update individual event classes
4. Update event handlers
5. Add utility functions
6. Test changes
7. Create pull request 