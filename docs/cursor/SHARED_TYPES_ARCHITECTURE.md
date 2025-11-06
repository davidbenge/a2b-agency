# Shared Types Architecture

## Overview

This document describes the shared TypeScript type system that enables type-safe code sharing across:
- **Backend** OpenWhisk actions (Node.js environment)
- **Frontend** React application (Browser environment)
- **Both projects**: a2b-agency and a2b-brand

## Problem Statement

Previously, types were scattered across multiple locations:
- `src/actions/types/index.ts` - Backend-only types
- Frontend importing from `src/actions/` (❌ violates architectural boundaries)
- No consistent API response types
- Duplicate type definitions between projects

**Key Issues:**
1. Frontend importing Node-specific modules (axios, cloudevents, etc.)
2. Type inconsistencies between agency and brand projects
3. No shared API contract definitions
4. Date serialization issues (Date objects vs. ISO strings)

## Solution Architecture

### Directory Structure

```
src/
├── actions/
│   └── types/
│       └── index.ts          # Backend-only types + re-exports shared types
├── shared/
│   ├── constants.ts           # Shared constants (EventCategory enum)
│   ├── types/
│   │   ├── index.ts          # Main export file
│   │   ├── brand.ts          # Brand-related types (IBrand, etc.)
│   │   ├── events.ts         # Event types (IEventBase, IA2bEventData, etc.)
│   │   ├── api.ts            # API response types
│   │   └── runtime.ts        # Runtime environment types
│   └── classes/
│       ├── AppEventRegistry.ts      # Shared between projects
│       └── ProductEventRegistry.ts  # Shared between projects
└── dx-excshell-1/
    └── web-src/
        └── src/
            └── (imports from ../../../../../shared/types)
```

### Type Categories

#### 1. **Brand Types** (`src/shared/types/brand.ts`)

**Core Interface:**
```typescript
export interface IBrand {
    brandId: string;
    secret?: string;                    // Optional for security
    name: string;
    endPointUrl: string;
    enabled: boolean;
    logo?: string;
    createdAt: Date | string;           // Supports both formats
    updatedAt: Date | string;
    enabledAt: Date | string | null;
}
```

**Additional Types:**
- `IBrandEventPostResponse` - Response from brand webhook endpoints
- `IBrandCreateData` - Data for creating new brands
- `IBrandUpdateData` - Data for updating brands
- `IBrandListItem` - Simplified brand data for lists

**Usage:**
- ✅ Backend: Full access, normalizes string dates to Date objects
- ✅ Frontend: Read-only access, handles both Date and string formats
- ✅ API: Serializes to JSON with ISO string dates

#### 2. **Event Types** (`src/shared/types/events.ts`)

**Core Interfaces:**
```typescript
export interface IValidationResult {
    valid: boolean;
    message?: string;
    missing?: string[];
}

export interface IEventBase {
    source: string;
    type: string;
    datacontenttype: string;
    data: any;
    id: string;
}

export interface IA2bEventData extends IEventBase {
    type: `com.adobe.a2b.${string}`;    // Template literal type
    data: {
        brandId?: string;
        app_runtime_info?: {...};
        agency_identification?: {...};
        [key: string]: any;
    };
}

export interface IB2aEventData extends IEventBase {
    type: `com.adobe.b2a.${string}`;
    data: {
        brandId?: string;
        [key: string]: any;
    };
}
```

**Additional Types:**
- `IEventMetadata` - Event registry metadata
- `IEventHistoryEntry` - Event tracking/audit logs

**Usage:**
- ✅ Backend: Creates actual CloudEvent instances
- ✅ Frontend: Displays event metadata, validates event structures
- ✅ API: Returns event information for UI display

#### 3. **API Response Types** (`src/shared/types/api.ts`)

**Standard Response Format:**
```typescript
export interface ApiSuccessResponse<T = any> {
    statusCode: number;
    body: {
        success: true;
        message: string;
        data: T;
        timestamp?: string;
    };
}

export interface ApiErrorResponse {
    statusCode: number;
    body: {
        success: false;
        error: string;
        details?: any;
        timestamp?: string;
    };
}
```

**Specific API Responses:**
- `GetBrandsResponse` - GET /get-brands
- `UpdateBrandResponse` - POST /update-brand
- `DeleteBrandResponse` - DELETE /delete-brand
- `ListEventsResponse` - GET /list-events
- `ProductEventHandlerResponse` - POST /adobe-product-event-handler

**Benefits:**
- ✅ Type-safe API calls in frontend
- ✅ Consistent response structures
- ✅ Better error handling
- ✅ Auto-complete in IDE

#### 4. **Runtime Types** (`src/shared/types/runtime.ts`)

**Core Interfaces:**
```typescript
export interface IApplicationRuntimeInfo {
    consoleId: string;
    projectName: string;
    workspace: string;
    actionPackageName: string;
    appName: string;
}

export interface IAgencyIdentification {
    agency_id: string;
    org_id: string;
}

export interface ILogger {
    info(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    debug?(message: string, ...args: any[]): void;
}
```

**Usage:**
- ✅ Backend: Full runtime context from App Builder
- ✅ Frontend: Display environment info, debug context
- ✅ Logging: Consistent logger interface for both environments

### Backend-Only Types

These remain in `src/actions/types/index.ts` because they require Node.js modules:

```typescript
// Requires 'cloudevents' package (Node-only)
export interface Ia2bEvent {
    toCloudEvent(): CloudEvent;    // CloudEvent from cloudevents package
    // ...
}

// Security-sensitive (never expose to frontend)
export interface IS2SAuthenticationCredentials {
    clientId: string;
    clientSecret: string;
    scopes: string;
    orgId: string;
}

// Node-specific event handlers
export interface Ia2bEventHandler {
    logger: any;
    handleEvent(event: any): Promise<any>;
}
```

## Import Patterns

### ✅ Correct Imports

**Backend Actions:**
```typescript
// Re-exports shared types + backend-only types
import { IBrand, Ia2bEvent, IS2SAuthenticationCredentials } from '../types';
```

**Frontend Components:**
```typescript
// Direct import from shared types
import { IBrand, ApiResponse, GetBrandsResponse } from '../../../../../shared/types';
```

**Shared Classes (Backend):**
```typescript
// Import from shared types for cross-project compatibility
import { IBrand, IEventMetadata } from '../../shared/types';
```

### ❌ Incorrect Imports

**Frontend importing from actions:**
```typescript
// ❌ BAD - Violates architecture boundaries
import { Brand } from '../../../../../actions/classes/Brand';
import { IBrand } from '../../../../../actions/types';

// ✅ GOOD - Use shared types
import { IBrand } from '../../../../../shared/types';
```

**Backend importing cloudevents in shared code:**
```typescript
// ❌ BAD - Breaks frontend compatibility
import { CloudEvent } from 'cloudevents';  // Node-only package

// ✅ GOOD - Use shared event interfaces
import { IEventBase, IA2bEventData } from '../../shared/types';
```

## Date Handling Strategy

### Problem

JSON serialization converts Date objects to ISO strings, but TypeScript can't track this at compile time.

### Solution

**Shared Types Support Both Formats:**
```typescript
export interface IBrand {
    createdAt: Date | string;
    updatedAt: Date | string;
    enabledAt: Date | string | null;
}
```

**Backend Brand Class Normalizes to Date:**
```typescript
export class Brand implements IBrand {
    readonly createdAt: Date;  // Always Date in backend
    
    constructor(params: Partial<IBrand>) {
        // Normalize string to Date
        this.createdAt = params.createdAt 
            ? (typeof params.createdAt === 'string' 
                ? new Date(params.createdAt) 
                : params.createdAt)
            : new Date();
    }
}
```

**Frontend Handles Both:**
```typescript
function formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
}
```

## Synchronization Between Projects

### Critical Rule

**The following files MUST be identical in both a2b-agency and a2b-brand:**

1. `src/shared/types/brand.ts`
2. `src/shared/types/events.ts`
3. `src/shared/types/api.ts`
4. `src/shared/types/runtime.ts`
5. `src/shared/types/index.ts`
6. `src/shared/constants.ts`
7. `src/shared/classes/AppEventRegistry.ts`
8. `src/shared/classes/ProductEventRegistry.ts`

### Sync Script

**Usage:**
```bash
# Copy FROM a2b-agency TO a2b-brand
./sync-shared-types.sh agency

# Copy FROM a2b-brand TO a2b-agency
./sync-shared-types.sh brand
```

**Workflow:**
1. Make changes in one project (e.g., a2b-agency)
2. Run tests: `npm test`
3. Sync to other project: `./sync-shared-types.sh agency`
4. cd to other project: `cd ../a2b-brand`
5. Run tests: `npm test`
6. Commit to BOTH projects
7. Create PRs for BOTH projects

### Why Synchronization Matters

- ❌ **Out of Sync**: Agency emits event with field `brandId`, Brand expects `brand_id` → Runtime errors
- ✅ **In Sync**: Both use same `IBrand` interface → Compile-time safety

## Backward Compatibility

### For Existing Code

All existing imports continue to work:

```typescript
// Old import (still works)
import { IBrand } from '../types';

// New import (also works, same type)
import { IBrand } from '../../shared/types';
```

**Why:** `src/actions/types/index.ts` re-exports all shared types:
```typescript
export {
    IBrand,
    IValidationResult,
    // ... all shared types
} from '../../shared/types';
```

### Migration Path

1. ✅ Shared types created in `src/shared/types/`
2. ✅ Actions types re-export shared types
3. ✅ Existing backend code unchanged (imports still work)
4. ✅ Frontend updated to import from `shared/types`
5. ✅ Tests pass without modification
6. Future: Gradually update backend imports to use `shared/types` directly

## Benefits

### Type Safety
- ✅ Compile-time validation across frontend/backend
- ✅ Auto-complete in IDE for all layers
- ✅ Refactoring safety (rename propagates everywhere)

### Code Quality
- ✅ Single source of truth for API contracts
- ✅ No duplicate type definitions
- ✅ Consistent naming conventions

### Developer Experience
- ✅ Clear architectural boundaries
- ✅ Easy to find type definitions
- ✅ Better error messages

### Maintainability
- ✅ Changes in one place
- ✅ Synchronized between projects
- ✅ Documented and enforced patterns

## Best Practices

### Adding New Shared Types

**Checklist:**
1. ✅ Determine if type is truly shared (used by frontend AND backend)
2. ✅ Add to appropriate file (`brand.ts`, `events.ts`, `api.ts`, `runtime.ts`)
3. ✅ Export from `src/shared/types/index.ts`
4. ✅ Add to `src/actions/types/index.ts` re-exports
5. ✅ Run tests in current project
6. ✅ Sync to other project
7. ✅ Run tests in other project
8. ✅ Commit to BOTH projects

### Type Design Guidelines

**DO:**
- ✅ Support both `Date` and `string` for timestamps
- ✅ Use optional fields (`?`) for API responses that exclude sensitive data
- ✅ Document with JSDoc comments
- ✅ Use template literal types for event codes (`com.adobe.a2b.${string}`)
- ✅ Provide specific response types for each API endpoint

**DON'T:**
- ❌ Import Node-only modules in shared types
- ❌ Import browser-only APIs in shared types
- ❌ Use `any` without a good reason
- ❌ Add methods or business logic to shared interfaces
- ❌ Hardcode absolute paths or environment-specific values

## Troubleshooting

### "Cannot find module 'cloudevents'"

**Problem:** Frontend trying to import backend-only type
**Solution:** Import from `shared/types` instead of `actions/types`

### "Property 'secret' does not exist on type 'IBrand'"

**Problem:** `secret` is optional in `IBrand` but required in your code
**Solution:** Check for undefined or use type guard:
```typescript
if (brand.secret) {
    // Safe to use brand.secret here
}
```

### "Type 'string' is not assignable to type 'Date'"

**Problem:** Date normalization issue
**Solution:** Use type guard or normalize in constructor:
```typescript
const dateObj = typeof date === 'string' ? new Date(date) : date;
```

### Tests Fail After Sync

**Problem:** Types out of sync between projects
**Solution:**
1. Verify all files synced correctly
2. Check for project-specific customizations
3. Run `npm test` in both projects
4. Check git diff to see what changed

## Related Documentation

- [Event Registry Implementation](./EVENT_REGISTRY_IMPLEMENTATION.md)
- [Event Manager Refactoring](./EVENT_MANAGER_REFACTORING.md)
- [Event Registry Synchronization Rule](../RULES.md#event-registry-synchronization-rule)

## Changelog

**2025-10-18**: Initial shared types architecture implemented
- Created `brand.ts`, `events.ts`, `api.ts`, `runtime.ts`
- Updated frontend to use shared types
- Created sync script
- All tests passing (186/186)

---

**Maintainers**: Keep this document updated when adding new shared types or changing the architecture.

