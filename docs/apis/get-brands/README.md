# Get Brands API

## Overview

Retrieves all brands. The response **excludes secrets** for security reasons.

**Endpoint**: `GET /api/v1/web/a2b-agency/get-brands`

---

## Request

### Example

```bash
curl "https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency/get-brands"
```

---

## Response

### Success (200 OK)

```json
{
  "message": "3 brands fetched successfully",
  "data": [
    {
      "brandId": "24316544-aacc-4494-8c96-2a354c60cf01",
      "name": "Acme Brand Inc",
      "endPointUrl": "https://27200-brand2agency-benge.adobeioruntime.net/api/v1/web/a2b-brand/agency-event-handler",
      "enabled": true,
      "logo": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIi...",
      "createdAt": "2025-10-17T04:38:30.016Z",
      "updatedAt": "2025-10-17T04:38:30.016Z",
      "enabledAt": "2025-10-17T05:12:15.442Z"
    },
    {
      "brandId": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
      "name": "Beta Brand Co",
      "endPointUrl": "https://12345-beta-prod.adobeioruntime.net/api/v1/web/a2b-brand/agency-event-handler",
      "enabled": false,
      "createdAt": "2025-10-16T10:20:30.000Z",
      "updatedAt": "2025-10-16T10:20:30.000Z",
      "enabledAt": null
    }
  ]
}
```

**Security Note**: The `secret` field is **NOT included** for any brand in the response. See [Secret Security Pattern](../../cursor/SECRET_SECURITY_PATTERN.md) for details.

### Error Response

#### 500 Internal Server Error

```json
{
  "message": "Error getting brands",
  "error": "Database connection failed"
}
```

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `brandId` | string (UUID) | Unique identifier for the brand |
| `name` | string | Brand name |
| `endPointUrl` | string | Brand's webhook endpoint for receiving events |
| `enabled` | boolean | Whether the brand is currently enabled |
| `logo` | string | Base64-encoded brand logo (optional) |
| `createdAt` | string (ISO 8601) | Timestamp of brand creation |
| `updatedAt` | string (ISO 8601) | Timestamp of last update |
| `enabledAt` | string (ISO 8601) or null | Timestamp of when brand was enabled |

**Note**: The `secret` field is **NEVER** included in responses.

---

## Security

The brand `secret` is never returned in API responses. It is only:
1. Generated during brand registration
2. Delivered once via CloudEvent when brand is enabled
3. Used in authentication headers for event delivery

For more details, see:
- [Secret Security Pattern](../../cursor/SECRET_SECURITY_PATTERN.md)
- [New Brand Registration API](../new-brand-registration/README.md)

---

## Use Cases

### Agency UI - Brand Manager

The frontend Brand Manager uses this API to:
- Display list of all brands
- Show brand status (enabled/disabled)
- Provide edit/view actions
- Filter and search brands

**Important**: The UI never displays or requires the secret.

### Integration - Sync All Brands

External systems can use this API to:
- Get current list of all brands
- Monitor brand enablement status
- Sync brand data to external systems

**Important**: External systems should never need the secret for read operations.

---

## Related APIs

- [Get Brand](../get-brand/README.md) - Get a single brand
- [Update Brand](../update-brand/README.md) - Update brand details
- [New Brand Registration](../new-brand-registration/README.md) - Register a new brand

