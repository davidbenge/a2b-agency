# Secure Agency Registration Architecture

**Date**: October 18, 2025  
**Status**: 📋 **PLANNED** - Implementation in progress  
**Impact**: Security Enhancement + Architectural Symmetry

## Problem Statement

### Current Architecture (Insecure)

**a2b-brand frontend:**
```typescript
// ❌ Agency endpoint URL exposed in browser
const agencyEndpoint = "https://27200-a2b-benge-agency.adobeio-static.net/api/v1/web/a2b-agency/register-brand";

// ❌ Registration data visible in browser network tab
fetch(agencyEndpoint, {
    method: 'POST',
    body: JSON.stringify({
        name: "My Brand",
        endPointUrl: "https://my-brand.com/webhook",
        secret: "my-secret-key"  // ❌ Secret visible in browser!
    })
});
```

**Security Issues:**
1. ❌ Agency endpoint URL visible in browser source code
2. ❌ Registration payload visible in browser DevTools
3. ❌ Subject to client-side tampering
4. ❌ CORS vulnerabilities
5. ❌ No server-side validation before sending to agency

### Asymmetric Architecture

**Current State:**
- **a2b-agency**: Stores multiple `Brand` objects with `endPointUrl` for callbacks
- **a2b-brand**: Stores single agency reference WITHOUT `endPointUrl`

**Problem**: a2b-brand can't send events back to agency (no stored endpoint)

## Proposed Solution

### 1. Server-to-Server Registration Flow

```
┌─────────────────┐         ┌──────────────────────────┐         ┌─────────────────┐
│  Brand Frontend │         │  a2b-brand (OpenWhisk)   │         │   a2b-agency    │
│   (Browser)     │         │                          │         │  (OpenWhisk)    │
└────────┬────────┘         └──────────┬───────────────┘         └────────┬────────┘
         │                              │                                   │
         │  1. Register Agency          │                                   │
         │  (name, no secrets)          │                                   │
         ├─────────────────────────────>│                                   │
         │                              │                                   │
         │                              │  2. Build callback URL from       │
         │                              │     ApplicationRuntimeInfo        │
         │                              │                                   │
         │                              │  3. POST to Agency                │
         │                              │  /register-brand                  │
         │                              │  (includes callback endpoint)     │
         │                              ├──────────────────────────────────>│
         │                              │                                   │
         │                              │  4. Agency validates & stores     │
         │                              │     Brand with callback URL       │
         │                              │                                   │
         │                              │  5. Send registration.received    │
         │                              │<──────────────────────────────────┤
         │                              │                                   │
         │                              │  6. Send registration.enabled     │
         │                              │     (includes agency endpoint)    │
         │                              │<──────────────────────────────────┤
         │                              │                                   │
         │                              │  7. Store Agency with             │
         │                              │     endPointUrl for callbacks     │
         │                              │                                   │
         │  8. Success response         │                                   │
         │<─────────────────────────────┤                                   │
         │                              │                                   │
```

### 2. Symmetric Data Models

**a2b-agency stores Brands:**
```typescript
interface IBrand {
    brandId: string;
    secret: string;
    name: string;
    endPointUrl: string;  // ✅ For sending events TO brand
    enabled: boolean;
    // ...
}
```

**a2b-brand stores Agencies (NEW):**
```typescript
interface IAgency {
    agencyId: string;
    secret: string;
    name: string;
    endPointUrl: string;  // ✅ For sending events TO agency
    enabled: boolean;
    // ... (mirror of IBrand)
}
```

## Implementation Plan

### Phase 1: Shared Types (Both Projects)

**File**: `src/shared/types/agency.ts` (NEW)

```typescript
/**
 * Agency interface (mirror of IBrand for a2b-brand side)
 */
export interface IAgency {
    agencyId: string;
    secret?: string;                    // Optional for API security
    name: string;
    endPointUrl: string;                // Agency callback endpoint
    enabled: boolean;
    logo?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    enabledAt: Date | string | null;
}

export interface IAgencyCreateData {
    name: string;
    endPointUrl: string;
    secret: string;
    logo?: string;
}

export interface IAgencyUpdateData {
    name?: string;
    endPointUrl?: string;
    secret?: string;
    enabled?: boolean;
    logo?: string;
}
```

**Update**: `src/shared/types/index.ts`
```typescript
// Agency types (for a2b-brand)
export * from './agency';
```

### Phase 2: ApplicationRuntimeInfo Helper

**File**: `src/actions/utils/endpointBuilder.ts` (NEW in both projects)

```typescript
import { IApplicationRuntimeInfo } from '../../shared/types';

/**
 * Build the public endpoint URL for this application
 * @param runtimeInfo - Application runtime information
 * @param actionPath - Optional action path (e.g., '/webhook')
 * @returns Full public endpoint URL
 */
export function buildEndpointUrl(
    runtimeInfo: IApplicationRuntimeInfo,
    actionPath: string = ''
): string {
    const { consoleId, projectName, workspace, actionPackageName, appName } = runtimeInfo;
    
    // Adobe App Builder URL pattern:
    // https://{consoleId}-{projectName}-{workspace}-{appName}.adobeio-static.net/api/v1/web/{actionPackageName}{actionPath}
    
    const baseUrl = `https://${consoleId}-${projectName}-${workspace}-${appName}.adobeio-static.net`;
    const apiPath = `/api/v1/web/${actionPackageName}${actionPath}`;
    
    return `${baseUrl}${apiPath}`;
}

/**
 * Build webhook endpoint URL for receiving events
 */
export function buildWebhookEndpoint(runtimeInfo: IApplicationRuntimeInfo): string {
    return buildEndpointUrl(runtimeInfo, '/webhook');
}

/**
 * Build registration endpoint URL
 */
export function buildRegistrationEndpoint(runtimeInfo: IApplicationRuntimeInfo): string {
    return buildEndpointUrl(runtimeInfo, '/register-brand');
}
```

### Phase 3: Update Agency Class (a2b-brand)

**File**: `src/actions/classes/Agency.ts` (a2b-brand)

```typescript
import { IAgency } from '../../shared/types';
import axios from 'axios';

export class Agency implements IAgency {
    readonly agencyId: string;
    readonly secret: string;
    readonly name: string;
    readonly endPointUrl: string;  // NEW
    readonly enabled: boolean;
    readonly logo?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly enabledAt: Date | null;

    constructor(params: Partial<IAgency> & { agencyId: string; name: string; endPointUrl: string }) {
        // Validate required fields
        if (!params.agencyId) throw new Error('agencyId is required');
        if (!params.name) throw new Error('name is required');
        if (!params.endPointUrl) throw new Error('endPointUrl is required');

        this.agencyId = params.agencyId;
        this.secret = params.secret || '';
        this.name = params.name;
        this.endPointUrl = params.endPointUrl;  // NEW
        this.enabled = params.enabled ?? false;
        this.logo = params.logo;
        
        // Normalize Date | string to Date
        this.createdAt = params.createdAt 
            ? (typeof params.createdAt === 'string' ? new Date(params.createdAt) : params.createdAt)
            : new Date();
        this.updatedAt = params.updatedAt 
            ? (typeof params.updatedAt === 'string' ? new Date(params.updatedAt) : params.updatedAt)
            : new Date();
        this.enabledAt = params.enabledAt
            ? (typeof params.enabledAt === 'string' ? new Date(params.enabledAt) : params.enabledAt)
            : null;
    }

    /**
     * Send a B2A event to the agency's endpoint
     * Similar to Brand.sendCloudEventToEndpoint on a2b-agency side
     */
    async sendB2aEventToEndpoint(event: any): Promise<any> {
        // Implementation similar to Brand.sendCloudEventToEndpoint
        const headers: any = {
            'Content-Type': 'application/cloudevents+json'
        };
        
        if (this.secret) {
            headers['X-Brand-Secret'] = this.secret;  // Or X-Agency-Secret for symmetry
        }

        const response = await axios.post(
            this.endPointUrl,
            event.toJSON(),
            { headers }
        );

        return response.data;
    }
}
```

### Phase 4: New Registration Action (a2b-brand)

**File**: `src/actions/new-agency-registration/index.ts` (NEW in a2b-brand)

```typescript
import { ApplicationRuntimeInfo } from '../classes/ApplicationRuntimeInfo';
import { buildWebhookEndpoint, buildRegistrationEndpoint } from '../utils/endpointBuilder';
import axios from 'axios';

/**
 * Secure agency registration action for a2b-brand
 * 
 * This action handles brand registration with an agency server-to-server,
 * keeping all sensitive data within Adobe data center.
 * 
 * Frontend only provides: name, agencyRegistrationUrl (from config)
 * Action builds: callback endpoints from ApplicationRuntimeInfo
 * Action sends: registration request to agency
 */
async function main(params: any) {
    const logger = require('@adobe/aio-lib-core-logging')('new-agency-registration', { level: params.LOG_LEVEL || 'info' });

    try {
        // 1. Validate input
        if (!params.name) {
            return {
                statusCode: 400,
                body: { error: 'Brand name is required' }
            };
        }

        if (!params.AGENCY_REGISTRATION_URL) {
            return {
                statusCode: 500,
                body: { error: 'Agency registration URL not configured' }
            };
        }

        // 2. Get runtime info and build callback endpoints
        const runtimeInfo = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(params);
        
        const webhookEndpoint = buildWebhookEndpoint(runtimeInfo);
        
        logger.info(`Building registration request with callback endpoint: ${webhookEndpoint}`);

        // 3. Prepare registration payload
        const registrationPayload = {
            name: params.name,
            endPointUrl: webhookEndpoint,
            // Secret will be generated and returned by agency
            logo: params.logo  // optional
        };

        // 4. Send registration to agency (server-to-server)
        logger.info(`Sending registration to agency: ${params.AGENCY_REGISTRATION_URL}`);
        
        const response = await axios.post(
            params.AGENCY_REGISTRATION_URL,
            registrationPayload,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000  // 10 second timeout
            }
        );

        logger.info('Registration successful', { statusCode: response.status });

        // 5. Return success to frontend (without exposing secrets)
        return {
            statusCode: 200,
            body: {
                message: 'Registration request sent successfully',
                status: 'pending',  // Will be updated when registration.enabled event arrives
                data: {
                    name: params.name,
                    registeredAt: new Date().toISOString()
                }
            }
        };

    } catch (error: any) {
        logger.error('Registration failed', error);

        return {
            statusCode: error.response?.status || 500,
            body: {
                error: 'Failed to register with agency',
                message: error.message,
                details: error.response?.data
            }
        };
    }
}

exports.main = main;
```

### Phase 5: Update app.config.yaml (a2b-brand)

```yaml
application:
  actions: actions
  web: web-src
  runtimeManifest:
    packages:
      a2b-brand:
        license: Apache-2.0
        actions:
          # NEW ACTION
          new-agency-registration:
            function: actions/new-agency-registration/index.js
            web: 'yes'
            runtime: 'nodejs:22'
            inputs:
              LOG_LEVEL: $LOG_LEVEL
              APPLICATION_RUNTIME_INFO: $APPLICATION_RUNTIME_INFO
              AGENCY_ID: $AGENCY_ID
              ORG_ID: $ORG_ID
              AGENCY_REGISTRATION_URL: $AGENCY_REGISTRATION_URL  # NEW ENV VAR
            annotations:
              require-adobe-auth: true
              final: true
```

### Phase 6: Update Registration Event Handler (a2b-brand)

**File**: Event handler for `com.adobe.a2b.registration.enabled`

```typescript
// When registration.enabled event arrives, store Agency with endPointUrl

async function handleRegistrationEnabled(event: any) {
    const { agencyId, name, endPointUrl, secret, enabled } = event.data;
    
    // Create/update Agency with endPointUrl
    const agency = new Agency({
        agencyId,
        name,
        endPointUrl,  // NEW - from event data
        secret,
        enabled,
        createdAt: new Date(),
        updatedAt: new Date(),
        enabledAt: enabled ? new Date() : null
    });

    // Save to storage
    await agencyManager.saveAgency(agency);
    
    logger.info(`Agency registered with callback endpoint: ${endPointUrl}`);
}
```

### Phase 7: Update Registration Events (a2b-agency)

**Update event data to include agency endpoint URL:**

**File**: `src/actions/update-brand/index.ts` (a2b-agency)

```typescript
// When enabling a brand, include agency endpoint in event

const runtimeInfo = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(params);
const agencyEndpoint = buildWebhookEndpoint(runtimeInfo);

const eventData = {
    brandId: savedBrand.brandId,
    enabled: true,
    name: savedBrand.name,
    agencyEndpoint: agencyEndpoint,  // NEW - agency's webhook endpoint
    // ... other fields
};

await eventManager.processEvent('com.adobe.a2b.registration.enabled', savedBrand, eventData);
```

## Security Benefits

### Before (Current)
```
❌ Agency endpoint exposed in browser
❌ Registration data visible in DevTools
❌ Secrets potentially logged client-side
❌ Subject to CSRF, XSS attacks
❌ CORS configuration required
```

### After (Proposed)
```
✅ All URLs built server-side from ApplicationRuntimeInfo
✅ No secrets in browser
✅ Pure server-to-server communication
✅ Adobe data center to Adobe data center
✅ No CORS issues
✅ Full audit trail in OpenWhisk logs
```

## Architectural Symmetry

### Before
```
a2b-agency:
  - Stores: Multiple Brands with endPointUrl
  - Can send: Events TO brands
  
a2b-brand:
  - Stores: Single Agency reference (no endPointUrl)
  - Cannot send: Events TO agency (no stored endpoint)
```

### After
```
a2b-agency:
  - Stores: Multiple Brands with endPointUrl
  - Can send: Events TO brands
  
a2b-brand:
  - Stores: Multiple Agencies with endPointUrl  ✅
  - Can send: Events TO agencies  ✅
```

**Future Benefit**: a2b-brand could theoretically work with multiple agencies!

## Testing Strategy

1. **Unit Tests**: `src/actions/test/new-agency-registration.test.ts`
2. **Integration Tests**: Full registration flow
3. **Security Tests**: Verify no secrets in responses
4. **Endpoint Builder Tests**: `src/actions/test/endpointBuilder.test.ts`

## Migration Path

1. ✅ Create shared `IAgency` type
2. ✅ Create `endpointBuilder` utility
3. ✅ Update `Agency` class in a2b-brand
4. ✅ Create `new-agency-registration` action
5. ✅ Update event handlers to store `endPointUrl`
6. ✅ Update a2b-agency to include agency endpoint in events
7. ✅ Update a2b-brand frontend to use new action
8. ✅ Test full flow
9. ✅ Deploy to production

## Documentation Updates

- Event body examples with `agencyEndpoint` field
- Frontend API documentation for new action
- Security architecture documentation
- Deployment guide updates

## Backward Compatibility

**Breaking Change**: Yes, this changes the registration flow.

**Migration Strategy**:
1. Deploy new actions to both projects
2. Update frontend to use new action
3. Redeploy both projects
4. Re-register existing brands (optional, or handle in migration)

## Success Criteria

- ✅ No agency endpoints visible in browser
- ✅ No secrets in browser network traffic
- ✅ All communication server-to-server
- ✅ Agency stored with `endPointUrl` in a2b-brand
- ✅ Brand stored with callback URL in a2b-agency
- ✅ Full event round-trip working
- ✅ All tests passing

---

**Status**: Ready for implementation
**Next Step**: Begin Phase 1 (Create shared types)

