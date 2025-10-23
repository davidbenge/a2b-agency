# ProductEventRegistry Documentation

## Overview

`ProductEventRegistry.ts` is the single source of truth for all **Adobe Product events** (AEM, Creative Cloud, etc.) that the A2B agency application receives and processes. It maintains a centralized registry of events from external Adobe services that trigger internal workflows.

## Purpose

This registry serves as:
1. **Event Discovery**: API endpoint (`list-product-events`) for discovering available product events
2. **Routing Configuration**: Maps product events to internal handler actions
3. **Validation**: Ensures product events have required fields and proper structure
4. **Documentation**: Self-documenting catalog of supported product integrations

## Location

**Registry Code:**
```
src/shared/classes/ProductEventRegistry.ts
```

**Documentation:**
```
docs/cursor/PRODUCT_EVENT_REGISTRY_DOCUMENTATION.md
```

## Event Definition Structure

Each event in the registry is defined by `ProductEventDefinition`:

```typescript
export interface ProductEventDefinition {
    code: string;                    // Unique event identifier (e.g., 'aem.assets.asset.metadata_updated')
    category: EventCategoryValue;    // Always 'product' for product events
    name: string;                    // Human-readable name
    description: string;             // Event purpose and when Adobe emits it
    eventClass?: string;             // TypeScript class name (if applicable)
    version: string;                 // Schema version
    eventBodyexample: any;           // Sample event payload from Adobe
    routingRules: string[];          // Routing rules (reserved for future use)
    requiredFields: string[];        // Fields that MUST be present in Adobe's payload
    optionalFields?: string[];       // Fields that MAY be present
    handlerActionName: string;       // Internal handler action name
    callBlocking: boolean;           // Whether to invoke handler synchronously
}
```

## Key Differences from AppEventRegistry

| Feature | AppEventRegistry | ProductEventRegistry |
|---------|------------------|---------------------|
| **Source** | Agency application | Adobe products (AEM, CC, etc.) |
| **Direction** | Outbound (agency → brand) | Inbound (Adobe → agency) |
| **Security** | Has `sendSecretHeader`, `sendSignedKey` | No security fields (Adobe authenticated) |
| **Injected Data** | Has `injectedObjects` (app_runtime_info) | No injected objects |
| **Routing** | Direct to brand endpoints | Routes to internal handlers |
| **Handler** | Brand's `agency-event-handler` | Agency's internal handlers |

## Event Categories

All product events use the `product` category:

### `product` - Adobe Product Events
Events received from Adobe services:
- **AEM Assets**:
  - `aem.assets.asset.metadata_updated` - AEM asset metadata changed
  - `aem.assets.asset.processing_completed` - AEM asset processing finished

## Handler Configuration

Each product event specifies its internal handler:

```typescript
{
  code: 'aem.assets.asset.metadata_updated',
  handlerActionName: 'a2b-agency/agency-assetsync-internal-handler-metadata-updated',
  callBlocking: true  // Wait for handler to complete before responding
}
```

### Blocking vs Non-Blocking

- **Blocking (`callBlocking: true`)**: 
  - Waits for handler to complete
  - Returns handler result in response
  - Use for critical operations that must complete synchronously

- **Non-Blocking (`callBlocking: false`)**:
  - Fires handler asynchronously
  - Returns immediately
  - Use for long-running operations that don't need immediate response

## API Functions

### `getAllProductEventCodes(): string[]`
Returns array of all product event codes.

```typescript
const codes = getAllProductEventCodes();
// Returns: ['aem.assets.asset.metadata_updated', 'aem.assets.asset.processing_completed']
```

### `getProductEventsByCategory(category): ProductEventDefinition[]`
Returns all events for a specific category.

```typescript
const productEvents = getProductEventsByCategory('product');
// Returns: [AEM metadata event, AEM processing event, ...]
```

### `getProductEventDefinition(code): ProductEventDefinition | undefined`
Returns specific event definition.

```typescript
const event = getProductEventDefinition('aem.assets.asset.metadata_updated');
// Returns: { code: 'aem.assets.asset.metadata_updated', category: 'product', ... }
```

### `getProductEventCategories(): string[]`
Returns all available categories.

```typescript
const categories = getProductEventCategories();
// Returns: ['product']
```

### `isValidProductEventCode(code): boolean`
Checks if product event code exists.

```typescript
const isValid = isValidProductEventCode('aem.assets.asset.metadata_updated');
// Returns: true
```

### `getProductEventCountByCategory(): Record<string, number>`
Returns event count per category.

```typescript
const counts = getProductEventCountByCategory();
// Returns: { product: 2 }
```

## Event Naming Convention

Product events follow Adobe's convention: `{product}.{domain}.{resource}.{action}`

**Examples**:
- `aem.assets.asset.metadata_updated` - AEM Assets service, asset resource, metadata updated
- `aem.assets.asset.processing_completed` - AEM Assets service, asset resource, processing completed

**Note**: Product events do NOT use the `com.adobe.a2b.*` namespace as they originate from Adobe, not the A2B application.

## Integration with adobe-product-event-handler

The `adobe-product-event-handler` uses this registry to route incoming product events:

1. **Validate Event**: Check if event code exists in registry
2. **Get Handler**: Lookup `handlerActionName` from registry
3. **Invoke Handler**: Call handler with `callBlocking` setting
4. **Return Result**: Return success/error response

```typescript
// In adobe-product-event-handler/index.ts
const eventDefinition = getProductEventDefinition(params.type);
const result = await ow.actions.invoke({
  name: eventDefinition.handlerActionName,
  params: { routerParams: params },
  blocking: eventDefinition.callBlocking
});
```

## Usage Examples

### In adobe-product-event-handler

```typescript
import { getProductEventDefinition } from '../../shared/classes/ProductEventRegistry';

const eventDefinition = getProductEventDefinition(params.type);
if (!eventDefinition) {
  return { statusCode: 200, body: { message: 'Unhandled event type' } };
}

// Route to handler
const ow = require("openwhisk")();
const result = await ow.actions.invoke({
  name: eventDefinition.handlerActionName,
  params: { routerParams: params },
  blocking: eventDefinition.callBlocking,
  result: true
});
```

### In list-product-events API

```typescript
import { getAllProductEventCodes, getProductEventDefinition } from '../../shared/classes/ProductEventRegistry';

// List all product events
const codes = getAllProductEventCodes();

// Get specific event
const event = getProductEventDefinition('aem.assets.asset.metadata_updated');
```

## Adding New Product Events

To add a new Adobe product event:

1. **Create event body example** in `docs/events/product/`:
   ```bash
   docs/events/product/aem/aem-assets-new-event.json
   ```

2. **Create internal handler action** (if needed):
   ```bash
   src/actions/agency-myproduct-internal-handler/index.ts
   ```

3. **Add to registry** in `ProductEventRegistry.ts`:
   ```typescript
   const myNewProductEventBody = require('../../../docs/events/product/aem/aem-assets-new-event.json');
   
   export const EVENT_REGISTRY: Record<string, ProductEventDefinition> = {
     // ... existing events
     'aem.assets.asset.new_event': {
       code: 'aem.assets.asset.new_event',
       category: EventCategory.PRODUCT,
       name: 'AEM Asset New Event',
       description: 'Emitted when Adobe AEM does something new',
       version: '1.0.0',
       eventBodyexample: myNewProductEventBody,
       routingRules: [],
       requiredFields: ['assetId', 'repositoryMetadata'],
       optionalFields: ['customField'],
       handlerActionName: 'a2b-agency/agency-myproduct-internal-handler',
       callBlocking: true
     }
   };
   ```

4. **Add handler to app.config.yaml**:
   ```yaml
   agency-myproduct-internal-handler:
     function: src/actions/agency-myproduct-internal-handler/index.ts
     web: 'no'
     runtime: nodejs:22
     inputs:
       LOG_LEVEL: debug
     annotations:
       require-adobe-auth: false
       final: true
   ```

5. **Update tests** in `src/actions/test/list-product-events.test.ts`

6. **Update API samples** in `docs/apis/list-product-events/*.json`

## Browser Safety

⚠️ **Important**: This file is browser-safe and can be imported by both Node.js actions and frontend code.

**Do NOT import Node-only modules** such as:
- `openwhisk`
- `@adobe/aio-lib-*`
- `fs`, `path`, or other Node.js built-ins

## Security Considerations

### No Secret Headers

Product events do NOT include:
- `sendSecretHeader` - Not needed (Adobe I/O Events handles authentication)
- `sendSignedKey` - Not needed (Adobe I/O Events validates signatures)

### No Injected Objects

Product events do NOT inject:
- `app_runtime_info` - Not added to Adobe events
- `agency_identification` - Not added to Adobe events

These are only added to **outbound** events (app events sent to brands).

## Event Flow

```
Adobe Product (AEM)
    ↓
    │ Webhook/Event
    ↓
adobe-product-event-handler
    ↓
    │ Lookup in ProductEventRegistry
    ↓
Internal Handler (e.g., agency-assetsync-internal-handler-metadata-updated)
    ↓
    │ Process event, sync data
    ↓
Brand Event (e.g., com.adobe.a2b.assetsync.new)
    ↓
Brand Application
```

## Related Documentation

- **API Documentation**: `docs/apis/list-product-events/README.md`
- **Product Event Handler**: `src/actions/adobe-product-event-handler/index.ts`
- **App Events**: `AppEventRegistry.ts` (for agency-to-brand events)
- **Type Definitions**: `src/shared/types/index.ts`

## Testing

Run tests:
```bash
npm test -- list-product-events.test.ts
```

## Current Product Events

### AEM Assets

1. **aem.assets.asset.metadata_updated**
   - Triggered when AEM asset metadata is updated
   - Handler: `agency-assetsync-internal-handler-metadata-updated`
   - Blocking: `true`
   - Required: `assetId,repositoryMetadata`

2. **aem.assets.asset.processing_completed**
   - Triggered when AEM asset processing completes
   - Handler: `agency-assetsync-internal-handler-metadata-updated`
   - Blocking: `true`
   - Required: `assetId,repositoryMetadata`

## Current Event Count

- **Total Product Events**: 2
- **AEM Events**: 2

Last updated: 2025-10-18

