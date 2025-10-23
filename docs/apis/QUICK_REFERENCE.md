# A2B Agency API Quick Reference

Quick reference guide for all Agency-to-Brand (A2B) Agency APIs.

## Base URLs

```
Runtime API: https://{namespace}.adobeioruntime.net/api/v1/web/{package}/
Static URL:  https://{consoleId}-{projectName}-{workspace}.adobeio-static.net/
```

---

## Event Handlers

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/brand-event-handler` | POST | Secret Header | Handle events FROM brands |
| `/adobe-product-event-handler` | POST | Adobe IMS | Handle events FROM Adobe products |

---

## Brand Management APIs

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/get-brands` | GET | Adobe IMS | List all brands |
| `/get-brand?brandId={id}` | GET | Adobe IMS | Get specific brand |
| `/new-brand-registration` | POST | Adobe IMS | Register new brand |
| `/update-brand` | PUT | Adobe IMS | Update brand config |
| `/delete-brand?brandId={id}` | DELETE | Adobe IMS | Delete brand |
| `/delete-all-brands` | DELETE | Adobe IMS | Delete all brands ⚠️ |

---

## Global App Event APIs

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/list-app-events` | GET | Adobe IMS | List all global app events |
| `/get-app-event?eventCode={code}` | GET | Adobe IMS | Get specific app event |
| `/create-app-event` | POST | Adobe IMS | Create app event definition |
| `/update-app-event` | PUT | Adobe IMS | Update app event definition |
| `/delete-app-event?eventCode={code}` | DELETE | Adobe IMS | Delete app event definition |

---

## Product Event APIs

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/list-product-events` | GET | Adobe IMS | List all product events |
| `/get-product-event?eventCode={code}` | GET | Adobe IMS | Get specific product event |
| `/create-product-event` | POST | Adobe IMS | Create product event definition |
| `/update-product-event` | PUT | Adobe IMS | Update product event definition |
| `/delete-product-event?eventCode={code}` | DELETE | Adobe IMS | Delete product event definition |

---

## Brand-Specific Event APIs

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/list-brand-app-events?brandId={id}` | GET | Adobe IMS | List brand event overrides |
| `/create-brand-app-event` | POST | Adobe IMS | Create brand event override |
| `/update-brand-app-event` | PUT | Adobe IMS | Update brand event override |
| `/delete-brand-app-event?brandId={id}&eventCode={code}` | DELETE | Adobe IMS | Delete brand event override |

---

## Authentication

### Adobe IMS (Most APIs)

```http
Authorization: Bearer {IMS_TOKEN}
x-api-key: {API_KEY}
```

### Brand Secret (Event Handlers)

```http
X-A2B-Agency-Secret: {BRAND_SECRET}
```

**Note**: Registration events don't require secret validation.

---

## Common Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (missing params) |
| 401 | Unauthorized (invalid auth) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Event Categories

| Category | Description |
|----------|-------------|
| `agency` | Events published BY agency TO brands |
| `brand` | Events published BY brands TO agency |
| `registration` | Brand registration lifecycle events |
| `product` | Events from Adobe products (AEM, Workfront) |

---

## Event Naming Convention

```
com.adobe.{direction}.{domain}.{action}

Examples:
- com.adobe.a2b.assetsync.new       (agency → brand)
- com.adobe.b2a.assetsync.updated   (brand → agency)
- com.adobe.a2b.registration.enabled (agency → brand)
```

---

## Quick Examples

### List All Brands

```bash
curl -X GET "https://{namespace}.adobeioruntime.net/api/v1/web/{package}/get-brands" \
  -H "Authorization: Bearer {IMS_TOKEN}" \
  -H "x-api-key: {API_KEY}"
```

### Register New Brand

```bash
curl -X POST "https://{namespace}.adobeioruntime.net/api/v1/web/{package}/new-brand-registration" \
  -H "Authorization: Bearer {IMS_TOKEN}" \
  -H "x-api-key: {API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "app_runtime_info": { ... },
      "brandId": "brand-123",
      "name": "ACME Corp",
      "endPointUrl": "https://..."
    }
  }'
```

### Send Event to Agency (from Brand)

```bash
curl -X POST "https://{namespace}.adobeioruntime.net/api/v1/web/{package}/brand-event-handler" \
  -H "X-A2B-Agency-Secret: {SECRET}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "com.adobe.b2a.assetsync.new",
    "source": "urn:uuid:brand-id",
    "id": "event-uuid",
    "data": {
      "app_runtime_info": { ... },
      "asset_id": "asset-123"
    }
  }'
```

### List App Events

```bash
curl -X GET "https://{namespace}.adobeioruntime.net/api/v1/web/{package}/list-app-events" \
  -H "Authorization: Bearer {IMS_TOKEN}" \
  -H "x-api-key: {API_KEY}"
```

### List Product Events

```bash
curl -X GET "https://{namespace}.adobeioruntime.net/api/v1/web/{package}/list-product-events" \
  -H "Authorization: Bearer {IMS_TOKEN}" \
  -H "x-api-key: {API_KEY}"
```

---

## Event Flow

### Registration Flow

```
1. Brand → POST /new-brand-registration
2. Agency creates brand (disabled, generates secret)
3. Admin → PUT /update-brand (enabled: true)
4. Agency → Sends registration.enabled event TO brand (includes secret)
5. Brand stores secret
```

### Event Processing Flow

```
1. Brand → POST /brand-event-handler (with secret header)
2. Agency validates secret
3. Agency routes to internal handler
4. Handler processes event
5. Agency → Response
```

### Event Definition Hierarchy

```
1. Product Event Definitions (Adobe products)
2. Global App Event Definitions (all brands)
3. Brand-Specific Event Definitions (override)
4. Event Transmission (send to brand)
```

---

## Important Security Notes

### Brand Secret

- ✅ Generated internally by agency
- ✅ Only sent once via `registration.enabled` event
- ❌ NEVER returned in API responses
- ❌ NEVER accepted in API requests

### Endpoint URL

- ✅ Set during initial registration
- ❌ CANNOT be changed after registration
- ❌ Immutable for security

---

## Rate Limits

- **Concurrent requests**: 1000 per namespace
- **Request timeout**: 60 seconds (blocking)
- **Payload size**: 5 MB maximum

---

## Testing

### Using AIO CLI

```bash
# Deploy application
aio app deploy

# Test action locally
aio app run -e application --no-serve

# View logs
aio app logs
```

### Using curl

```bash
# Set environment variables
export IMS_TOKEN="your-token"
export API_KEY="your-api-key"
export NAMESPACE="your-namespace"
export PACKAGE="dx-excshell-1"

# Test API
curl -X GET "https://${NAMESPACE}.adobeioruntime.net/api/v1/web/${PACKAGE}/get-brands" \
  -H "Authorization: Bearer ${IMS_TOKEN}" \
  -H "x-api-key: ${API_KEY}"
```

---

## Common Patterns

### Pagination (Future)

```javascript
// Not yet implemented, but planned:
GET /get-brands?limit=10&offset=0
```

### Filtering

```javascript
// Filter by enabled status
GET /get-brands?enabled=true

// Filter by category
GET /list-app-events?category=agency
```

### Sorting (Future)

```javascript
// Not yet implemented, but planned:
GET /get-brands?sort=createdAt&order=desc
```

---

## Troubleshooting

### 401 Unauthorized

- Check IMS token is valid and not expired
- Verify x-api-key header is correct
- For event handlers, check X-A2B-Agency-Secret header

### 400 Bad Request

- Verify all required parameters are provided
- Check request body format (JSON)
- Validate parameter types and values

### 404 Not Found

- Verify brandId or eventCode exists
- Check endpoint URL is correct

### 500 Internal Server Error

- Check application logs: `aio app logs`
- Verify App Builder state store is accessible
- Check for runtime errors in action code

---

## Additional Resources

- **Full API Documentation**: [README.md](./README.md)
- **CloudEvents Spec**: [../cursor/CLOUDEVENTS_DOCUMENTATION.md](../cursor/CLOUDEVENTS_DOCUMENTATION.md)
- **Event Naming**: `.cursor/rules/event-naming-conventions.mdc`
- **Security Guidelines**: [../SECURITY_GUIDELINES.md](../SECURITY_GUIDELINES.md)

---

**Last Updated**: October 22, 2025  
**Version**: 1.0.0

