# Registration Disabled Event Implementation

**Date**: 2025-10-17  
**Status**: ✅ Completed

## Overview

Implemented proper handling of the `com.adobe.a2b.registration.disabled` event when a brand is disabled on the agency side. This includes UI changes, event payload updates, and special handling to allow sending events to disabled brands.

---

## Changes Made

### 1. **UI: Conditional Delete Button** ✅

**File**: `src/dx-excshell-1/web-src/src/components/layout/BrandManagerView.tsx`

**Change**: The delete button now only appears for disabled brands.

```tsx
{/* Delete button only shown for disabled brands */}
{!brand.enabled && (
    <Button
        variant="negative"
        onPress={() => handleDeleteBrand(brand.brandId)}
    >
        <Delete />
    </Button>
)}
```

**Rationale**: 
- Brands should only be deletable when they are in a disabled state
- This prevents accidental deletion of active brands
- Clear visual indicator of brand lifecycle (enabled → disabled → deleted)

---

### 2. **Event Payload: Agency Identification** ✅

**File**: `docs/events/registration/com-adobe-a2b-registration-disabled.json`

**Change**: Added `agency_identification` to the event payload:

```json
"agency_identification": {
    "agencyId": "2ff22120-d393-4743-afdd-0d4b2038d2be",
    "orgId": "33C1401053CF76370A490D4C@AdobeOrg"
}
```

**Rationale**:
- Consistent with other registration events (enabled, received)
- Allows brand to identify which agency disabled them (1-to-many support)
- Maintains audit trail for multi-agency scenarios

---

### 3. **Brand Class: Special Event Handling** ✅

**File**: `src/actions/classes/Brand.ts`

**Change**: Modified `sendCloudEventToEndpoint()` to allow sending `registration.disabled` events even when the brand is disabled:

```typescript
async sendCloudEventToEndpoint(event: Ia2bEvent): Promise<IBrandEventPostResponse> {
    // Special case: registration.disabled events must be sent even when brand is disabled
    // This notifies the brand that it has been disabled by the agency
    const isDisabledEvent = event.type === 'com.adobe.a2b.registration.disabled';
    
    if (!this.enabled && !isDisabledEvent) {
        throw new Error('Brand:sendCloudEventToEndpoint: brand is disabled');
    }
    // ... rest of method
}
```

**Rationale**:
- The disabled event is a notification TO the brand that they have been disabled
- Must be sent AFTER the brand is marked as disabled (not before)
- Special case: only this event type bypasses the enabled check
- All other events correctly fail when brand is disabled

---

### 4. **Update Brand Action: Use Saved Brand** ✅

**File**: `src/actions/update-brand/index.ts`

**Change**: Updated to use `savedBrand` instead of `existingBrand` for sending disabled events:

```typescript
// Brand.sendCloudEventToEndpoint now allows sending registration.disabled events even when disabled
const response = await savedBrand.sendCloudEventToEndpoint(event);
```

**Before**: Used `existingBrand` (still enabled) to send the event
**After**: Uses `savedBrand` (now disabled), relying on the special case handling in Brand class

**Rationale**:
- More consistent with the actual state of the brand
- Takes advantage of the special case handling in `sendCloudEventToEndpoint()`
- Cleaner architecture - the method knows how to handle disabled events

---

## Event Flow

### When a Brand is Disabled:

1. **Agency Admin** changes brand `enabled` from `true` to `false` in the UI
2. **update-brand action** receives the update:
   - Detects `isDisablingBrand = true` (was enabled, now disabled)
   - Updates brand record with `enabled: false` and `enabledAt: null`
   - Saves the disabled brand to storage
3. **registration.disabled event** is created:
   - Contains `brandId`, `name`, `endPointUrl`, `enabled: false`
   - Includes `app_runtime_info` (agency runtime details)
   - Includes `agency_identification` (agencyId, orgId)
4. **Event is sent** to the brand's endpoint:
   - Uses the disabled brand's credentials (brandId, secret)
   - Special case in `Brand.sendCloudEventToEndpoint()` allows this
   - Brand receives notification that they have been disabled
5. **UI updates**: Delete button now appears for this brand

---

## Event Payload Structure

```json
{
    "id": "urn:uuid:12345678-1234-1234-1234-123456789abc",
    "source": "urn:uuid:5c3431a2-bd91-4eff-a356-26b747d0aad4",
    "type": "com.adobe.a2b.registration.disabled",
    "datacontenttype": "application/json",
    "time": "2025-08-28T07:29:29.728Z",
    "specversion": "1.0",
    "data": {
        "app_runtime_info": {
            "actionPackageName": "a2b-agency",
            "appName": "agency",
            "consoleId": "27200",
            "projectName": "a2b",
            "workspace": "benge"
        },
        "agency_identification": {
            "agencyId": "2ff22120-d393-4743-afdd-0d4b2038d2be",
            "orgId": "33C1401053CF76370A490D4C@AdobeOrg"
        },
        "brandId": "BRAND_A",
        "enabled": false,
        "endPointUrl": "https://example.com/webhook"
    }
}
```

---

## Files Modified

### a2b-agency
- ✅ `src/dx-excshell-1/web-src/src/components/layout/BrandManagerView.tsx` - Conditional delete button
- ✅ `src/actions/classes/Brand.ts` - Special handling for disabled events
- ✅ `src/actions/update-brand/index.ts` - Use savedBrand for disabled events
- ✅ `docs/events/registration/com-adobe-a2b-registration-disabled.json` - Added agency_identification

### a2b-brand
- ✅ `docs/events/registration/com-adobe-a2b-registration-disabled.json` - Synced from agency

---

## Testing Results

### a2b-agency ✅
```
Test Suites: 8 passed, 8 total
Tests:       139 passed, 139 total
Time:        3.689 s
```

### a2b-brand ✅
```
Test Suites: 5 passed, 5 total
Tests:       98 passed, 98 total
Time:        3.045 s
```

**Total**: 237 tests passing across both projects

---

## Security Considerations

1. **Authentication**: Disabled events still use the brand's secret for authentication
2. **Authorization**: Brand must verify the secret matches before processing the disabled event
3. **Audit Trail**: Agency identification allows brand to track which agency disabled them
4. **Single Notification**: Event is only sent once when brand transitions to disabled state

---

## Brand Lifecycle States

```
┌─────────────┐
│   Created   │  enabled: false, no secret
│  (pending)  │
└──────┬──────┘
       │ registration.enabled event sent
       ↓
┌─────────────┐
│   Enabled   │  enabled: true, has secret
│  (active)   │  ← Can receive all events
└──────┬──────┘
       │ registration.disabled event sent
       ↓
┌─────────────┐
│  Disabled   │  enabled: false, has secret
│ (inactive)  │  ← Delete button visible
└──────┬──────┘
       │ Delete action
       ↓
┌─────────────┐
│   Deleted   │  Record removed
│             │
└─────────────┘
```

---

## Related Events

- **registration.received** - Brand requests to register with agency (sent by brand)
- **registration.enabled** - Agency approves and enables brand (sent by agency)
- **registration.disabled** - Agency disables brand (sent by agency) ← This document
- **registration.deleted** - (Future) Agency deletes brand record

---

## Future Enhancements

1. **Confirmation Dialog**: Add confirmation when clicking delete on disabled brands
2. **Soft Delete**: Consider keeping deleted brand records for audit purposes
3. **Re-enable**: Allow re-enabling disabled brands with new secret
4. **Batch Operations**: Disable/enable multiple brands at once
5. **Webhook Retry**: If disabled event fails to send, implement retry logic

---

## Changelog

### 2025-10-17
- ✅ Implemented conditional delete button (disabled brands only)
- ✅ Added agency_identification to disabled event payload
- ✅ Modified Brand.sendCloudEventToEndpoint to allow disabled events
- ✅ Updated update-brand to use savedBrand for disabled events
- ✅ Synced event JSON to a2b-brand project
- ✅ All tests passing (237 total)

