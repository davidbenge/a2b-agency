# Rules Manager Documentation

## Overview

The Rules Manager is a comprehensive system for configuring business logic rules that respond to events from AEM and Workfront. It provides a visual rule builder interface for creating conditional workflows and automating asset synchronization.

---

## Table of Contents

1. [Rule Types](#rule-types)
2. [Event Types & API](#event-types--api)
3. [Visual Rule Builder](#visual-rule-builder)
4. [Configuration Guide](#configuration-guide)
5. [API Reference](#api-reference)
6. [Best Practices](#best-practices)

---

## Rule Types

The system supports four primary rule types for managing business logic:

### 1. Asset Event Triggers
**Complexity:** Low | **Implementation Status:** ✅ Phase 1

**Purpose:** Respond to asset lifecycle events to initiate synchronization or notifications.

**Supported Events:**
- `aem.assets.asset.created` - Asset created in AEM
- `aem.assets.asset.updated` - Asset updated in AEM
- `aem.assets.asset.deleted` - Asset deleted in AEM
- `aem.assets.asset.metadata_updated` - Asset metadata changed
- `workfront.task.created` - Task created in Workfront
- `workfront.task.updated` - Task updated in Workfront
- `workfront.task.completed` - Task completed in Workfront

**Common Examples:**
```javascript
IF asset.created in AEM 
THEN create linked document in Workfront

IF asset.updated in AEM 
THEN sync changes to brand systems

IF workfront.task.completed 
THEN mark AEM asset as approved
```

**Implementation:** Processed by `agency-assetsync-internal-handler` action

---

### 2. Metadata Sync
**Complexity:** Medium | **Implementation Status:** 🔄 Phase 2

**Purpose:** Manage metadata transfer and transformation between AEM and Workfront for data consistency.

**Supported Metadata Fields:**
- `a2b__sync_on_change` - Boolean flag triggering asset sync
- `a2d__customers` - Comma-separated brand IDs for routing
- `a2b__last_sync` - Timestamp of last successful sync

**Common Examples:**
```javascript
IF AEM asset.metadata_updated includes 'a2b__sync_on_change=true'
THEN trigger brand sync

IF workfront.task.updated 
THEN push metadata to AEM

IF AEM asset.updated includes 'a2d__customers'
THEN apply brand routing rules
```

---

### 3. Approval Workflows
**Complexity:** Medium | **Implementation Status:** 📋 Phase 3

**Purpose:** Coordinate review and approval processes between AEM and Workfront.

**Common Examples:**
```javascript
IF asset.metadata_updated in AEM 
THEN trigger Workfront task creation

IF workfront.task.completed 
THEN mark AEM asset as approved

IF workfront.task.updated 
THEN sync status to AEM metadata
```

---

### 4. Asset Folder Management
**Complexity:** Medium | **Implementation Status:** 📋 Phase 4

**Purpose:** Manage asset-to-folder relationships and organization between systems using asset path analysis.

**Common Examples:**
```javascript
IF asset.created in AEM folder '/content/dam/campaigns'
THEN create Workfront document in 'Campaign Assets' folder

IF asset.metadata_updated includes 'campaign=summer2024'
THEN move to Workfront 'Summer Campaign' folder
```

---

## Event Types & API

### Supported Event Categories

| Category | Event Type | Description | Handler | Required Fields |
|----------|-----------|-------------|---------|-----------------|
| **AEM** | `aem.assets.asset.created` | Asset created | `agency-assetsync-internal-handler` | `assetId`, `assetPath`, `assetName` |
| **AEM** | `aem.assets.asset.updated` | Asset updated | `agency-assetsync-internal-handler` | `assetId`, `assetPath`, `assetName` |
| **AEM** | `aem.assets.asset.deleted` | Asset deleted | `agency-assetsync-internal-handler` | `assetId`, `assetPath` |
| **AEM** | `aem.assets.asset.metadata_updated` | Metadata changed | `agency-assetsync-internal-handler` | `assetId`, `assetPath`, `metadata` |
| **Workfront** | `workfront.task.created` | Task created | `workfront-event-handler` | `taskId`, `taskName`, `projectId` |
| **Workfront** | `workfront.task.updated` | Task updated | `workfront-event-handler` | `taskId`, `changes` |
| **Workfront** | `workfront.task.completed` | Task completed | `workfront-event-handler` | `taskId`, `completionDate` |
| **Brand** | `com.adobe.b2a.assetsync.new` | Brand asset sync new | `agency-assetsync-internal-handler` | `brandId`, `assetId`, `assetUrl` |
| **Brand** | `com.adobe.b2a.assetsync.updated` | Brand asset updated | `agency-assetsync-internal-handler` | `brandId`, `assetId`, `changes` |
| **Brand** | `com.adobe.b2a.assetsync.deleted` | Brand asset deleted | `agency-assetsync-internal-handler` | `brandId`, `assetId` |
| **Brand** | `com.adobe.b2a.brand.registered` | Brand registration | `new-brand-registration` | `brandId`, `brandName`, `endpointUrl` |

---

## Visual Rule Builder

### User Interface

The Rules Manager provides a visual canvas for building rules with a drag-and-drop interface.

**Path:** `/rules_manager` or **Top Navigation** → Rules Manager → Rules Configuration

### Creating a Rule

1. **Navigate** to Rules Configuration
2. **Click** "Create Rule" button
3. **Fill in** rule details:
   - Name and description
   - Event type selection
   - Direction (inbound, outbound, both)
   - Target brands (multi-select)
   - Priority level
   - Enable/disable toggle

4. **Build Logic** in Visual Canvas:
   - Add conditions (IF statements)
   - Add actions (THEN statements)
   - Configure logical operators (AND/OR)

5. **Save** the rule

### Condition Configuration

**When you click "Add Condition"**, a modal opens with:

- **Field Selection:** Choose from metadata fields, asset properties, or task properties
  - `metadata.a2b__sync_on_change`
  - `metadata.a2d__customers`
  - `metadata.campaign`
  - `assetPath`, `assetName`
  - `taskId`, `taskName`, `projectId`
  - etc.

- **Operator Selection:**
  - `equals` - Exact match
  - `contains` - String contains value
  - `startsWith` - String starts with value
  - `endsWith` - String ends with value
  - `regex` - Regular expression match
  - `exists` - Field exists
  - `notExists` - Field does not exist
  - `greaterThan`, `lessThan` - Numeric comparison

- **Value Input:** Enter the comparison value

- **Logical Operator:** Choose AND/OR for multiple conditions

### Action Configuration

**When you click "Add Action"**, configure:

- **Action Type:**
  - `route` - Route to specific handler
  - `transform` - Transform event data
  - `filter` - Filter event data
  - `log` - Log event information

- **Target:** Specify the target system or handler

---

## Configuration Guide

### Rule Priority

Rules are evaluated in priority order (higher numbers first). 

- **Priority >= 100:** Stop evaluation after matching (critical rules)
- **Priority 50-99:** High priority business rules
- **Priority 1-49:** Standard rules
- **Priority 0:** Default/fallback rules

### Rule Conditions

#### Example: Simple Condition
```json
{
  "field": "metadata.a2b__sync_on_change",
  "operator": "equals",
  "value": "true"
}
```

#### Example: Multiple Conditions
```json
{
  "conditions": [
    {
      "field": "metadata.a2b__sync_on_change",
      "operator": "equals",
      "value": "true"
    },
    {
      "field": "metadata.a2d__customers",
      "operator": "exists",
      "logicalOperator": "AND"
    }
  ]
}
```

### Rule Actions

```json
{
  "actions": [
    {
      "type": "route",
      "target": "agency-assetsync-internal-handler"
    }
  ]
}
```

---

## API Reference

### Get Event Types

**Endpoint:** `GET /api/v1/web/a2b-agency/get-event-types`

**Query Parameters:**
- `category` (optional): Filter by category (`aem`, `workfront`, `brand`, `custom`)
- `includeExamples` (optional): Include example data (`true`/`false`)
- `format` (optional): Response format (`json`, `simple`, `rules`)

**Example Request:**
```bash
# Get all event types
curl "https://your-runtime.adobeioruntime.net/api/v1/web/a2b-agency/get-event-types"

# Get AEM events only
curl "https://your-runtime.adobeioruntime.net/api/v1/web/a2b-agency/get-event-types?category=aem"

# Get rules-optimized format
curl "https://your-runtime.adobeioruntime.net/api/v1/web/a2b-agency/get-event-types?format=rules"
```

**Example Response:**
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

**Endpoints:** 
- `GET /api/v1/web/a2b-agency/manage-rules` - List rules
- `POST /api/v1/web/a2b-agency/manage-rules` - Create rule
- `PUT /api/v1/web/a2b-agency/manage-rules` - Update rule
- `DELETE /api/v1/web/a2b-agency/manage-rules` - Delete rule

#### Get Rules

**Query Parameters:**
- `eventType` (optional): Filter by event type
- `includeEventTypes` (optional): Include event type metadata

#### Create Rule

**Request Body:**
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

---

## Best Practices

### 1. Rule Naming
- Use descriptive, clear names
- Include the event type and action
- Example: "AEM Asset Creation → Workfront Sync"

### 2. Priority Management
- Use higher priorities (100+) for critical business rules
- Reserve mid-range (50-99) for standard workflows
- Use low priorities (1-49) for fallback behaviors

### 3. Condition Design
- Keep conditions simple for better performance
- Use `exists` checks before value comparisons
- Combine related conditions with AND/OR logically

### 4. Testing
- Always test rules with sample event data
- Use demo mode for development and testing
- Verify rule execution in logs

### 5. Documentation
- Add clear descriptions to complex rules
- Document expected behavior
- Note any dependencies or prerequisites

### 6. Monitoring
- Monitor rule execution performance
- Review logs for errors or unexpected behavior
- Adjust priorities based on actual usage

---

## Integration Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    Rules Manager UI                      │
│                (RulesConfigurationView)                  │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  REST API Layer                          │
│          (get-event-types, manage-rules)                 │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Backend Rule Processing                     │
│   EventTypeRegistry.ts | RulesManager.ts                │
└───────────────────────┬─────────────────────────────────┘
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
┌──────────────────────┐  ┌─────────────────────┐
│  adobe-product-      │  │  agency-assetsync-  │
│  event-handler       │  │  internal-handler   │
└──────────────────────┘  └─────────────────────┘
```

### Event Flow

1. **Event Reception:** Adobe product events received by `adobe-product-event-handler`
2. **Rule Evaluation:** Rules evaluated by `RulesManager` based on event type
3. **Condition Checking:** Rule conditions checked against event data
4. **Action Execution:** Matching rule actions executed
5. **Handler Routing:** Events routed to appropriate internal handlers

---

## Demo Mode

The Rules Manager includes full demo mode support with realistic mock data.

**Enable Demo Mode:**
```bash
# In .env file
AIO_ENABLE_DEMO_MODE=true
```

**Demo Features:**
- Pre-configured sample rules
- Mock event types and brands
- Visual rule builder with sample data
- Rule testing with mock events

---

## File Structure

### Backend
- `src/actions/classes/RulesManager.ts` - Core rule processing logic
- `src/actions/classes/EventTypeRegistry.ts` - Event type definitions
- `src/actions/manage-rules/index.ts` - REST API endpoints
- `src/actions/get-event-types/index.ts` - Event type API

### Frontend
- `src/dx-excshell-1/web-src/src/components/layout/RulesConfigurationView.tsx` - Main UI component

### Documentation
- `docs/rules_manager_schema.json` - Complete schema definition

---

## Extending the System

### Adding New Event Types

1. **Update EventTypeRegistry:**
```typescript
// In EventTypeRegistry.ts
registerEventType({
  type: 'custom.new.event',
  category: 'custom',
  description: 'Custom event description',
  handler: 'custom-event-handler',
  requiredFields: ['field1', 'field2']
});
```

2. **Create Handler:** Implement the event handler action

3. **Update Configuration:** Add to `app.config.yaml`

4. **Update Documentation:** Document the new event type

### Adding New Rule Types

1. **Define in Schema:** Add to `docs/rules_manager_schema.json`
2. **Implement Backend Logic:** Update `RulesManager.ts`
3. **Update UI:** Add to `RulesConfigurationView.tsx`
4. **Test:** Create unit and integration tests

---

## Troubleshooting

### Common Issues

**Issue:** Rules not executing
- **Check:** Rule is enabled
- **Check:** Event type matches
- **Check:** Conditions are properly formatted
- **Check:** Priority conflicts

**Issue:** Conditions not matching
- **Check:** Field names are correct
- **Check:** Operator is appropriate for data type
- **Check:** Value format matches expected format

**Issue:** Actions not triggering
- **Check:** Target handler exists
- **Check:** Handler is properly configured
- **Check:** Action type is supported

---

## Related Documentation

- [Demo Mode Instructions](DEMO_MODE_INSTRUCTIONS.md)
- [Workfront Request Form](WORKFRONT_REQUEST_FORM.md)
- [Security Guidelines](SECURITY_GUIDELINES.md)
- [Adobe React Spectrum](https://react-spectrum.adobe.com/react-spectrum/index.html)
- [Adobe App Builder](https://developer.adobe.com/app-builder/)

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Status:** Phase 1 - Asset Event Triggers (Active)  
**Demo Mode:** ✅ Fully Supported

