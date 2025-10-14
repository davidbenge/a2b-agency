# Event Types and Rules Management

This document describes the event types supported by the a2b-agency application and how to manage routing rules for event handling.

## Overview

The application uses a centralized event type registry and rules management system to handle different types of events from various sources (AEM, Workfront, Brand systems). This system provides:

- **Centralized Event Type Registry**: All supported event types in one place
- **Factory Pattern**: Dynamic handler creation based on event type
- **Rules Management**: Configurable routing rules for event processing
- **REST API**: Easy access to event types and rules for external systems

## Supported Event Types

### AEM Asset Events

| Event Type | Description | Handler | Required Fields |
|------------|-------------|---------|-----------------|
| `aem.assets.asset.created` | AEM asset created | `agency-assetsync-internal-handler` | `assetId`, `assetPath`, `assetName` |
| `aem.assets.asset.updated` | AEM asset updated | `agency-assetsync-internal-handler` | `assetId`, `assetPath`, `assetName` |
| `aem.assets.asset.deleted` | AEM asset deleted | `agency-assetsync-internal-handler` | `assetId`, `assetPath` |
| `aem.assets.asset.metadata_updated` | AEM asset metadata updated | `agency-assetsync-internal-handler` | `assetId`, `assetPath`, `metadata` |

### Workfront Events

| Event Type | Description | Handler | Required Fields |
|------------|-------------|---------|-----------------|
| `workfront.task.created` | Workfront task created | `workfront-event-handler` | `taskId`, `taskName`, `projectId` |
| `workfront.task.updated` | Workfront task updated | `workfront-event-handler` | `taskId`, `changes` |
| `workfront.task.completed` | Workfront task completed | `workfront-event-handler` | `taskId`, `completionDate` |

### Brand Events

| Event Type | Description | Handler | Required Fields |
|------------|-------------|---------|-----------------|
| `com.adobe.b2a.assetsync.new` | Brand asset sync new | `agency-assetsync-internal-handler` | `brandId`, `assetId`, `assetUrl` |
| `com.adobe.b2a.assetsync.updated` | Brand asset sync updated | `agency-assetsync-internal-handler` | `brandId`, `assetId`, `changes` |
| `com.adobe.b2a.assetsync.deleted` | Brand asset sync deleted | `agency-assetsync-internal-handler` | `brandId`, `assetId` |
| `com.adobe.b2a.brand.registered` | Brand registration | `new-brand-registration` | `brandId`, `brandName`, `endpointUrl` |

## API Endpoints

### Get Event Types

**Endpoint**: `GET /api/v1/web/a2b-agency/get-event-types`

**Query Parameters**:
- `category` (optional): Filter by event category (`aem`, `workfront`, `brand`, `custom`)
- `includeExamples` (optional): Include example data (`true`/`false`)
- `format` (optional): Response format (`json`, `simple`, `rules`)

**Example Requests**:
```bash
# Get all event types
curl "https://your-runtime.adobeioruntime.net/api/v1/web/a2b-agency/get-event-types"

# Get AEM events only
curl "https://your-runtime.adobeioruntime.net/api/v1/web/a2b-agency/get-event-types?category=aem"

# Get rules-optimized format
curl "https://your-runtime.adobeioruntime.net/api/v1/web/a2b-agency/get-event-types?format=rules"
```

**Example Response**:
```json
{
  "message": "Event types retrieved successfully",
  "data": {
    "eventTypes": [
      {
        "type": "aem.assets.asset.created",
        "category": "aem",
        "description": "AEM asset created event",
        "handler": "agency-assetsync-internal-handler",
        "requiredFields": ["assetId", "assetPath", "assetName"],
        "optionalFields": ["metadata", "renditions"],
        "routingRules": ["asset-sync-new"]
      }
    ],
    "categories": ["aem", "workfront", "brand"],
    "totalCount": 10
  }
}
```

### Manage Rules

**Endpoint**: `GET|POST|PUT|DELETE /api/v1/web/a2b-agency/manage-rules`

#### Get Rules

**GET** `/api/v1/web/a2b-agency/manage-rules`

**Query Parameters**:
- `eventType` (optional): Get rules for specific event type
- `includeEventTypes` (optional): Include event type metadata

#### Create Rule

**POST** `/api/v1/web/a2b-agency/manage-rules`

**Request Body**:
```json
{
  "id": "rule-123",
  "name": "Route AEM assets to brand sync",
  "description": "Route AEM asset events to brand synchronization",
  "eventType": "aem.assets.asset.created",
  "conditions": [
    {
      "field": "metadata.a2b__sync_on_change",
      "operator": "equals",
      "value": "true"
    }
  ],
  "actions": [
    {
      "type": "route",
      "target": "agency-assetsync-internal-handler"
    }
  ],
  "enabled": true,
  "priority": 10
}
```

## Rules Configuration

### Rule Conditions

Rules support various condition operators:

- `equals`: Exact match
- `contains`: String contains value
- `startsWith`: String starts with value
- `endsWith`: String ends with value
- `regex`: Regular expression match
- `exists`: Field exists
- `notExists`: Field does not exist

### Rule Actions

- `route`: Route to specific handler
- `transform`: Transform event data
- `filter`: Filter event data
- `log`: Log event information

### Rule Priority

Rules are evaluated in priority order (higher numbers first). Rules with priority >= 100 will stop evaluation after matching.

## Usage Examples

### 1. Get All Event Types for Rules Manager

```javascript
const response = await fetch('/api/v1/web/a2b-agency/get-event-types?format=rules');
const data = await response.json();

// Use in your rules manager UI
data.data.eventTypes.forEach(eventType => {
  console.log(`Event: ${eventType.type}`);
  console.log(`Handler: ${eventType.handler}`);
  console.log(`Required fields: ${eventType.requiredFields.join(', ')}`);
});
```

### 2. Create a Conditional Rule

```javascript
const rule = {
  id: 'conditional-aem-sync',
  name: 'Conditional AEM Asset Sync',
  description: 'Only sync AEM assets with specific metadata',
  eventType: 'aem.assets.asset.created',
  conditions: [
    {
      field: 'metadata.a2b__sync_on_change',
      operator: 'equals',
      value: 'true'
    },
    {
      field: 'metadata.a2d__customers',
      operator: 'exists',
      logicalOperator: 'AND'
    }
  ],
  actions: [
    {
      type: 'route',
      target: 'agency-assetsync-internal-handler'
    }
  ],
  enabled: true,
  priority: 50
};

await fetch('/api/v1/web/a2b-agency/manage-rules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(rule)
});
```

### 3. Get Rules for Specific Event Type

```javascript
const response = await fetch('/api/v1/web/a2b-agency/manage-rules?eventType=aem.assets.asset.created');
const data = await response.json();

console.log(`Found ${data.data.count} rules for AEM asset creation`);
data.data.rules.forEach(rule => {
  console.log(`Rule: ${rule.name} (Priority: ${rule.priority})`);
});
```

## Integration with Rules Manager

This system is designed to integrate with external rules management systems:

1. **Event Type Discovery**: Use the `get-event-types` endpoint to discover all supported event types
2. **Rule Configuration**: Use the `manage-rules` endpoint to create and manage routing rules
3. **Dynamic Routing**: Rules are evaluated at runtime to determine event routing
4. **Extensibility**: New event types can be easily added to the registry

## Best Practices

1. **Use Descriptive Rule Names**: Make rule names clear and descriptive
2. **Set Appropriate Priorities**: Use higher priorities for critical rules
3. **Test Rules**: Always test rules with sample event data
4. **Monitor Performance**: Keep rule conditions simple for better performance
5. **Document Rules**: Include clear descriptions for complex rules

## Extending the System

To add new event types:

1. Add the event type to `EventTypeRegistry.ts`
2. Create the appropriate handler if needed
3. Update the app configuration
4. Add documentation

The factory pattern makes it easy to add new event types without modifying existing code.
