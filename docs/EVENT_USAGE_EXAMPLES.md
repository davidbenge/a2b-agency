# Event Usage Examples with Adobe Developer Console Integration

## Overview
This document provides examples of how to use the enhanced event data structure with Adobe Developer Console integration.

## Example 1: Creating Events with Adobe Developer Console Context

```typescript
// Example Adobe Developer Console JSON data
const adobeConsoleJson = {
    "project": {
        "id": "4566206088345469660",
        "name": "345MaroonGalliform",
        "title": "Project 25",
        "description": "",
        "org": {
            "id": "1969733",
            "name": "Fusion Product Team",
            "ims_org_id": "9FBD1E54661EE6A90A495E3B@AdobeOrg"
        },
        "workspace": {
            "id": "4566206088345495071",
            "name": "Production",
            "title": "ProjectWorkspace",
            "description": "ProjectWorkspace description",
            "action_url": "https://1969733-345maroongalliform.adobeioruntime.net",
            "app_url": "https://1969733-345maroongalliform.adobeio-static.net",
            "details": {
                "credentials": [],
                "services": [],
                "runtime": {"namespaces": []},
                "events": {"registrations": []},
                "mesh": {}
            },
            "endpoints": {}
        }
    }
};

// Create Asset Synchronization Event with Adobe Developer Console context
const assetEvent = new AssetSynchNewEvent(
    { 
        assetId: "asset_123", 
        assetName: "brand_logo.png",
        assetPath: "/content/dam/brand/assets/logo.png"
    },
    adobeConsoleJson.project
);

// Create Brand Registration Event with Adobe Developer Console context
const brandEvent = new NewBrandRegistrationEvent(
    {
        bid: "fusion_team_brand",
        secret: "fusion_team_secret",
        name: "Fusion Product Team Brand",
        endPointUrl: "https://1969733-345maroongalliform.adobeioruntime.net",
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        enabledAt: new Date()
    },
    adobeConsoleJson.project
);

// Create Workfront Task Event with Adobe Developer Console context
const workfrontEvent = new WorkfrontTaskCreatedEvent(
    {
        taskId: "task_456",
        taskName: "Review Brand Assets",
        taskStatus: "in_progress",
        assignee: "john.doe@fusionteam.com"
    },
    adobeConsoleJson.project
);
```

## Example 2: Accessing Adobe Developer Console Data from Events

```typescript
// Access Adobe Developer Console data using helper methods
console.log('Project ID:', assetEvent.getAdobeProjectId());
// Output: "4566206088345469660"

console.log('Workspace ID:', assetEvent.getAdobeWorkspaceId());
// Output: "4566206088345495071"

console.log('Runtime URL:', assetEvent.getAdobeRuntimeUrl());
// Output: "https://1969733-345maroongalliform.adobeioruntime.net"

console.log('IMS Org ID:', assetEvent.getAdobeImsOrgId());
// Output: "9FBD1E54661EE6A90A495E3B@AdobeOrg"

console.log('Organization Name:', assetEvent.getAdobeOrgName());
// Output: "Fusion Product Team"
```

## Example 3: Event Handler Integration

```typescript
export class ExampleEventHandler extends IoEventHandler {
    async handleEvent(event: any): Promise<any> {
        this.logger.info("Example Event Handler called", event);
        
        // Extract Adobe Developer Console data from event
        let adobeProject: IAdobeProject | undefined;
        if (event.adobeProject) {
            adobeProject = event.adobeProject;
        }
        
        // Use utility functions to extract data
        const runtimeUrl = getAdobeRuntimeUrlFromEvent(event);
        const projectId = getAdobeProjectIdFromEvent(event);
        const workspaceId = getAdobeWorkspaceIdFromEvent(event);
        
        if (runtimeUrl && projectId && workspaceId) {
            // Make API call using Adobe Developer Console context
            const apiEndpoint = `${runtimeUrl}/api/v1/web/${projectId}/${workspaceId}/custom-action`;
            this.logger.info(`Making API call to: ${apiEndpoint}`);
        }
        
        // Publish custom event with Adobe Developer Console context
        const ioCustomEventManager = new IoCustomEventManager(
            event.PROVIDER_ID,
            event.LOG_LEVEL,
            event
        );
        
        await ioCustomEventManager.publishEvent(
            new AssetSynchNewEvent(event.data, adobeProject)
        );
        
        return { statusCode: 200, body: { message: 'Event processed successfully' } };
    }
}
```

## Example 4: Using Utility Functions

```typescript
import { 
    createEventDataWithAdobeConsole,
    extractAdobeProjectFromEvent,
    hasAdobeConsoleContext,
    getAdobeRuntimeUrlFromEvent
} from '../utils/adobeConsoleUtils';

// Create event data with Adobe Developer Console context
const eventData = createEventDataWithAdobeConsole(
    { assetId: "asset_123", assetName: "brand_logo.png" },
    adobeConsoleJson
);

// Check if event has Adobe Developer Console context
if (hasAdobeConsoleContext(event)) {
    console.log('Event has Adobe Developer Console context');
}

// Extract Adobe Developer Console project from event
const project = extractAdobeProjectFromEvent(event);
if (project) {
    console.log('Project ID:', project.id);
    console.log('Organization:', project.org.name);
}

// Get runtime URL from event
const runtimeUrl = getAdobeRuntimeUrlFromEvent(event);
if (runtimeUrl) {
    console.log('Runtime URL:', runtimeUrl);
}
```

## Example 5: Backward Compatibility

```typescript
// Events without Adobe Developer Console data still work
const legacyEvent = new AssetSynchNewEvent({
    assetId: "asset_123",
    assetName: "brand_logo.png"
});
// No Adobe Developer Console context - still valid

// Events with Adobe Developer Console data work
const enhancedEvent = new AssetSynchNewEvent({
    assetId: "asset_123",
    assetName: "brand_logo.png"
}, adobeConsoleJson.project);
// Includes Adobe Developer Console context

// Both events can be processed by the same handler
const handler = new AemAssetSynchHandler();
await handler.handleEvent(legacyEvent);  // Works
await handler.handleEvent(enhancedEvent); // Works with enhanced context
```

## Example 6: Event Data Structure

```typescript
// Example of complete event data structure
const completeEventData: IEventData = {
    // Brand information
    bid: "fusion_team_brand",
    secret: "fusion_team_secret",
    name: "Fusion Product Team Brand",
    endPointUrl: "https://1969733-345maroongalliform.adobeioruntime.net",
    enabled: true,
    logo: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-20"),
    enabledAt: new Date("2024-01-15"),
    
    // Adobe Developer Console context
    adobeProject: adobeConsoleJson.project,
    imsId: "9FBD1E54661EE6A90A495E3B@AdobeOrg",
    imsOrgName: "Fusion Product Team",
    primaryWorkspaceId: "4566206088345495071",
    
    // Event metadata
    eventType: "asset_synch_new",
    eventTimestamp: new Date(),
    eventSource: "aem_asset_handler",
    
    // Additional event payload
    assetId: "asset_123",
    assetName: "brand_logo.png",
    assetPath: "/content/dam/brand/assets/logo.png"
};
```

## Testing

### Test Event Creation
```typescript
// Test creating events with Adobe Developer Console context
const testEvent = new AssetSynchNewEvent(
    { assetId: "test_asset" },
    adobeConsoleJson.project
);

// Verify Adobe Developer Console data is included
console.assert(testEvent.getAdobeProjectId() === "4566206088345469660");
console.assert(testEvent.getAdobeRuntimeUrl() === "https://1969733-345maroongalliform.adobeioruntime.net");
console.assert(testEvent.getAdobeImsOrgId() === "9FBD1E54661EE6A90A495E3B@AdobeOrg");
```

### Test Backward Compatibility
```typescript
// Test creating events without Adobe Developer Console context
const legacyEvent = new AssetSynchNewEvent({ assetId: "test_asset" });

// Verify it still works
console.assert(legacyEvent.getAdobeProjectId() === undefined);
console.assert(legacyEvent.validate() === true);
``` 