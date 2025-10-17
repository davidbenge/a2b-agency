# Update Brand API

## Overview

Updates an existing brand. The response **excludes the secret** for security reasons. The secret **cannot be updated** via this API.

**Endpoint**: `POST /api/v1/web/a2b-agency/update-brand`

---

## Request

### Body Parameters

```json
{
  "brandId": "24316544-aacc-4494-8c96-2a354c60cf01",
  "name": "Updated Brand Name",
  "endPointUrl": "https://new-endpoint.com/webhook",
  "enabled": true,
  "logo": "data:image/svg+xml;base64,..."
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `brandId` | string (UUID) | **Yes** | The unique identifier of the brand to update |
| `name` | string | No | Updated brand name |
| `endPointUrl` | string | No | Updated webhook endpoint |
| `enabled` | boolean | No | Whether to enable or disable the brand |
| `logo` | string | No | Updated base64-encoded logo |

**Security**: If `secret` is included in the request, it will be **ignored**. The secret cannot be changed via this API.

### Example

```bash
curl -X POST \
  https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency/update-brand \
  -H 'Content-Type: application/json' \
  -d '{
    "brandId": "24316544-aacc-4494-8c96-2a354c60cf01",
    "name": "Acme Brand Inc (Updated)",
    "enabled": true
  }'
```

---

## Response

### Success (200 OK)

```json
{
  "message": "Brand 24316544-aacc-4494-8c96-2a354c60cf01 updated successfully",
  "data": {
    "brandId": "24316544-aacc-4494-8c96-2a354c60cf01",
    "name": "Acme Brand Inc (Updated)",
    "endPointUrl": "https://27200-brand2agency-benge.adobeioruntime.net/api/v1/web/a2b-brand/agency-event-handler",
    "enabled": true,
    "logo": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIi...",
    "createdAt": "2025-10-17T04:38:30.016Z",
    "updatedAt": "2025-10-17T08:22:45.678Z",
    "enabledAt": "2025-10-17T08:22:45.678Z"
  },
  "eventSent": "registration.enabled"
}
```

**Security Note**: The `secret` field is **NOT included** in the response, even if it was in the request.

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Success message |
| `data` | object | Updated brand data (without secret) |
| `eventSent` | string | CloudEvent sent (`registration.enabled`, `registration.disabled`, or `none`) |

---

## Behavior

### Enabling a Brand

When `enabled` is set to `true` for a previously disabled brand:

1. Brand status is updated to `enabled: true`
2. `enabledAt` timestamp is set
3. CloudEvent `com.adobe.a2b.registration.enabled` is sent to brand's endpoint
4. Event includes the secret (this is the ONLY time secret is delivered to brand)

**CloudEvent sent to brand**:
```json
{
  "type": "com.adobe.a2b.registration.enabled",
  "data": {
    "brandId": "24316544-aacc-4494-8c96-2a354c60cf01",
    "secret": "xCZpPrN1rhUVFPyWdRndqyGjDTGuoMJh",
    "name": "Acme Brand Inc",
    "endPointUrl": "https://...",
    "enabledAt": "2025-10-17T08:22:45.678Z"
  }
}
```

### Disabling a Brand

When `enabled` is set to `false` for a previously enabled brand:

1. Brand status is updated to `enabled: false`
2. `enabledAt` is set to `null`
3. CloudEvent `com.adobe.a2b.registration.disabled` is sent to brand's endpoint
4. Event does NOT include secret

### Other Updates

When updating other fields (name, endPointUrl, logo):
- Only the specified fields are updated
- No CloudEvents are sent
- `updatedAt` timestamp is updated

---

## Security

### Secret Protection

The secret is protected in multiple ways:

1. **Cannot be updated**: If `secret` is in request params, it is **ignored**
   ```typescript
   // Backend implementation
   const { secret: _ignoredSecret, ...safeParams } = params;
   ```

2. **Not returned in response**: Response always uses `brand.toSafeJSON()` which excludes secret

3. **Existing secret preserved**: The brand's stored secret is always used

### Why Secret Cannot Be Updated

The secret is a shared credential between agency and brand. If it could be changed by the agency:
- The brand would lose authentication
- Would require re-delivery mechanism
- Would create security vulnerabilities

**If secret needs to change**: The brand must be deleted and re-registered.

---

## Error Responses

### 400 Bad Request - Missing brandId

```json
{
  "error": "missing parameter(s) 'brandId'"
}
```

### 404 Not Found

```json
{
  "error": "Brand 24316544-aacc-4494-8c96-2a354c60cf01 not found"
}
```

### 500 Internal Server Error

```json
{
  "message": "Error updating brand",
  "error": "Database write failed"
}
```

---

## Related Documentation

- [Secret Security Pattern](../../cursor/SECRET_SECURITY_PATTERN.md) - Complete secret handling guide
- [Get Brand](../get-brand/README.md) - Retrieve brand details
- [New Brand Registration](../new-brand-registration/README.md) - Initial registration flow

---

## Examples

### Update Name Only

```bash
curl -X POST \
  https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency/update-brand \
  -H 'Content-Type: application/json' \
  -d '{
    "brandId": "24316544-aacc-4494-8c96-2a354c60cf01",
    "name": "New Brand Name"
  }'
```

### Enable Brand

```bash
curl -X POST \
  https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency/update-brand \
  -H 'Content-Type: application/json' \
  -d '{
    "brandId": "24316544-aacc-4494-8c96-2a354c60cf01",
    "enabled": true
  }'
```

Response includes `"eventSent": "registration.enabled"` and brand receives CloudEvent with secret.

### Disable Brand

```bash
curl -X POST \
  https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency/update-brand \
  -H 'Content-Type: application/json' \
  -d '{
    "brandId": "24316544-aacc-4494-8c96-2a354c60cf01",
    "enabled": false
  }'
```

Response includes `"eventSent": "registration.disabled"` and brand receives CloudEvent (without secret).

### Attempt to Change Secret (Will Be Ignored)

```bash
curl -X POST \
  https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency/update-brand \
  -H 'Content-Type: application/json' \
  -d '{
    "brandId": "24316544-aacc-4494-8c96-2a354c60cf01",
    "secret": "new-secret-attempt"
  }'
```

The `secret` parameter is ignored. The brand's existing secret remains unchanged.

