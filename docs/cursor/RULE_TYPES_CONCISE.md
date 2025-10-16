# Rule Types - Concise Summary

## Four Primary Rule Types

### 1. Asset Event Triggers (Low Complexity)
**Purpose:** Respond to asset lifecycle events (create, update, delete)
**Events:** AEM asset events, Workfront task events
**Example:** IF asset created in AEM → create Workfront document

### 2. Metadata Sync (Medium Complexity)
**Purpose:** Synchronize metadata between AEM and Workfront
**Events:** Metadata updates, task changes
**Example:** IF AEM metadata includes `a2b__sync_on_change=true` → trigger brand sync

### 3. Approval Workflows (Medium Complexity)
**Purpose:** Coordinate review and approval processes
**Events:** Task creation, completion, status updates
**Example:** IF Workfront task completed → mark AEM asset as approved

### 4. Asset Folder Management (Medium Complexity)
**Purpose:** Manage asset-to-folder relationships
**Events:** Asset creation, updates, deletion
**Example:** IF asset created in AEM `/campaigns` → create Workfront document in 'Campaign Assets' folder

## Implementation Status
- ✅ **Phase 1:** Asset Event Triggers (current)
- 🔄 **Phase 2:** Metadata Sync (next)
- 📋 **Phase 3:** Approval Workflows (requires Workfront integration)
- 📋 **Phase 4:** Asset Folder Management (organization features)

## Key Components
- **Backend:** `RulesManager.ts`, `EventTypeRegistry.ts`
- **Frontend:** `RulesConfigurationView.tsx` with Visual Rule Builder
- **Events:** `agency-assetsync-internal-handler`, `workfront-event-handler`

## Common Use Cases
- **Asset Sync:** AEM → Workfront asset synchronization
- **Brand Routing:** Customer-based asset distribution
- **Approval Flow:** Task-based content approval
- **Organization:** Folder-based asset management



