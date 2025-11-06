# AppEventRegistry Documentation

## Overview

`AppEventRegistry.ts` is the single source of truth for all **agency-to-brand application events** in the A2B system. It maintains a centralized registry of events that the agency application emits and sends to brand applications.

## Purpose

This registry serves as:
1. **Event Discovery**: API endpoint (`list-events`) for discovering available app events
2. **Validation**: Ensures events have required fields and proper structure
3. **Documentation**: Self-documenting event catalog with descriptions and examples
4. **Type Safety**: Provides TypeScript types for event definitions

## Location

**Registry Code:**
```
src/shared/classes/AppEventRegistry.ts
```

**Documentation:**
```
docs/cursor/APP_EVENT_REGISTRY_DOCUMENTATION.md
```

## Event Definition Structure

Each event in the registry is defined by `AppEventDefinition`:

```typescript
export interface AppEventDefinition {
    code: string;                    // Unique event identifier (e.g., 'com.adobe.a2b.assetsync.new')
    category: EventCategoryValue;    // Event category ('registration', 'agency', 'brand', 'product')
    name: string;                    // Human-readable name
    description: string;             // Event purpose and when it's emitted
    eventClass?: string;             // TypeScript class name
    version: string;                 // Schema version
    sendSecretHeader: boolean;       // Whether to include X-A2B-Brand-Secret header
    sendSignedKey: boolean;          // Whether to include signed key for verification
    eventBodyexample: any;           // Sample event payload
    routingRules: string[];          // Routing rules (reserved for future use)
    requiredFields: string[];        // Fields that MUST be present
    optionalFields?: string[];       // Fields that MAY be present
    injectedObjects?: string[];      // Objects injected by system (e.g., 'app_runtime_info')
}
```

## Event Categories

The registry organizes events into categories:

### 1. `registration` - Brand Registration Lifecycle
Events related to brand registration and connection management:
- `com.adobe.a2b.registration.disabled` - Brand connection disabled
- `com.adobe.a2b.registration.received` - Registration request received
- `com.adobe.a2b.registration.enabled` - Brand connection enabled and secret provided

### 2. `agency` - Agency-Published Events
Events emitted by the agency to notify brands:
- **Asset Sync**:
  - `com.adobe.a2b.assetsync.new` - New asset synced from AEM
  - `com.adobe.a2b.assetsync.update` - Asset updated in AEM
  - `com.adobe.a2b.assetsync.delete` - Asset deleted from AEM
- **Workfront**:
  - `com.adobe.a2b.workfront.task.created` - Task created in Workfront
  - `com.adobe.a2b.workfront.task.updated` - Task updated in Workfront
  - `com.adobe.a2b.workfront.task.completed` - Task completed in Workfront

## Key Features

### Security Headers

App events include security mechanisms:

```typescript
sendSecretHeader: true  // Includes X-A2B-Brand-Secret header for authentication
sendSignedKey: true     // Includes signed key for verification
```

### Injected Objects

System automatically injects contextual data:

```typescript
injectedObjects: ['app_runtime_info', 'agency_identification']
```

- **`app_runtime_info`**: Runtime context (consoleId, projectName, workspace, etc.)
- **`agency_identification`**: Agency identity (agencyId, orgId)

## API Functions

### `getAllEventCodes(): string[]`
Returns array of all event codes.

```typescript
const codes = getAllEventCodes();
// Returns: ['com.adobe.a2b.registration.disabled', 'com.adobe.a2b.registration.received', ...]
```

### `getEventsByCategory(category): AppEventDefinition[]`
Returns all events for a specific category.

```typescript
const agencyEvents = getEventsByCategory('agency');
// Returns: [AssetSyncNewEvent, AssetSyncUpdateEvent, ...]
```

### `getEventDefinition(code): AppEventDefinition | undefined`
Returns specific event definition.

```typescript
const event = getEventDefinition('com.adobe.a2b.assetsync.new');
// Returns: { code: 'com.adobe.a2b.assetsync.new', category: 'agency', ... }
```

### `getEventCategories(): string[]`
Returns all available categories.

```typescript
const categories = getEventCategories();
// Returns: ['registration', 'agency']
```

### `isValidEventCode(code): boolean`
Checks if event code exists.

```typescript
const isValid = isValidEventCode('com.adobe.a2b.assetsync.new');
// Returns: true
```

### `getEventCountByCategory(): Record<string, number>`
Returns event count per category.

```typescript
const counts = getEventCountByCategory();
// Returns: { registration: 3, agency: 6 }
```

## Event Naming Convention

Events follow the pattern: `com.adobe.{direction}.{domain}.{action}`

- **Direction**:
  - `a2b` = Agency-to-Brand (agency publishes, brand consumes)
  - `b2a` = Brand-to-Agency (brand publishes, agency consumes)

- **Examples**:
  - `com.adobe.a2b.assetsync.new` - Agency publishes asset sync event to brand
  - `com.adobe.a2b.registration.enabled` - Agency enables brand registration

## Usage Examples

### In Actions (Node.js)

```typescript
import { getEventDefinition, isValidEventCode } from '../../shared/classes/AppEventRegistry';

// Validate event code
if (!isValidEventCode(eventCode)) {
  return errorResponse(404, 'Event not found');
}

// Get event definition
const eventDef = getEventDefinition(eventCode);
console.log(`Required fields: ${eventDef.requiredFields.join(', ')}`);
```

### In Frontend (Browser)

```typescript
import { getAllEventCodes, getEventsByCategory } from '../shared/classes/AppEventRegistry';

// List all events
const allEvents = getAllEventCodes();

// Filter by category
const registrationEvents = getEventsByCategory('registration');
```

## Adding New Events

To add a new event to the registry:

1. **Create event body example** in `docs/events/`:
   ```bash
   docs/events/agency/com-adobe-a2b-mynew-event.json
   ```

2. **Add to registry** in `AppEventRegistry.ts`:
   ```typescript
   const myNewEventBody = require('../../../docs/events/agency/com-adobe-a2b-mynew-event.json');
   
   export const EVENT_REGISTRY: Record<string, AppEventDefinition> = {
     // ... existing events
     'com.adobe.a2b.mynew.event': {
       code: 'com.adobe.a2b.mynew.event',
       category: EventCategory.AGENCY,
       name: 'My New Event',
       description: 'Emitted when something happens',
       eventClass: 'MyNewEvent',
       version: '1.0.0',
       sendSecretHeader: true,
       sendSignedKey: true,
       eventBodyexample: myNewEventBody,
       routingRules: [],
       requiredFields: ['fieldA', 'fieldB'],
       optionalFields: ['fieldC'],
       injectedObjects: ['app_runtime_info', 'agency_identification']
     }
   };
   ```

3. **Create event class** (if needed) in `src/actions/classes/a2b_events/`:
   ```typescript
   export class MyNewEvent extends A2bEvent {
     constructor(/* params */) {
       super();
       this.type = 'com.adobe.a2b.mynew.event';
       // ... set data
     }
   }
   ```

4. **Update tests** in `src/actions/test/list-events.test.ts`

5. **Update API samples** in `docs/apis/list-events/*.json`

## Browser Safety

⚠️ **Important**: This file is browser-safe and can be imported by both Node.js actions and frontend code.

**Do NOT import Node-only modules** such as:
- `openwhisk`
- `@adobe/aio-lib-*`
- `fs`, `path`, or other Node.js built-ins

## Related Documentation

- **API Documentation**: `docs/apis/list-events/README.md`
- **Event Naming Conventions**: See workspace rules
- **Product Events**: `ProductEventRegistry.ts` (for Adobe product events like AEM)
- **Event Classes**: `src/actions/classes/a2b_events/`
- **Type Definitions**: `src/shared/types/index.ts`

## Testing

Run tests:
```bash
npm test -- list-events.test.ts
```

## Synchronization with a2b-brand

⚠️ **Critical**: The event registry must be synchronized between `a2b-agency` and `a2b-brand` projects.

Both projects need:
- Identical `src/shared/classes/AppEventRegistry.ts`
- Identical event definitions
- Identical event counts and categories

See workspace rules for synchronization process.

## Current Event Count

- **Total Events**: 9
- **Registration**: 3 events
- **Agency**: 6 events

Last updated: 2025-10-18

