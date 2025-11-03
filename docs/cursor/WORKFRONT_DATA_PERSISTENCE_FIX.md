# Workfront Data Persistence Fix

## Issue Summary

After saving Workfront data (URL, Company, Group) in the brand edit form:
1. The data was not appearing in the list view's Workfront column
2. When reopening the edit form, the Workfront fields were blank
3. No validation enforced that Company and Group must be selected if a Workfront URL is provided

The data **was** being saved to the backend and returned in the API response, but was being lost in the frontend.

## Root Cause

The issue was in `DemoBrandManager.getBrandFromJson()` and `DemoBrandManager.createBrand()` methods. These methods were not mapping the Workfront fields when creating `Brand` instances from API responses.

**Flow:**
1. User saves brand with Workfront data ✓
2. Backend saves all data including Workfront fields ✓
3. API returns data with `brand.toSafeJSON()` including Workfront fields ✓
4. Frontend receives response and calls `DemoBrandManager.getBrandFromJson(response.body.data)` ✗
5. `getBrandFromJson()` creates Brand instance **without** Workfront fields ✗
6. Brand list updated with incomplete data ✗

## Files Modified

### 1. `src/dx-excshell-1/web-src/src/utils/DemoBrandManager.ts`

#### Fix 1: `getBrandFromJson()` method
Added Workfront field mapping when creating Brand instances from JSON:

```typescript
return new Brand({
    brandId: json.brandId,
    name: json.name,
    endPointUrl: json.endPointUrl,
    enabled: json.enabled,
    logo: json.logo,
    imsOrgName: json.imsOrgName,
    imsOrgId: json.imsOrgId,
    createdAt: json.createdAt ? new Date(json.createdAt) : new Date(),
    updatedAt: json.updatedAt ? new Date(json.updatedAt) : new Date(),
    enabledAt: json.enabledAt ? new Date(json.enabledAt) : null,
    // ✅ Added Workfront fields
    workfrontServerUrl: json.workfrontServerUrl,
    workfrontCompanyId: json.workfrontCompanyId,
    workfrontCompanyName: json.workfrontCompanyName,
    workfrontGroupId: json.workfrontGroupId,
    workfrontGroupName: json.workfrontGroupName,
    workfrontEventSubscriptions: json.workfrontEventSubscriptions
});
```

#### Fix 2: `createBrand()` method
Added Workfront field mapping when creating new Brand instances:

```typescript
static createBrand(data: Partial<IBrand>): Brand {
    const now = new Date();
    return new Brand({
        brandId: data.brandId || this.generateBrandId(),
        name: data.name || '',
        endPointUrl: data.endPointUrl || '',
        enabled: data.enabled ?? false,
        logo: data.logo,
        imsOrgName: data.imsOrgName,
        imsOrgId: data.imsOrgId,
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
        enabledAt: data.enabledAt ?? null,
        // ✅ Added Workfront fields
        workfrontServerUrl: data.workfrontServerUrl,
        workfrontCompanyId: data.workfrontCompanyId,
        workfrontCompanyName: data.workfrontCompanyName,
        workfrontGroupId: data.workfrontGroupId,
        workfrontGroupName: data.workfrontGroupName,
        workfrontEventSubscriptions: data.workfrontEventSubscriptions
    });
}
```

### 2. `src/dx-excshell-1/web-src/src/components/layout/BrandForm.tsx`

#### Fix 3: Added Workfront validation
Added validation to ensure that if a Workfront Server URL is provided, both Company and Group must be selected:

```typescript
const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // ... existing validations ...

    // Workfront validation: if URL is provided, company and group must be selected
    if (formData.workfrontServerUrl?.trim()) {
        if (!formData.workfrontCompanyId) {
            newErrors.workfrontCompanyId = 'Workfront Company is required when Server URL is provided';
        }
        if (!formData.workfrontGroupId) {
            newErrors.workfrontGroupId = 'Workfront Group is required when Server URL is provided';
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
};
```

#### Fix 4: Enhanced Picker components with validation state
Updated Workfront Company and Group pickers to show validation errors:

```typescript
<Picker
    label="Workfront Company"
    // ... other props ...
    validationState={errors.workfrontCompanyId ? 'invalid' : undefined}
    errorMessage={errors.workfrontCompanyId}
    onSelectionChange={(key) => {
        // ... update formData ...
        
        // Clear error when selection is made
        if (key && errors.workfrontCompanyId) {
            setErrors(prev => {
                const updated = { ...prev };
                delete updated.workfrontCompanyId;
                return updated;
            });
        }
    }}
>
    {companies.map((company) => (
        <Item key={company.ID}>{company.name}</Item>
    ))}
</Picker>
```

#### Fix 5: Clear validation on URL field clear
Updated Workfront Server URL field to clear validation errors when the URL is cleared:

```typescript
<TextField
    label="Workfront Server URL"
    value={formData.workfrontServerUrl || ''}
    onChange={(value) => {
        setFormData({ ...formData, workfrontServerUrl: value });
        // Clear Workfront validation errors if URL is cleared
        if (!value?.trim()) {
            setErrors(prev => {
                const updated = { ...prev };
                delete updated.workfrontCompanyId;
                delete updated.workfrontGroupId;
                return updated;
            });
        }
    }}
    // ... other props ...
/>
```

## Expected Behavior After Fix

### 1. Data Persistence in List View
- ✅ After saving Workfront data, the list view immediately shows the Workfront Company in the "Workfront Company" column
- ✅ Hovering over the company name shows a tooltip with both Company and Group names

### 2. Data Persistence in Edit Form
- ✅ When reopening a brand for editing, all Workfront fields are populated:
  - Workfront Server URL
  - Selected Company (dropdown shows correct selection)
  - Selected Group (dropdown shows correct selection)

### 3. Form Validation
- ✅ If user enters a Workfront Server URL, they **must** select both Company and Group
- ✅ Attempting to save with URL but no Company/Group shows validation errors
- ✅ Validation errors clear automatically when:
  - User selects a Company/Group
  - User clears the Server URL field

### 4. Data Flow
```
User fills form → Submit → API saves data → API returns complete data → 
DemoBrandManager.getBrandFromJson() → Brand instance WITH Workfront fields → 
List view updates → Edit form shows data ✅
```

## Verification Steps

1. **Test Save and List View:**
   - Edit a brand
   - Enter Workfront Server URL: `https://test.workfront.com`
   - Select a Company and Group
   - Save
   - Verify Workfront Company appears in list view immediately

2. **Test Data Persistence:**
   - Edit the same brand again
   - Verify all three Workfront fields are populated
   - Change values and save
   - Reopen and verify changes persisted

3. **Test Validation:**
   - Edit a brand
   - Enter Workfront Server URL but don't select Company
   - Try to save
   - Verify validation error appears on Company picker
   - Select Company and Group
   - Verify errors clear and save succeeds

4. **Test Refresh:**
   - Refresh the browser
   - Verify Workfront column still shows data
   - Open edit form
   - Verify all Workfront fields are populated

## Related Issues

This fix resolves:
- ❌ List view not updating with new data after save
- ❌ Workfront column empty on refresh
- ❌ Edit form showing blank Workfront fields when data exists
- ❌ No validation for required Company/Group when URL is provided

## Backend Verification

The backend was already working correctly:

✅ `Brand.toSafeJSON()` includes all Workfront fields (lines 110-115 of `src/actions/classes/Brand.ts`)
✅ `get-brands` API returns `brand.toSafeJSON()` (line 32 of `src/actions/services/brand/get-brands/index.ts`)
✅ All Workfront fields are in `IBrand` interface (lines 88-104 of `src/shared/types/brand.ts`)

The issue was purely frontend - the data was being returned but not properly mapped when creating Brand instances.

## Impact

- ✅ No breaking changes
- ✅ No API changes required
- ✅ Only frontend logic fixes
- ✅ Improves data integrity
- ✅ Improves user experience with validation

## Testing

Suggested test cases:
1. Create brand with Workfront data
2. Edit brand and add Workfront data
3. Edit brand and change Workfront data
4. Edit brand and clear Workfront data
5. Try to save with URL but no Company (should fail validation)
6. Refresh page and verify data persists
7. Check list view shows Workfront company
8. Check tooltip shows both company and group

