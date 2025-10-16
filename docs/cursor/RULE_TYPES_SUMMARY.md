# Rule Types Summary

## Overview

The A2B Agency application supports four primary rule types for managing business logic between Adobe Experience Manager (AEM) and Workfront systems. These rules enable automated workflows, asset synchronization, and approval processes.

---

## Supported Rule Types

### 1. Asset Event Triggers
**Complexity:** Low | **Primary Use Case:** Asset lifecycle management

**Description:** Rules that respond to asset lifecycle events (creation, updates, deletion) in AEM or Workfront, initiating synchronization or notifications.

**Supported Events:**
- `aem.assets.asset.created`
- `aem.assets.asset.updated`
- `aem.assets.asset.deleted`
- `aem.assets.asset.metadata_updated`
- `workfront.task.created`
- `workfront.task.updated`
- `workfront.task.completed`

**Common Examples:**
- **Asset Sync:** IF asset created in AEM → create linked document in Workfront
- **Status Updates:** IF asset updated in AEM → sync changes to brand systems
- **Cleanup:** IF asset deleted in AEM → cleanup brand references
- **Approval Flow:** IF Workfront task completed → mark AEM asset as approved

**Implementation:** Processed by `agency-assetsync-internal-handler` action

---

### 2. Metadata Sync
**Complexity:** Medium | **Primary Use Case:** Data consistency across systems

**Description:** Rules that manage metadata transfer and transformation between AEM and Workfront, ensuring descriptive data remains consistent.

**Supported Events:**
- `aem.assets.asset.metadata_updated`
- `aem.assets.asset.updated`
- `workfront.task.created`
- `workfront.task.updated`
- `workfront.task.completed`

**Key Metadata Fields:**
- `a2b__sync_on_change` - Boolean flag triggering asset sync
- `a2d__customers` - Comma-separated brand IDs for routing
- `a2b__last_sync` - Timestamp of last successful sync

**Common Examples:**
- **Sync Trigger:** IF AEM metadata includes `a2b__sync_on_change=true` → trigger brand sync
- **Customer Routing:** IF AEM metadata includes `a2d__customers` → apply brand routing rules
- **Status Sync:** IF Workfront task updated → push metadata to AEM
- **Publishing Flag:** IF Workfront task completed → flag AEM asset for publishing

**Implementation:** Requires metadata transformation logic in RulesManager class

---

### 3. Approval Workflows
**Complexity:** Medium | **Primary Use Case:** Review and approval coordination

**Description:** Rules that coordinate review and approval processes between AEM and Workfront, managing task creation, status updates, and feedback loops.

**Supported Events:**
- `aem.assets.asset.metadata_updated`
- `aem.assets.asset.updated`
- `workfront.task.created`
- `workfront.task.updated`
- `workfront.task.completed`

**Workflow Status Mapping:**
- **AEM → Workfront:** Asset status changes trigger Workfront task updates
- **Workfront → AEM:** Task completion updates AEM asset metadata

**Common Examples:**
- **Task Creation:** IF asset metadata updated in AEM → trigger Workfront task creation
- **Approval:** IF Workfront task completed → mark AEM asset as approved
- **Status Sync:** IF Workfront task updated → sync status to AEM metadata
- **Notifications:** IF Workfront task created → notify AEM contributor
- **Asset Updates:** IF AEM asset updated → update related Workfront task

**Implementation:** Requires task-to-asset relationship mapping and status synchronization

---

### 4. Asset Folder Management
**Complexity:** Medium | **Primary Use Case:** Organization and structure

**Description:** Rules that manage asset-to-folder relationships between AEM and Workfront, handling asset placement and folder-based organization.

**Supported Events:**
- `aem.assets.asset.created`
- `aem.assets.asset.updated`
- `aem.assets.asset.deleted`

**Folder Mapping Approach:**
- **Path Analysis:** Extract folder structure from AEM asset paths
- **Folder Creation:** Create corresponding Workfront folders
- **Metadata Organization:** Use asset metadata to determine target folders

**Common Examples:**
- **Campaign Organization:** IF asset created in AEM `/content/dam/campaigns` → create Workfront document in 'Campaign Assets' folder
- **Structure Maintenance:** IF asset updated in AEM → maintain Workfront folder structure
- **Cleanup:** IF asset deleted in AEM → remove from corresponding Workfront folder
- **Metadata Routing:** IF asset metadata includes `campaign=summer2024` → move to Workfront 'Summer Campaign' folder
- **Approval Organization:** IF Workfront task completed → organize AEM asset in approved folder structure

**Implementation:** Uses asset path analysis to determine folder relationships

---

## Rule Complexity Levels

### Low Complexity
- **Asset Event Triggers** - Simple event-to-action mapping
- **Basic Conditions** - Field equals value
- **Simple Actions** - Route to handler, log event

### Medium Complexity
- **Metadata Sync** - Field transformation and mapping
- **Approval Workflows** - Multi-step status coordination
- **Asset Folder Management** - Path analysis and organization

---

## Implementation Phases

### Phase 1: Foundation (Current)
- ✅ Asset Event Triggers (lowest complexity)
- ✅ Basic UI for rule creation
- ✅ Demo mode with mock data

### Phase 2: Enhanced Logic
- 🔄 Metadata Sync rules
- 🔄 Advanced condition operators
- 🔄 Action parameter configuration

### Phase 3: Workflow Integration
- 📋 Approval Workflows rules
- 📋 Workfront task integration
- 📋 Status synchronization

### Phase 4: Organization
- 📋 Asset Folder Management rules
- 📋 Path-based organization
- 📋 Advanced folder mapping

---

## Technical Architecture

### Backend Components
- **`RulesManager.ts`** - Core rule processing logic
- **`EventTypeRegistry.ts`** - Event type definitions
- **`manage-rules/index.ts`** - REST API endpoints

### Frontend Components
- **`RulesConfigurationView.tsx`** - Main UI component
- **Visual Rule Builder** - Drag-and-drop rule creation
- **Condition/Action Modals** - Configuration interfaces

### Event Processing
- **`agency-assetsync-internal-handler`** - AEM asset events
- **`workfront-event-handler`** - Workfront task events (future)
- **`adobe-product-event-handler`** - Adobe product events

---

## Configuration Examples

### Simple Asset Sync Rule
```json
{
  "name": "Auto-sync Marketing Assets",
  "type": "asset_event_triggers",
  "event": "aem.assets.asset.created",
  "condition": "asset.type equals 'image'",
  "action": "route to Workfront Asset Handler"
}
```

### Metadata Sync Rule
```json
{
  "name": "Brand Customer Sync",
  "type": "metadata_sync",
  "event": "aem.assets.asset.metadata_updated",
  "condition": "metadata.a2d__customers exists",
  "action": "sync customer list to Workfront"
}
```

### Approval Workflow Rule
```json
{
  "name": "Brand Approval Process",
  "type": "approval_workflows",
  "event": "workfront.task.completed",
  "condition": "task.project equals 'Brand Review'",
  "action": "mark AEM asset as approved"
}
```

---

## Future Considerations

### Deferred Rule Types
- **Comment Sync** - Requires comment events and APIs
- **Versioning & Rollback** - Requires version management system

### System Configuration
- **Identity & Auth** - Handled at system level
- **Scalability Controls** - Configurable thresholds
- **Custom Connector Logic** - Action-specific implementation

---

## Development Guidelines

### Testing Approach
- **Unit Tests** - Individual rule evaluation logic
- **Integration Tests** - Rule processing with actual events
- **UI Tests** - Rules Configuration UI in demo mode
- **End-to-End Tests** - Complete rule workflows

### File Structure
```
src/actions/classes/
├── RulesManager.ts          # Core rule processing
├── EventTypeRegistry.ts     # Event definitions
└── io_events/              # Event classes

src/dx-excshell-1/web-src/src/components/layout/
└── RulesConfigurationView.tsx  # UI component

src/actions/
├── manage-rules/           # REST API
├── agency-assetsync-internal-handler/  # AEM events
└── workfront-event-handler/  # Workfront events
```

---

## Related Documentation
- [Rules Manager Schema](../rules_manager_schema.json)
- [Rules Manager User Story](./RULES_MANAGER_USER_STORY.md)
- [Demo Mode Instructions](../DEMO_MODE_INSTRUCTIONS.md)
- [Event Types and Rules](../EVENT_TYPES_AND_RULES.md)



