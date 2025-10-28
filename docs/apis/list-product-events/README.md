# List Product Events API

The `list-product-events` action provides an API endpoint for discovering available Adobe Product events (AEM, Creative Cloud, etc.) that can be routed through the `adobe-product-event-handler`.

## Endpoint

```
GET /api/v1/web/a2b-agency/list-product-events
```

## Authentication

This endpoint requires Adobe authentication (`require-adobe-auth: true`).

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | No | Filter events by category (e.g., `product`) |
| `eventCode` | string | No | Get details for a specific event code (e.g., `aem.assets.asset.metadata_updated`) |

## Response Format

### Success Response

```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "data": {
      // Response data varies based on query parameters
    }
  }
}
```

### Error Response

```json
{
  "statusCode": 400|404|500,
  "body": {
    "success": false,
    "error": "Error message",
    "details": {
      // Additional error context
    }
  }
}
```

## Use Cases

### 1. List All Product Events

Get a complete list of all supported Adobe Product events.

**Request:**
```bash
curl -X GET "https://your-namespace.adobeioruntime.net/api/v1/web/a2b-agency/list-product-events" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:** See [list-all-product-events.json](./list-all-product-events.json)

**Response Structure:**
- `summary`: Overview with total count, categories, and event counts per category
- `events`: Complete registry of all product events
- `timestamp`: ISO timestamp of the response

### 2. Filter by Category

Get all events for a specific category.

**Request:**
```bash
curl -X GET "https://your-namespace.adobeioruntime.net/api/v1/web/a2b-agency/list-product-events?category=product" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:** See [filter-by-category-product.json](./filter-by-category-product.json)

**Response Structure:**
- `category`: The requested category
- `count`: Number of events in this category
- `events`: Array of event definitions for this category
- `timestamp`: ISO timestamp of the response

### 3. Get Specific Event

Get detailed information about a specific event code.

**Request:**
```bash
curl -X GET "https://your-namespace.adobeioruntime.net/api/v1/web/a2b-agency/list-product-events?eventCode=aem.assets.asset.metadata_updated" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:** See [get-specific-product-event.json](./get-specific-product-event.json)

**Response Structure:**
- `event`: Complete event definition including:
  - `code`: Unique event identifier
  - `category`: Event category (always `product` for product events)
  - `name`: Human-readable event name
  - `description`: Event purpose and behavior
  - `version`: Event schema version
  - `requiredFields`: Fields that must be present in event data
  - `handlerActionName`: Internal handler action that processes this event
  - `callBlocking`: Whether the handler is invoked synchronously (blocking) or asynchronously (non-blocking)
- `timestamp`: ISO timestamp of the response

## Error Responses

### Event Not Found (404)

When requesting a specific event code that doesn't exist.

**Response:** See [error-event-not-found.json](./error-event-not-found.json)

**Example:**
```bash
curl -X GET "https://your-namespace.adobeioruntime.net/api/v1/web/a2b-agency/list-product-events?eventCode=invalid.event.code" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Invalid Category (400)

When filtering by an invalid category.

**Response:** See [error-invalid-category.json](./error-invalid-category.json)

**Example:**
```bash
curl -X GET "https://your-namespace.adobeioruntime.net/api/v1/web/a2b-agency/list-product-events?category=invalid-category" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Product Event Categories

Currently supported categories:
- `product`: Events from Adobe products (AEM, Creative Cloud, etc.)

## Product Event Structure

Each product event definition includes:

| Field | Type | Description |
|-------|------|-------------|
| `code` | string | Unique event identifier (e.g., `aem.assets.asset.metadata_updated`) |
| `category` | string | Always `product` for product events |
| `name` | string | Human-readable event name |
| `description` | string | Event purpose and when it's emitted |
| `version` | string | Event schema version |
| `requiredFields` | string[] | Fields that must be present in event data |
| `handlerActionName` | string | Internal handler action name (e.g., `a2b-agency/agency-assetsync-internal-handler-metadata-updated`) |
| `callBlocking` | boolean | Whether handler invocation is synchronous (`true`) or asynchronous (`false`) |
| `eventBodyexample` | object | Sample event payload structure |
| `routingRules` | string[] | Routing rules (reserved for future use) |

## Product Events vs App Events

**Product Events** (this API):
- Events FROM Adobe products (AEM, Creative Cloud, etc.)
- Processed BY the agency application
- Use `adobe-product-event-handler` for routing
- Examples: `aem.assets.asset.metadata_updated`, `aem.assets.asset.processing_completed`
- Do NOT include `sendSecretHeader`, `sendSignedKey`, or `injectedObjects` (product events come from Adobe services, not brand apps)

**App Events** (see `list-events` API):
- Events emitted BY the agency application
- Sent TO brand applications
- Examples: `com.adobe.a2b.assetsync.new`, `com.adobe.a2b.registration.enabled`
- Include security headers and agency identification

## Currently Supported Product Events

### AEM Events

1. **aem.assets.asset.metadata_updated**
   - Emitted when AEM asset metadata is updated
   - Handler: `agency-assetsync-internal-handler-metadata-updated`
   - Blocking: `true`

2. **aem.assets.asset.processing_completed**
   - Emitted when AEM asset processing is completed
   - Handler: `agency-assetsync-internal-handler-metadata-updated`
   - Blocking: `true`

## Integration with adobe-product-event-handler

The `adobe-product-event-handler` uses this registry to:
1. Validate incoming product events
2. Route events to appropriate internal handlers
3. Determine whether to invoke handlers synchronously or asynchronously

## Testing

See test file: `src/actions/test/list-product-events.test.ts`

Run tests:
```bash
npm test -- list-product-events.test.ts
```

## Related Documentation

- `src/shared/classes/ProductEventRegistry.ts` - Product event registry implementation
- `src/actions/adobe-product-event-handler/index.ts` - Product event router
- `docs/apis/list-events/README.md` - App events API (agency-to-brand events)

