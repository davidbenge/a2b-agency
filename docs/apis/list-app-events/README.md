# List App Events API - Response Samples

This directory contains JSON response samples for the `list-app-events` API action.

## API Endpoint

```
GET /api/v1/web/a2b-agency/list-app-events
```

**Note**: This API supersedes the old `list-events` action and uses the new EventRegistryManager for persistent storage.

## Sample Files

### Success Responses (200 OK)

| File | Description | Query Parameters |
|------|-------------|------------------|
| `list-all-events.json` | Returns all 9 events with summary | None |
| `filter-by-category-asset-sync.json` | Returns only asset-sync events | `?category=asset-sync` |
| `filter-by-category-workfront.json` | Returns only workfront events | `?category=workfront` |
| `filter-by-category-brand-registration.json` | Returns only brand-registration events | `?category=brand-registration` |
| `get-specific-event.json` | Returns details for a specific event | `?eventCode=com.adobe.a2b.assetsync.new` |

### Error Responses

| File | Status | Description | Query Parameters |
|------|--------|-------------|------------------|
| `error-event-not-found.json` | 404 | Event code doesn't exist | `?eventCode=com.adobe.a2b.invalid.event` |
| `error-invalid-category.json` | 400 | Invalid category name | `?category=invalid-category` |
| `error-server-error.json` | 500 | Internal server error | N/A |

## Usage Examples

### cURL Examples

```bash
# List all events
curl https://27200-a2b-agency-main.adobeioruntime.net/api/v1/web/a2b-agency/list-app-events

# Filter by category
curl "https://27200-a2b-agency-main.adobeioruntime.net/api/v1/web/a2b-agency/list-app-events?category=registration"

# Get specific event (use get-app-event instead)
curl "https://27200-a2b-agency-main.adobeioruntime.net/api/v1/web/a2b-agency/get-app-event?eventCode=com.adobe.a2b.assetsync.new"
```

### JavaScript/Fetch Examples

```javascript
// List all events
const allEvents = await fetch('/api/v1/web/a2b-agency/list-app-events')
  .then(r => r.json());

// Filter by category
const registrationEvents = await fetch('/api/v1/web/a2b-agency/list-app-events?category=registration')
  .then(r => r.json());

// Get specific event (use get-app-event instead)
const specificEvent = await fetch('/api/v1/web/a2b-agency/get-app-event?eventCode=com.adobe.a2b.assetsync.new')
  .then(r => r.json());
```

## Testing with Sample Files

You can use these sample files for:

1. **Unit Testing** - Mock API responses in tests
2. **Integration Testing** - Validate response structure
3. **Documentation** - Show expected response formats
4. **Development** - Work with realistic data before API is deployed

### Example: Using in Jest Tests

```javascript
import listAllEventsResponse from '../docs/apis/list-events/list-all-events.json';

test('should parse list-events response correctly', () => {
  const { body } = listAllEventsResponse;
  
  expect(body.success).toBe(true);
  expect(body.data.summary.totalEvents).toBe(9);
  expect(body.data.summary.categories).toHaveLength(3);
});
```

### Example: Using in Mock Service Worker

```javascript
import { rest } from 'msw';
import listAllEventsResponse from '../docs/apis/list-events/list-all-events.json';

export const handlers = [
  rest.get('/api/v1/web/a2b-agency/list-events', (req, res, ctx) => {
    const category = req.url.searchParams.get('category');
    
    if (!category) {
      return res(ctx.json(listAllEventsResponse));
    }
    
    // ... handle category filtering
  })
];
```

## Response Structure

All successful responses follow this structure:

```typescript
{
  statusCode: 200,
  body: {
    success: true,
    data: {
      // ... response data ...
      timestamp: string // ISO 8601 format
    }
  }
}
```

All error responses follow this structure:

```typescript
{
  statusCode: 400 | 404 | 500,
  body: {
    success: false,
    error: string,
    details?: object
  }
}
```

## Event Categories

The API supports three event categories:

- **brand-registration** - Brand registration lifecycle events (3 events)
- **asset-sync** - AEM asset synchronization events (3 events)
- **workfront** - Workfront task management events (3 events)

## Event Definition Schema

Each event in the registry contains:

```typescript
{
  code: string;              // Unique event identifier
  category: string;          // Event category
  name: string;              // Human-readable name
  description: string;       // What the event does
  eventClass: string;        // TypeScript class name
  version: string;           // Semantic version
  requiredFields: string[];  // Required data fields
  optionalFields?: string[]; // Optional data fields
}
```

## Related Files

- **Source Registry**: `src/shared/event-registry.ts`
- **Action Implementation**: `src/actions/list-events/index.ts`
- **Action Config**: `app.config.yaml`
- **Documentation**: `docs/cursor/EVENT_REGISTRY_IMPLEMENTATION.md`

