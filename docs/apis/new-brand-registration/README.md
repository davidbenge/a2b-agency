# New Brand Registration API

## Overview

The `new-brand-registration` action is a public web action that allows brands to register with the agency. This is the entry point for the brand-to-agency registration flow.

**Endpoint**: `POST /api/v1/web/a2b-agency/new-brand-registration`

**Type**: Web Action (publicly accessible)

---

## Request

### Method
`POST`

### Headers
```
Content-Type: application/json
x-gw-ims-org-id: <IMS Organization ID>
```

### Request Body

All brand data must be wrapped in a `data` property:

```json
{
  "data": {
    "name": "Brand Name",
    "primaryContact": "Contact Person Name",
    "phoneNumber": "Phone Number",
    "endPointUrl": "https://brand-namespace.adobeioruntime.net/api/v1/web/a2b-brand/agency-event-handler",
    "app_runtime_info": {
      "actionPackageName": "a2b-brand",
      "appName": "brand",
      "consoleId": "27200",
      "projectName": "brand2agency",
      "workspace": "benge"
    }
  }
}
```

### Required Fields

| Field | Type | Description | Location |
|-------|------|-------------|----------|
| `name` | string | Brand name | `data.name` |
| `endPointUrl` | string | Brand's webhook endpoint for receiving events | `data.endPointUrl` |
| `primaryContact` | string | Primary contact person | `data.primaryContact` |
| `phoneNumber` | string | Contact phone number | `data.phoneNumber` |
| `app_runtime_info` | object | Brand's runtime information for event isolation | `data.app_runtime_info` |

### Field Details

#### `endPointUrl`
- Must be a valid HTTPS URL
- Should point to the brand's `agency-event-handler` action
- Format: `https://{namespace}.adobeioruntime.net/api/v1/web/{package}/agency-event-handler`
- This is where the agency will send CloudEvents back to the brand

#### `app_runtime_info`
- Contains parsed namespace components for runtime isolation
- Used when publishing events to ensure proper routing
- See [Runtime Info Pattern](../../cursor/RUNTIME_INFO_PATTERN.md) for details

---

## Response

### Success Response (200 OK)

The API returns ONLY a success message. Brand data (including the generated secret) is NOT returned for security reasons.

```json
{
  "message": "Brand registration processed successfully for brand id 24316544-aacc-4494-8c96-2a354c60cf01"
}
```

**Note**: The brand will receive their credentials via CloudEvent when the agency admin enables their registration.

#### What Happens After Registration

1. Brand is saved in agency's state store with:
   - Generated `brandId` (UUID)
   - Generated `secret` (32-character random string)
   - `enabled: false` (pending approval)
   - Timestamps

2. Agency publishes a `com.adobe.a2b.registration.received` event

3. Agency admin reviews the registration in the Agency UI

4. When admin enables the brand, agency sends `com.adobe.a2b.registration.enabled` event with:
   - `brandId`
   - `secret` (for brand to authenticate future events)
   - Other registration details

### Error Responses

#### 400 Bad Request - Missing Required Fields

```json
{
  "error": "missing parameter(s) 'name,endPointUrl'"
}
```

Returned when required fields are missing from the request.

#### 500 Internal Server Error - Processing Error

```json
{
  "message": "Error processing new client registration",
  "error": "Error saving brand"
}
```

Returned when the server encounters an error processing the registration.

---

## Security

### Why Secret Is Not Returned

The API intentionally **does not return** the generated brand credentials in the response for security reasons:

1. **Prevent Interception**: Credentials are not exposed in HTTP responses
2. **Secure Delivery**: Credentials are delivered via authenticated CloudEvent after admin approval
3. **Audit Trail**: Credential delivery is tied to the enablement workflow
4. **Least Privilege**: Registration submission doesn't require immediate access

### Credential Delivery Flow

```
1. Brand submits registration → No secret in response
2. Agency admin reviews and approves
3. Agency sends registration.enabled event → Contains secret
4. Brand receives and stores secret securely
5. Brand uses secret to authenticate future event submissions
```

---

## Example Usage

### cURL

```bash
curl -X POST \
  https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency/new-brand-registration \
  -H 'Content-Type: application/json' \
  -H 'x-gw-ims-org-id: YOUR_ORG_ID@AdobeOrg' \
  -d '{
    "data": {
      "name": "Acme Brand Inc",
      "primaryContact": "John Doe",
      "phoneNumber": "555-1234-5678",
      "endPointUrl": "https://27200-brand2agency-benge.adobeioruntime.net/api/v1/web/a2b-brand/agency-event-handler",
      "app_runtime_info": {
        "actionPackageName": "a2b-brand",
        "appName": "brand",
        "consoleId": "27200",
        "projectName": "brand2agency",
        "workspace": "benge"
      }
    }
  }'
```

### JavaScript (axios)

```javascript
const axios = require('axios');

const payload = {
  data: {
    name: 'Acme Brand Inc',
    primaryContact: 'John Doe',
    phoneNumber: '555-1234-5678',
    endPointUrl: 'https://27200-brand2agency-benge.adobeioruntime.net/api/v1/web/a2b-brand/agency-event-handler',
    app_runtime_info: {
      actionPackageName: 'a2b-brand',
      appName: 'brand',
      consoleId: '27200',
      projectName: 'brand2agency',
      workspace: 'benge'
    }
  }
};

try {
  const response = await axios.post(
    'https://27200-a2b-benge.adobeio-static.net/api/v1/web/a2b-agency/new-brand-registration',
    payload,
    {
      headers: {
        'Content-Type': 'application/json',
        'x-gw-ims-org-id': 'YOUR_ORG_ID@AdobeOrg'
      }
    }
  );
  
  console.log('Success:', response.data.message);
  // Output: Brand registration processed successfully for brand id ...
} catch (error) {
  console.error('Error:', error.response?.data || error.message);
}
```

---

## Related Documentation

- [Agency URL Configuration](../../cursor/AGENCY_URL_CONFIGURATION.md) - How brands configure the agency URL
- [Runtime Info Pattern](../../cursor/RUNTIME_INFO_PATTERN.md) - Understanding `app_runtime_info`
- [Brand Registration Flow](../../cursor/BRAND_REGISTRATION_FLOW_IMPLEMENTATION.md) - Complete registration workflow

---

## Sample Files

- [`request-example.json`](./request-example.json) - Sample request payload
- [`response-success.json`](./response-success.json) - Success response
- [`response-error-missing-fields.json`](./response-error-missing-fields.json) - Validation error
- [`response-error-server.json`](./response-error-server.json) - Server error

---

## Implementation Notes

### Action Configuration

The action receives `APPLICATION_RUNTIME_INFO` from its OpenWhisk configuration (not from the API call). This is used for:
- The agency's own runtime isolation
- Publishing events with the agency's runtime context

See `app.config.yaml` for the action's input configuration.

### Event Publishing

After saving the brand, the action publishes a `com.adobe.a2b.registration.received` CloudEvent to notify internal systems and trigger the approval workflow.

### State Management

Brand data is persisted using the `BrandManager` class, which stores brands in Adobe I/O State with the prefix defined in `BRAND_STATE_PREFIX`.

---

## Changelog

**2025-10-17**: Removed brand data (including secret) from success response for security. Secret is now delivered only via CloudEvent after admin approval.

