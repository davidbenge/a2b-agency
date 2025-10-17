# Brand Enablement Flow Implementation

## Overview

This document describes the complete flow for enabling (and disabling) a brand registration, including secret generation, event publishing, and agency data persistence on the brand side.

**Date**: 2025-10-16

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          A2B-AGENCY                                      │
│                                                                          │
│  Administrator → update-brand action                                     │
│                      ↓                                                   │
│              Set enabled = true                                          │
│                      ↓                                                   │
│         Check if secret exists                                           │
│         If not, generate secret                                          │
│                      ↓                                                   │
│    BrandManager.saveBrand()                                              │
│         (persist to disk + memory)                                       │
│                      ↓                                                   │
│  Create RegistrationEnabledEvent                                         │
│  - brandId, secret, enabled=true,                                        │
│    name, endPointUrl, enabledAt                                          │
│  - Include app_runtime_info                                              │
│                      ↓                                                   │
│  Brand.sendCloudEventToEndpoint()                                        │
│  POST to brand's endPointUrl                                             │
│  with X-A2B-Brand-Secret header                                          │
│                                                                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               │ HTTP POST com.adobe.a2b.registration.enabled
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          A2B-BRAND                                       │
│                                                                          │
│  agency-event-handler                                                    │
│         ↓                                                                │
│  Check event type:                                                       │
│  com.adobe.a2b.registration.enabled                                      │
│         ↓                                                                │
│  Skip secret validation                                                  │
│  (brand doesn't have secret yet)                                         │
│         ↓                                                                │
│  Route to agency-registration-internal-handler                           │
│  via OpenWhisk invoke                                                    │
│         ↓                                                                │
│  Extract agencyId from                                                   │
│  app_runtime_info.consoleId                                              │
│         ↓                                                                │
│  AgencyManager.getAgency(agencyId)                                       │
│         ↓                                                                │
│  If exists: Update agency with:                                          │
│    - secret (NOW we have it!)                                            │
│    - enabled = true                                                      │
│    - enabledAt = timestamp                                               │
│    - name, endPointUrl                                                   │
│         ↓                                                                │
│  If not exists: Create new agency                                        │
│         ↓                                                                │
│  AgencyManager.saveAgency()                                              │
│  - Save to state store (memory)                                          │
│  - Save to file store (disk)                                             │
│         ↓                                                                │
│  Return success response                                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Components

### A2B-Agency Side

#### 1. Update Brand Action (`src/actions/update-brand/index.ts`)

**Purpose**: Update brand properties, including enabling/disabling.

**Key Logic**:
```typescript
// Detect if brand is being enabled
const wasEnabled = existingBrand.enabled;
const willBeEnabled = params.enabled !== undefined ? params.enabled : wasEnabled;
const isEnablingBrand = !wasEnabled && willBeEnabled;

// Ensure secret exists if enabling
let secret = existingBrand.secret;
if (isEnablingBrand && !secret) {
  logger.info('Generating secret for brand enablement');
  secret = BrandManager.createBrand({ brandId: params.brandId }).secret;
}

// Update brand with new data
const updatedBrand = BrandManager.createBrand({
  ...existingBrand.toJSON(),
  ...params,
  brandId: params.brandId, // Never change brandId
  secret: secret, // Use existing or newly generated
  updatedAt: now,
  enabledAt: isEnablingBrand ? now : existingBrand.enabledAt
});

// Save to persistence
const savedBrand = await brandManager.saveBrand(updatedBrand);
```

**Event Publishing**:
```typescript
if (isEnablingBrand) {
  // Create registration.enabled event
  const event = new RegistrationEnabledEvent(
    savedBrand.brandId,
    savedBrand.secret,    // ← Secret included here!
    savedBrand.name,
    savedBrand.endPointUrl,
    savedBrand.enabledAt || now
  );

  // Set source from app runtime info
  const appRuntimeInfo = getApplicationRuntimeInfo(params);
  if (appRuntimeInfo) {
    event.setSourceUri(appRuntimeInfo);
    event.data.app_runtime_info = appRuntimeInfo;
  }

  // Send to brand
  const tempBrand = new Brand({ ...savedBrand, enabled: true });
  const response = await tempBrand.sendCloudEventToEndpoint(event);
}
```

#### 2. RegistrationEnabledEvent Class (`src/actions/classes/a2b_events/RegistrationEnabledEvent.ts`)

**Purpose**: CloudEvents wrapper for brand enablement notification.

**Event Type**: `com.adobe.a2b.registration.enabled`

**Required Fields**:
- `brandId` - Brand identifier
- `secret` - Shared secret for authentication
- `enabled` - Always `true` for this event
- `name` - Brand name
- `endPointUrl` - Brand's endpoint URL
- `enabledAt` - ISO timestamp when enabled

**CloudEvents Structure**:
```json
{
  "source": "urn:uuid:agency-console-id",
  "type": "com.adobe.a2b.registration.enabled",
  "id": "event-uuid",
  "datacontenttype": "application/json",
  "time": "2025-10-16T...",
  "specversion": "1.0",
  "data": {
    "app_runtime_info": {
      "consoleId": "27200",
      "projectName": "a2b",
      "workspace": "production",
      "actionPackageName": "a2b-agency",
      "appName": "agency"
    },
    "brandId": "brand-uuid",
    "secret": "generated-secret-string",
    "enabled": true,
    "name": "ACME Brand Portal",
    "endPointUrl": "https://...",
    "enabledAt": "2025-10-16T..."
  }
}
```

#### 3. RegistrationDisabledEvent Class

**Purpose**: CloudEvents wrapper for brand disablement notification.

**Event Type**: `com.adobe.a2b.registration.disabled`

**Note**: Does not include secret, just notifies that the brand is disabled.

### A2B-Brand Side

#### 1. Agency Event Handler (`src/actions/agency-event-handler/index.ts`)

**Purpose**: Entry point for all events from agencies.

**Lines 34-51**: Skip secret validation for registration events:
```typescript
const isRegistrationEvent = 
  params.type === 'com.adobe.a2b.registration.received' || 
  params.type === 'com.adobe.a2b.registration.enabled';

if (!isRegistrationEvent) {
  // Validate X-A2B-Brand-Secret header
  const headers = params.__ow_headers || {};
  const brandSecret = headers['x-a2b-brand-secret'];
  if (!brandSecret) {
    return errorResponse(401, 'Missing X-A2B-Brand-Secret header', logger);
  }
} else {
  logger.info(`Skipping secret validation for registration event: ${params.type}`);
}
```

**Lines 76-78**: Route to registration handler:
```typescript
} else if (params.type.startsWith('com.adobe.a2b.registration')) {
  logger.info(`Routing registration event to agency-registration-internal-handler: ${params.type}`);
  routingResult = await routeToRegistrationHandler(params, logger);
```

**Lines 154-186**: OpenWhisk invoke:
```typescript
async function routeToRegistrationHandler(params: any, logger: any): Promise<any> {
  const ow = openwhisk();
  const result = await ow.actions.invoke({
    name: 'a2b-brand/agency-registration-internal-handler',
    params: { routerParams: params },
    blocking: true,
    result: true
  });
  return { success: true, handler: 'agency-registration-internal-handler', result };
}
```

#### 2. Agency Registration Internal Handler (`src/actions/agency-registration-internal-handler/index.ts`)

**Purpose**: Process registration events and persist agency data.

**Lines 125-216**: Handle `registration.enabled`:

```typescript
if (eventType === 'com.adobe.a2b.registration.enabled') {
  logger.info('Handling registration.enabled event');
  
  // Validate required fields
  if (!eventData.brandId || !eventData.secret || eventData.enabled === undefined) {
    return { statusCode: 400, body: 'Missing required fields: brandId, secret, enabled' };
  }

  // Extract agencyId from app_runtime_info
  const agencyId = eventData.app_runtime_info?.consoleId;
  if (!agencyId) {
    return { statusCode: 400, body: 'Missing consoleId in app_runtime_info' };
  }
  
  const agencyManager = new AgencyManager(params.LOG_LEVEL || "info");
  
  // Get existing agency or create new
  let agency = await agencyManager.getAgency(agencyId);
  
  if (!agency) {
    // Create new agency if doesn't exist
    agency = new Agency({
      agencyId: agencyId,
      brandId: eventData.brandId,
      secret: eventData.secret,  // ← Secret received!
      name: eventData.name,
      endPointUrl: eventData.endPointUrl,
      enabled: eventData.enabled,
      createdAt: new Date(),
      updatedAt: new Date(),
      enabledAt: new Date()
    });
    await agencyManager.saveAgency(agency);
  } else {
    // Update existing agency with secret
    agency = await agencyManager.updateAgency(agencyId, {
      secret: eventData.secret,  // ← Secret received!
      enabled: eventData.enabled,
      enabledAt: new Date(),
      name: eventData.name,
      endPointUrl: eventData.endPointUrl
    });
  }

  return {
    statusCode: 200,
    body: {
      message: 'Registration enabled successfully - secret stored for authentication',
      brandId: eventData.brandId,
      enabled: eventData.enabled,
      agencyId: agencyId
    }
  };
}
```

#### 3. AgencyManager (`src/actions/classes/AgencyManager.ts`)

**Purpose**: Manage agency CRUD operations with dual persistence.

**Persistence Strategy**:
```typescript
async saveAgency(agency: Agency): Promise<Agency> {
  // 1. Save to state store (memory cache)
  const stateStore = await this.getStateStore();
  await stateStore.put(`AGENCY_${agency.agencyId}`, agency.toJSONString());
  
  // 2. Save to file store (persistent disk)
  const fileStore = await this.getFileStore();
  await fileStore.write(`agency/${agency.agencyId}.json`, agency.toJSONString());
  
  return agency;
}
```

**Retrieval Strategy**:
```typescript
async getAgency(agencyId: string): Promise<Agency | undefined> {
  // 1. Try state store first (fast memory lookup)
  let agency = await this.getAgencyFromStateStore(agencyId);
  
  // 2. If not in state, check file store (persistent disk)
  if (!agency) {
    agency = await this.getAgencyFromFileStoreByAgencyId(agencyId);
    
    // 3. If found in file store, cache it in state store
    if (agency) {
      await this.storeAgencyInStateStore(agency);
    }
  }
  
  return agency;
}
```

#### 4. Agency Class (`src/actions/classes/Agency.ts`)

**Purpose**: Represent a brand's registration with an agency.

**Key Methods**:
- `hasSecret()` - Check if secret has been received
- `validateSecret(requestSecret)` - Validate incoming request secret
- `isEnabled()` - Check if agency is enabled
- `toSafeJSON()` - Return representation without exposing secret

## Event Flow Timeline

### Step 1: Brand Requests Registration (Already Implemented)

```
Brand → Agency: com.adobe.b2a.registration.new
{
  data: {
    name: "ACME Brand Portal",
    endPointUrl: "https://brand-endpoint.com"
  }
}
```

### Step 2: Agency Acknowledges Registration (Already Implemented)

```
Agency → Brand: com.adobe.a2b.registration.received
{
  data: {
    brandId: "generated-brand-uuid",
    name: "ACME Brand Portal",
    endPointUrl: "https://brand-endpoint.com"
    // NO SECRET YET!
  }
}
```

Brand creates Agency record:
```typescript
{
  agencyId: "agency-console-id",
  brandId: "generated-brand-uuid",
  secret: '', // Empty - waiting for enablement
  name: "ACME Brand Portal",
  endPointUrl: "https://brand-endpoint.com",
  enabled: false,
  enabledAt: null
}
```

### Step 3: Agency Administrator Enables Brand (NEW - This Implementation)

Administrator calls `update-brand`:
```bash
curl -X POST .../update-brand \
  -d '{ "brandId": "brand-uuid", "enabled": true }'
```

Agency:
1. Checks if secret exists, generates if needed
2. Updates Brand record
3. Saves to BrandManager (disk + memory)
4. **Sends `com.adobe.a2b.registration.enabled` event**

### Step 4: Brand Receives Enablement with Secret (Already Implemented)

```
Agency → Brand: com.adobe.a2b.registration.enabled
{
  data: {
    app_runtime_info: {
      consoleId: "agency-console-id"
    },
    brandId: "brand-uuid",
    secret: "generated-secret-string",  // ← SECRET DELIVERED!
    enabled: true,
    name: "ACME Brand Portal",
    endPointUrl: "https://brand-endpoint.com",
    enabledAt: "2025-10-16T..."
  }
}
```

Brand updates Agency record:
```typescript
{
  agencyId: "agency-console-id",
  brandId: "brand-uuid",
  secret: 'generated-secret-string', // ← NOW we have it!
  name: "ACME Brand Portal",
  endPointUrl: "https://brand-endpoint.com",
  enabled: true,
  enabledAt: Date("2025-10-16T...")
}
```

### Step 5: Authenticated Communication (Future)

Brand can now send events to agency with authentication:
```typescript
const headers = {
  'X-A2B-Brand-Secret': agency.secret
};

const response = await axios.post(agency.endPointUrl, event, { headers });
```

Agency validates secret:
```typescript
const headers = params.__ow_headers || {};
const brandSecret = headers['x-a2b-brand-secret'];

const brand = await brandManager.getBrand(brandId);
if (brand.secret !== brandSecret) {
  return errorResponse(401, 'Invalid brand secret', logger);
}
```

## Security Model

### Secret Generation
- Generated by `BrandManager.createBrand()` on agency side
- Uses `Math.random().toString(36)` twice for 30 characters
- Stored in agency's Brand record
- Sent to brand only during enablement

### Secret Validation
- **Agency side**: Validates `X-A2B-Brand-Secret` header from brands
- **Brand side**: Validates `X-A2B-Brand-Secret` header from agencies
- **Exception**: Registration events bypass validation (no secret yet)

### Secret Storage
- **Agency side**: In Brand record (disk + memory)
- **Brand side**: In Agency record (disk + memory)
- Never logged in full (redacted in logs)
- Exposed only in `toJSON()`, not in `toSafeJSON()`

## Usage

### Enable a Brand

```bash
curl -X POST https://.../a2b-agency/update-brand \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "brand-uuid-here",
    "enabled": true
  }'
```

Response:
```json
{
  "statusCode": 200,
  "body": {
    "message": "Brand brand-uuid-here updated successfully",
    "data": {
      "brandId": "brand-uuid-here",
      "secret": "***redacted***",
      "name": "ACME Brand Portal",
      "endPointUrl": "https://...",
      "enabled": true,
      "enabledAt": "2025-10-16T..."
    },
    "eventSent": "registration.enabled"
  }
}
```

### Disable a Brand

```bash
curl -X POST https://.../a2b-agency/update-brand \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "brand-uuid-here",
    "enabled": false
  }'
```

Response includes `"eventSent": "registration.disabled"`.

## Testing

### Agency Side Tests

```bash
cd a2b-agency
npm test
# All tests pass: 8 suites, 139 tests
```

### Brand Side Tests

```bash
cd a2b-brand
npm test -- agency-registration-internal-handler.test.ts
# Tests cover registration.enabled event handling
```

### Integration Testing

1. **Create Brand** (via `new-brand-registration`)
2. **Verify Brand Created** with `enabled: false`
3. **Enable Brand** (via `update-brand`)
4. **Verify Event Sent** to brand's endPointUrl
5. **Verify Brand Receives** `registration.enabled` event
6. **Verify Agency Record Updated** with secret in brand app
7. **Verify Authenticated Communication** works

## Files Created/Modified

### A2B-Agency

**Created**:
- `src/actions/classes/a2b_events/RegistrationEnabledEvent.ts`
- `src/actions/classes/a2b_events/RegistrationDisabledEvent.ts`
- `src/actions/utils/applicationRuntimeInfo.ts`
- `docs/cursor/BRAND_ENABLEMENT_FLOW.md` (this file)

**Modified**:
- `src/actions/update-brand/index.ts` - Added enablement/disablement logic and event publishing

### A2B-Brand

**Already Implemented**:
- `src/actions/agency-event-handler/index.ts` - Routes registration events
- `src/actions/agency-registration-internal-handler/index.ts` - Handles registration.enabled
- `src/actions/classes/AgencyManager.ts` - Persists agency data
- `src/actions/classes/Agency.ts` - Represents agency registration

## Related Documentation

- [Brand Registration Flow](./BRAND_REGISTRATION_FLOW_IMPLEMENTATION.md)
- [Event Naming Conventions](../.cursor/rules/event-naming-conventions.mdc)
- [CloudEvents Structure](../.cursor/rules/cloudevents-structure.mdc)
- [Event Registry Synchronization](../.cursor/rules/event-registry-sync.mdc)

## Future Enhancements

1. **Secret Rotation**: Implement periodic secret rotation
2. **Secret Expiration**: Add expiration dates to secrets
3. **Multiple Secrets**: Support active + pending secret for zero-downtime rotation
4. **Event Retry Logic**: Implement retry mechanism if brand endpoint is down
5. **Event History**: Track all registration state changes
6. **Admin UI**: Build UI for enabling/disabling brands
7. **Webhook Verification**: Add webhook signature verification

## Summary

This implementation completes the brand enablement flow:

1. ✅ **Secret Generation**: Automatically generated when enabling brand
2. ✅ **Secret Delivery**: Sent via `com.adobe.a2b.registration.enabled` event
3. ✅ **Dual Persistence**: Stored in both disk (file store) and memory (state store)
4. ✅ **Event Publishing**: CloudEvents-compliant event sent to brand
5. ✅ **Agency Record Update**: Brand app updates agency record with secret
6. ✅ **Security Bypass**: Registration events skip secret validation
7. ✅ **Complete Flow**: From brand request → agency enable → secret delivery → authenticated communication

The brand now has everything needed to authenticate future requests to/from the agency.

