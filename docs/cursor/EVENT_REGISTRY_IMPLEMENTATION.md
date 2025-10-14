# Event Registry Implementation

**Date:** October 14, 2024  
**Feature:** Centralized A2B Event Registry

## Overview

Implemented a centralized event registry system that serves as the single source of truth for all A2B events. The registry is shared between actions (Node.js/OpenWhisk) and the web frontend (browser), eliminating code duplication and ensuring consistency.

## Problem Solved

Previously, event codes were scattered across different constants in `constants.ts`:
- `AGENCY_BRAND_REGISTRATION_EVENT_CODE` - Brand registration events
- `AEM_ASSET_SYNC_EVENT_CODE` - Asset sync events
- Workfront events had hardcoded strings in event classes (missing from constants!)

This made it:
- ❌ Hard to discover all available events
- ❌ Inconsistent (some in constants, some hardcoded)
- ❌ Difficult to share event metadata with the web frontend
- ❌ No single API endpoint to list supported events

## Solution Architecture

### 1. Shared Event Registry (`src/shared/event-registry.ts`)

Created a browser-safe TypeScript module that defines all events with rich metadata:

```typescript
export interface EventDefinition {
  code: string;                    // Event code (e.g., 'com.adobe.a2b.assetsync.new')
  category: string;                // Category (brand-registration, asset-sync, workfront)
  name: string;                    // Human-readable name
  description: string;             // What the event does
  eventClass: string;              // Corresponding event class name
  version: string;                 // Version for future compatibility
  requiredFields: string[];        // Required data fields
  optionalFields?: string[];       // Optional data fields
}
```

**All 9 A2B Events Registered:**
- 3 Brand Registration events (disabled, received, enabled)
- 3 Asset Sync events (new, update, delete)
- 3 Workfront events (task.created, task.updated, task.completed)

### 2. Helper Functions

Provided convenient functions for working with events:
- `getEventsByCategory(category)` - Filter by category
- `getAllEventCodes()` - Get all event codes
- `getEventDefinition(code)` - Lookup specific event
- `getEventCategories()` - Get available categories
- `isValidEventCode(code)` - Validate event code
- `getEventCountByCategory()` - Get counts per category

### 3. Updated Constants (`src/actions/constants.ts`)

- Added missing `WORKFRONT_EVENT_CODE` constant group
- Maintained backward compatibility with existing code
- Added documentation pointing to the registry as source of truth

### 4. New API Action (`list-events`)

Created `src/actions/list-events/index.ts` that provides:

**GET /list-events** - List all events
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalEvents": 9,
      "categories": ["brand-registration", "asset-sync", "workfront"],
      "eventCounts": { "brand-registration": 3, "asset-sync": 3, "workfront": 3 }
    },
    "events": { /* full registry */ }
  }
}
```

**GET /list-events?category=asset-sync** - Filter by category
```json
{
  "success": true,
  "data": {
    "category": "asset-sync",
    "count": 3,
    "events": [ /* asset sync events only */ ]
  }
}
```

**GET /list-events?eventCode=com.adobe.a2b.assetsync.new** - Get specific event
```json
{
  "success": true,
  "data": {
    "event": {
      "code": "com.adobe.a2b.assetsync.new",
      "category": "asset-sync",
      "name": "Asset Sync New",
      "description": "Emitted when a new asset is synced from AEM",
      "version": "1.0.0",
      "requiredFields": ["asset_id", "asset_path", "metadata", "brandId", "asset_presigned_url"]
    }
  }
}
```

### 5. Updated Event Classes

Updated Workfront event classes to import from constants:
- `WorkfrontTaskCreatedEvent.ts`
- `WorkfrontTaskUpdatedEvent.ts`
- `WorkfrontTaskCompletedEvent.ts`

Now all event classes consistently use constants from `constants.ts` which reference the shared registry.

## Benefits

### ✅ Single Source of Truth
All event definitions in one place (`src/shared/event-registry.ts`)

### ✅ Browser-Safe Sharing
Web frontend can import directly without API calls:
```typescript
import { EVENT_REGISTRY } from '../../../../shared/event-registry';
```

### ✅ Type Safety
TypeScript ensures consistency across actions and web

### ✅ Discoverability
- API endpoint lists all events with metadata
- Helper functions make filtering easy
- Documentation in one place

### ✅ Extensibility
Easy to add new events:
1. Add to registry
2. Add constant (backward compatibility)
3. Create event class
4. Done! Automatically available everywhere

### ✅ Backward Compatible
Existing code using `AEM_ASSET_SYNC_EVENT_CODE.NEW` still works

## Usage Examples

### In Actions (Node.js)

```typescript
// Import from shared registry
import { getEventsByCategory } from '../../shared/event-registry';

// Get all workfront events
const workfrontEvents = getEventsByCategory('workfront');
console.log(workfrontEvents.length); // 3

// Validate event code
import { isValidEventCode } from '../../shared/event-registry';
if (isValidEventCode(params.eventType)) {
  // Process event
}
```

### In Web Frontend (Browser)

```typescript
// Direct import - no API call needed!
import { EVENT_REGISTRY, getEventCategories } from '../../../../shared/event-registry';

function EventDashboard() {
  const categories = getEventCategories();
  
  return (
    <div>
      <h1>Supported Events</h1>
      {categories.map(cat => (
        <EventCategoryPanel key={cat} category={cat} />
      ))}
    </div>
  );
}
```

### Via API (External Systems)

```bash
# List all events
curl https://27200-a2b-agency-main.adobeioruntime.net/api/v1/web/a2b-agency/list-events

# Filter by category
curl https://27200-a2b-agency-main.adobeioruntime.net/api/v1/web/a2b-agency/list-events?category=asset-sync

# Get specific event
curl https://27200-a2b-agency-main.adobeioruntime.net/api/v1/web/a2b-agency/list-events?eventCode=com.adobe.a2b.assetsync.new
```

## Files Created/Modified

### Created
- ✨ `src/shared/event-registry.ts` - Event registry with metadata
- ✨ `src/shared/README.md` - Documentation for shared code
- ✨ `src/actions/list-events/index.ts` - API action for listing events
- ✨ `docs/cursor/EVENT_REGISTRY_IMPLEMENTATION.md` - This document

### Modified
- 📝 `src/actions/constants.ts` - Added WORKFRONT_EVENT_CODE, documentation
- 📝 `src/actions/classes/a2b_events/WorkfrontTaskCreatedEvent.ts` - Use constant
- 📝 `src/actions/classes/a2b_events/WorkfrontTaskUpdatedEvent.ts` - Use constant
- 📝 `src/actions/classes/a2b_events/WorkfrontTaskCompletedEvent.ts` - Use constant
- 📝 `app.config.yaml` - Added list-events action configuration

## Testing

✅ TypeScript compilation: `npx tsc --noEmit -p tsconfig.actions.json` - **PASSED**  
✅ Linting: No errors in created/modified files  
✅ Build compatibility: Actions tsconfig accepts shared imports

## Next Steps

1. **Test the list-events action** by deploying and calling it
2. **Create web UI component** to display events using the registry
3. **Add unit tests** for event registry helper functions
4. **Consider versioning** for future event schema changes

## Notes

- The `src/shared/` directory follows the cursor rule: "If code must be shared, place types/models under `src/shared/**` and ensure they are browser-safe"
- No Node.js modules are imported in `event-registry.ts` - it's 100% browser-safe
- The registry can be extended with additional metadata (deprecation status, examples, etc.)
- Both `tsconfig.actions.json` and `tsconfig.web.json` can reference `src/shared/`

