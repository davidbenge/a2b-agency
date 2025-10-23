# Get Brand API

## Overview

Retrieves a single brand by ID. The response **excludes the secret** for security reasons.

**Endpoint**: `GET /api/v1/web/a2b-agency/get-brand?brandId={uuid}`

---

## Request

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `brandId` | string (UUID) | Yes | The unique identifier of the brand |

### Example

```bash
curl "https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency/get-brand?brandId=24316544-aacc-4494-8c96-2a354c60cf01"
```

---

## Response

### Success (200 OK)

```json
{
  "message": "Brand 24316544-aacc-4494-8c96-2a354c60cf01 fetched successfully",
  "data": {
    "brandId": "24316544-aacc-4494-8c96-2a354c60cf01",
    "name": "Acme Brand Inc",
    "endPointUrl": "https://27200-brand2agency-benge.adobeioruntime.net/api/v1/web/a2b-brand/agency-event-handler",
    "enabled": true,
    "logo": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIi...",
    "createdAt": "2025-10-17T04:38:30.016Z",
    "updatedAt": "2025-10-17T04:38:30.016Z",
    "enabledAt": "2025-10-17T05:12:15.442Z"
  }
}
```

**Security Note**: The `secret` field is **NOT included** in the response. See [Secret Security Pattern](../../cursor/SECRET_SECURITY_PATTERN.md) for details.

### Error Responses

#### 400 Bad Request - Missing brandId

```json
{
  "error": "missing parameter(s) 'brandId'"
}
```

#### 500 Internal Server Error

```json
{
  "message": "Error getting brand",
  "error": "Brand not found"
}
```

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

## Related APIs

- [Get Brands](../get-brands/README.md) - List all brands
- [Update Brand](../update-brand/README.md) - Update brand details
- [New Brand Registration](../new-brand-registration/README.md) - Register a new brand

