# PR: Secure Brand Registration with IMS Org Tracking & Event System Modernization

## 🎯 Overview

This PR implements a comprehensive security and architecture upgrade across the A2B (Agency-to-Brand) system, introducing secure brand registration flows, IMS organization tracking, event system modernization, and enhanced security validation.

## 🔗 Related Projects

This is a **coordinated release** across two repositories:
- **a2b-agency** (this PR)
- **a2b-brand** (companion PR)

Both PRs must be merged and deployed together for the system to function correctly.

---

## 📋 Summary of Changes

### 🔐 Security Enhancements

#### 1. Brand Event Handler Secret Validation
- **Added**: Secret validation for all incoming brand events
- **File**: `src/actions/brand-event-handler/index.ts`
- **Validates**: `X-A2B-Agency-Secret` header for non-registration events
- **Extracts**: Brand ID from `app_runtime_info.consoleId`
- **Returns**: 401 for missing/invalid secrets
- **Exception**: Skips validation for `com.adobe.b2a.registration.*` events (brand doesn't have secret yet)

```typescript
// New security flow
const isBrandRegistrationEvent = params.type?.startsWith('com.adobe.b2a.registration.');
if (!isBrandRegistrationEvent) {
  const brandSecret = headers['x-a2b-agency-secret'];
  if (!brandSecret) {
    return errorResponse(401, 'Missing X-A2B-Agency-Secret header', logger);
  }
  
  const brand = await brandManager.getBrand(brandId);
  if (!brand.validateSecret(brandSecret)) {
    return errorResponse(401, 'Invalid brand secret', logger);
  }
}
```

#### 2. Brand.validateSecret() Method
- **Added**: Simple secret validation method to Brand class
- **File**: `src/actions/classes/Brand.ts`
- **Purpose**: Secure string comparison for brand authentication

### 🆕 New Features

#### 1. IMS Organization Tracking

**Type System Updates**
- **File**: `src/shared/types/brand.ts`
- **Added fields**:
  - `imsOrgName?: string` - IMS Organization Name
  - `imsOrgId?: string` - IMS Organization ID
- **Updated interfaces**: `IBrand`, `IBrandCreateData`, `IBrandUpdateData`, `IBrandListItem`

**Brand Class Updates**
- **File**: `src/actions/classes/Brand.ts`
- **Added properties**: `imsOrgName`, `imsOrgId`
- **Updated methods**: `toJSON()`, `toSafeJSON()` include new fields

**Registration Flow**
- **File**: `src/actions/new-brand-registration/index.ts`
- **Accepts**: `imsOrgName` and `imsOrgId` from registration payload
- **Logs**: IMS org fields when creating brand
- **Stores**: Automatically persists to brand records

**UI Display**
- **File**: `src/dx-excshell-1/web-src/src/components/layout/BrandManagerView.tsx`
  - **Added**: "IMS Org" column in table
  - **Shows**: Organization name with tooltip displaying both name and ID
  - **Responsive**: Uses `minWidth` for flexible column widths

- **File**: `src/dx-excshell-1/web-src/src/components/layout/BrandForm.tsx`
  - **Added**: IMS Organization and Org ID display in detail view

#### 2. Product Events API

**New Endpoint**: `list-product-events`
- **File**: `src/actions/list-product-events/index.ts`
- **Purpose**: Query product event definitions from ProductEventRegistry
- **Filters**: By category, event code
- **Returns**: Event metadata, handler info, blocking status

**Documentation**
- **Location**: `docs/apis/list-product-events/`
- **Includes**: 
  - API usage guide
  - JSON response examples
  - Error scenarios
  - Filter examples

**Tests**
- **File**: `src/actions/test/list-product-events.test.ts`
- **Coverage**: All query patterns, error cases, category filters

### 🏗️ Architecture Improvements

#### 1. ApplicationRuntimeInfo Helper Methods

**New Methods Added**
- **Files**: `src/actions/classes/ApplicationRuntimeInfo.ts`

```typescript
// Build static asset URL
buildEndpointUrl(): string {
  return `https://${this.consoleId}-${this.projectName}-${this.workspace}.adobeio-static.net`;
}

// Build OpenWhisk action URL
buildActionUrl(actionName: string): string {
  const namespace = this.namespace || `${this.consoleId}-${this.projectName}-${this.workspace}`;
  return `https://${namespace}.adobeioruntime.net/api/v1/web/${this.actionPackageName}/${actionName}`;
}
```

**Benefits**:
- ✅ Centralized URL construction logic
- ✅ Consistent URL patterns across codebase
- ✅ Reduced code duplication
- ✅ Easier to maintain and test

#### 2. Event System Refactoring

**Event Routing Logic**
- **File**: `src/actions/classes/EventManager.ts`
- **Changed**: Event routing now uses `EventCategory` instead of `sendSecretHeader`
- **Improved**: Semantic clarity and separation of concerns

```typescript
// Before: Using security flag for routing
const shouldSendToBrand = eventDefinition.sendSecretHeader;

// After: Using event category for routing
const shouldSendToBrand = 
  eventDefinition.category === EventCategory.AGENCY || 
  eventDefinition.category === EventCategory.REGISTRATION;
```

**Method Rename**
- **File**: `src/actions/classes/IoCustomEventManager.ts`
- **Changed**: `publishEvent()` → `publishToAdobeIOEvents()`
- **Reason**: Clarify that this is for internal Adobe I/O Events distribution only

#### 3. Event Registry Modernization

**Deleted Legacy Event Classes** (10 files)
- `src/actions/classes/a2b_events/AssetSyncDeleteEvent.ts`
- `src/actions/classes/a2b_events/AssetSyncNewEvent.ts`
- `src/actions/classes/a2b_events/AssetSyncUpdateEvent.ts`
- `src/actions/classes/a2b_events/NewBrandRegistrationEvent.ts`
- `src/actions/classes/a2b_events/RegistrationDisabledEvent.ts`
- `src/actions/classes/a2b_events/RegistrationEnabledEvent.ts`
- `src/actions/classes/a2b_events/WorkfrontTaskCompletedEvent.ts`
- `src/actions/classes/a2b_events/WorkfrontTaskCreatedEvent.ts`
- `src/actions/classes/a2b_events/WorkfrontTaskUpdatedEvent.ts`
- `src/actions/classes/b2a_events/BrandRegistrationRequestEvent.ts`

**Modern Registry System**
- **Files**: 
  - `src/shared/classes/AppEventRegistry.ts`
  - `src/shared/classes/ProductEventRegistry.ts`
- **Benefits**:
  - Type-safe event definitions
  - Centralized event metadata
  - Dynamic event routing
  - Better maintainability

#### 4. Shared Types Architecture

**New Shared Types**
- **Location**: `src/shared/types/`
- **Files**:
  - `api.ts` - API response types
  - `brand.ts` - Brand-related interfaces
  - `events.ts` - Event system types
  - `runtime.ts` - Runtime info types
  - `index.ts` - Barrel export

**Synchronization Script**
- **File**: `sync-shared-types.sh`
- **Purpose**: Keep shared types in sync between a2b-agency and a2b-brand
- **Usage**: `./sync-shared-types.sh agency` or `./sync-shared-types.sh brand`

**Moved to Shared**
- **File**: `src/shared/classes/AgencyIdentification.ts`
- **Reason**: Used by both actions and web code

### 🐛 Bug Fixes

#### 1. Responsive Table Layout
- **File**: `BrandManagerView.tsx`
- **Issue**: Fixed column widths prevented responsive behavior
- **Fix**: Changed content columns to use `minWidth` instead of `width`
- **Result**: Table now adapts to screen size properly

```typescript
// Before: Fixed widths
<Column width={200}>Name</Column>
<Column width={150}>IMS Org</Column>

// After: Flexible widths
<Column minWidth={150}>Name</Column>
<Column minWidth={150}>IMS Org</Column>
```

#### 2. Browser-Compatible Brand Class
- **File**: `BrandManagerView.tsx`, `DemoBrandManager.ts`
- **Issue**: `ReferenceError: Brand is not defined` in browser
- **Root Cause**: Importing Node.js Brand class into browser code
- **Fix**: Use browser-compatible Brand class from `DemoBrandManager`
- **Added**: `imsOrgName` and `imsOrgId` fields to browser Brand class

### 📚 Documentation

**New Documentation Files** (28 files in `docs/cursor/`)
- `APP_EVENT_REGISTRY_DOCUMENTATION.md` - Event registry guide
- `PRODUCT_EVENT_REGISTRY_DOCUMENTATION.md` - Product events
- `SECURE_REGISTRATION_ARCHITECTURE.md` - Security flow
- `SHARED_TYPES_ARCHITECTURE.md` - Type system
- `SHARED_TYPES_MIGRATION_SUMMARY.md` - Migration guide
- `BRAND_TABLE_UI_IMPROVEMENTS.md` - UI enhancements
- `EVENT_MANAGER_REFACTORING.md` - EventManager changes
- `COMPLETE_EVENT_SYSTEM_REFACTORING.md` - System overview
- And 20 more...

**API Documentation**
- `docs/apis/list-product-events/` - Product event API
- Updated event body examples in `docs/events/`

**Event Examples** (9 files)
- Updated all event body examples with correct structure
- Added `app_runtime_info` to all events
- Organized by category (agency, brand, registration, product)

---

## 📊 Statistics

### Files Changed
- **Modified**: 28 files
- **Added**: 20 files (product event API, tests, shared types, documentation)
- **Deleted**: 10 files (legacy event classes)
- **Total**: 86 files changed, 10,256 insertions(+), 966 deletions(-)

### Key Metrics
- **New API Endpoints**: 1 (`list-product-events`)
- **New Test Files**: 3 (`list-product-events.test.ts`, `delete-brand.test.ts`, `update-brand.test.ts`)
- **Documentation Files**: 28 new markdown files
- **Event Examples**: 9 updated/new JSON files
- **Legacy Code Removed**: 10 event class files

---

## 🧪 Testing

### Test Coverage

**New Tests**
- `src/actions/test/list-product-events.test.ts` - Product event API
- `src/actions/test/delete-brand.test.ts` - Brand deletion
- `src/actions/test/update-brand.test.ts` - Brand updates

**Updated Tests**
- `src/actions/test/list-events.test.ts` - Event registry
- `src/actions/test/adobe-product-event-handler.test.ts` - Product events
- `src/actions/test/agency-assetsync-internal-handler-metadata-update.test.ts` - Asset sync

### Test Execution
```bash
npm test
```

All tests passing ✅

---

## 🚀 Deployment

### Pre-Deployment Checklist
- [x] All tests passing
- [x] No linter errors
- [x] Documentation complete
- [x] Companion PR ready in a2b-brand
- [x] Security validation implemented
- [x] Browser compatibility verified

### Deployment Steps

**Important**: Both a2b-agency and a2b-brand must be deployed together.

#### 1. Deploy a2b-agency
```bash
cd /Users/dbenge/code_2/a2b/a2b-agency
aio app use ../agency.json -m
aio app deploy
```

#### 2. Deploy a2b-brand
```bash
cd /Users/dbenge/code_2/a2b/a2b-brand
aio app use ../brand.json -m
aio app deploy
```

### Post-Deployment Verification

#### Test Brand Registration Flow
1. Open a2b-brand UI
2. Navigate to "Register with Agency"
3. Verify form auto-fills from IMS profile
4. Submit registration
5. Verify registration appears in a2b-agency Brand Manager

#### Test IMS Org Display
1. Open a2b-agency Brand Manager
2. Verify "IMS Org" column appears
3. Hover over org name to see tooltip with org ID
4. Open brand detail view
5. Verify IMS org fields display correctly

#### Test Secret Validation
1. Send a brand event without secret header
2. Verify 401 response
3. Send with invalid secret
4. Verify 401 response
5. Send with valid secret
6. Verify event processes successfully

#### Test Responsive UI
1. Open Brand Manager on desktop
2. Resize browser window
3. Verify table columns adjust properly
4. Test on mobile viewport
5. Verify all columns remain accessible

---

## 🔒 Security Considerations

### Secret Management
- ✅ Secrets validated on all non-registration brand events
- ✅ Secret header: `X-A2B-Agency-Secret`
- ✅ Registration events bypass validation (brand doesn't have secret yet)
- ✅ Invalid secrets return 401 Unauthorized

### URL Construction
- ✅ Agency URLs derived from `app_runtime_info` (not user input)
- ✅ Centralized URL building prevents injection attacks
- ✅ Static asset URLs use `.adobeio-static.net`
- ✅ Runtime action URLs use `.adobeioruntime.net`

### Browser/Server Boundary
- ✅ Node.js-only code stays in `src/actions/**`
- ✅ Browser code in `src/dx-excshell-1/**` uses browser-safe classes
- ✅ Shared types in `src/shared/**` are browser-compatible
- ✅ No Node.js dependencies leak into browser bundle

### Configuration Files
⚠️ **CRITICAL**: `agency.json` and `brand.json` contain sensitive credentials
- These files are **NEVER** committed to git
- Located outside repository: `/Users/dbenge/code_2/a2b/`
- Required for deployment context switching
- Must be kept secure

---

## 🔄 Breaking Changes

### 1. Event Routing Logic Changed
**Before**: Events routed based on `sendSecretHeader` flag
**After**: Events routed based on `EventCategory`

**Impact**: Any custom event handlers must use the new category system

**Migration**: Update event definitions to use `EventCategory` enum

### 2. Method Renamed
**Before**: `eventManager.publishEvent(event)`
**After**: `eventManager.publishToAdobeIOEvents(event)`

**Impact**: Any code calling `publishEvent` must be updated

**Migration**: Search and replace `publishEvent` with `publishToAdobeIOEvents`

### 3. Legacy Event Classes Removed
**Before**: Individual event class files in `src/actions/classes/a2b_events/`
**After**: Registry-based event definitions in `AppEventRegistry.ts`

**Impact**: Cannot import individual event classes anymore

**Migration**: Use `getAppEventDefinition(eventCode)` from registry

---

## 📝 Companion PR (a2b-brand)

The companion PR in **a2b-brand** includes:

### New Features
- ✅ `new-agency-registration` action (secure intermediary)
- ✅ Auto-fill registration form from IMS profile
- ✅ Send IMS org data to agency
- ✅ Derive agency endpoint from `app_runtime_info`

### Improvements
- ✅ Modernize `adobe-product-event-handler` to use `ProductEventRegistry`
- ✅ Refactor URL building to use `ApplicationRuntimeInfo` helpers
- ✅ Sync event registries from a2b-agency
- ✅ Update `agency-registration-internal-handler` URL derivation

### Bug Fixes
- ✅ Fix infinite loop in `AgencyRegistrationView` (useEffect dependency)
- ✅ Replace deprecated `placeholder` with `description` (accessibility)
- ✅ Fix agency endpoint URL derivation

### Cleanup
- ✅ Delete 10 legacy event class files
- ✅ Replace old `event-registry.ts` with modern registries
- ✅ Add complete shared types structure

---

## 🎯 Success Criteria

- [x] Brand registration flow works end-to-end
- [x] IMS org data captured and displayed
- [x] Secret validation prevents unauthorized access
- [x] Event system uses registry-based routing
- [x] UI is responsive across screen sizes
- [x] No Node.js code leaks into browser
- [x] All tests passing
- [x] Documentation complete
- [x] Companion PR ready

---

## 👥 Reviewers

Please review:
1. **Security changes** - Secret validation implementation
2. **Architecture changes** - Event system refactoring
3. **UI changes** - IMS org display and responsive layout
4. **Breaking changes** - Method renames and routing logic
5. **Documentation** - Completeness and accuracy

---

## 📌 Related Issues

- Closes #XXX - Implement secure brand registration
- Closes #XXX - Add IMS organization tracking
- Closes #XXX - Modernize event system
- Closes #XXX - Fix responsive table layout
- Closes #XXX - Browser compatibility issues

---

## 🙏 Acknowledgments

This PR represents a significant architectural improvement to the A2B system, enhancing security, maintainability, and user experience across both agency and brand applications.

---

## 📞 Questions?

For questions about this PR, please contact the development team or leave comments on specific lines of code.

