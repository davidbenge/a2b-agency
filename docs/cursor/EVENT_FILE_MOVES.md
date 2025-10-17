# Event File Organization Updates

## Overview
Documentation of event example file moves and reorganization to improve clarity and organization.

## Recent Moves

### 2025-10-16: Moved metadata-only test variant to product/aem

**File**: `com-adobe-a2b-assetsync-update_metadata-only.json`

**Move**:
- **From**: `docs/events/agency/`
- **To**: `docs/events/product/aem/`

**Reason**: 
This file is a test variant that demonstrates how an assetsync.update event looks when only metadata changes (no binary asset sync). While the event type is `com.adobe.a2b.assetsync.update` (agency-to-brand), the file serves as a reference example derived from AEM product events, making the product/aem folder a more appropriate location.

**Changes Made**:
1. ✅ Moved file to `docs/events/product/aem/`
2. ✅ Created `docs/events/product/aem/README.md` documenting:
   - AEM Assets events structure
   - Test variants and examples
   - Event flow from AEM → Agency → Brands
   - AEM asset sync metadata fields
3. ✅ Updated `docs/events/README.md` to:
   - List the new file location
   - Link to the AEM-specific README

**Validation**:
- ✅ No code references found (file is documentation only)
- ✅ No test references found
- ✅ No broken links
- ✅ File successfully moved

## File Purpose Clarification

### Agency Events vs Product Events

#### `docs/events/agency/`
**Purpose**: Event examples that are PUBLISHED BY the agency TO brands

**Event types**:
- `com.adobe.a2b.assetsync.*` - Asset sync events sent to brands
- `com.adobe.a2b.workfront.*` - Workfront events sent to brands
- `com.adobe.a2b.registration.*` - Registration response events sent to brands

**Characteristics**:
- These are the actual events brands will receive
- Include `app_runtime_info` from the agency
- Published via the agency's event publishing mechanism

#### `docs/events/product/aem/`
**Purpose**: Event examples that are RECEIVED FROM AEM product

**Event types**:
- `aem-assets-*` - AEM Assets native events
- Test variants showing different scenarios

**Characteristics**:
- These are events the agency consumes from AEM
- Trigger the agency to process and potentially publish to brands
- May require transformation before sending to brands

### Test Variants

Test variant files use the underscore `_` naming pattern:
- `[base-event-name]_[variant-description].json`
- Examples:
  - `com-adobe-a2b-assetsync-update_metadata-only.json`
  - `aem-assets-asset-metadata_with-sync-off.json` (in docs/apis/aem/asset_metadata/)

These demonstrate edge cases, special scenarios, or different configurations.

## Directory Structure

```
docs/events/
├── registration/           # Brand registration lifecycle events
│   ├── com-adobe-a2b-registration-disabled.json
│   ├── com-adobe-a2b-registration-enabled.json
│   └── com-adobe-a2b-registration-received.json
│
├── agency/                # Agency-published events (TO brands)
│   ├── com-adobe-a2b-assetsync-new.json
│   ├── com-adobe-a2b-assetsync-update.json
│   ├── com-adobe-a2b-assetsync-delete.json
│   ├── com-adobe-a2b-workfront-task-created.json
│   ├── com-adobe-a2b-workfront-task-updated.json
│   └── com-adobe-a2b-workfront-task-completed.json
│
├── brand/                 # Brand-published events (TO agency)
│   └── com-adobe-b2a-registration-new.json
│
└── product/               # Adobe product events (consumed BY agency)
    └── aem/               # AEM Assets events
        ├── README.md      ← New documentation
        ├── aem-assets-asset-metadata.json
        ├── aem-assets-asset-processing-complete.json
        ├── aem-assets-metadata-change.json
        ├── aem-assets-asset-metadata-updated-event.json
        ├── aem-assets-asset-metadata_updated_2.json
        └── com-adobe-a2b-assetsync-update_metadata-only.json  ← Moved here
```

## Related Documentation

- [Event Naming Conventions](../../.cursor/rules/event-naming-conventions.mdc)
- [Event Classes Synchronization](./EVENT_CLASSES_SYNCHRONIZATION.md)
- [AEM Events README](../events/product/aem/README.md)
- [Events README](../events/README.md)

## Best Practices

### When to Create Test Variants

Create test variant files (`_variant-name.json`) when:
1. **Edge Cases** - Demonstrating unusual but valid scenarios
2. **Different Configurations** - Showing how events look with different settings
3. **Minimal Examples** - Stripped-down versions for clarity
4. **Special Scenarios** - Metadata-only updates, binary-only updates, etc.

### Naming Test Variants

Pattern: `[base-event-name]_[clear-description].json`

Good examples:
- ✅ `com-adobe-a2b-assetsync-update_metadata-only.json`
- ✅ `aem-assets-asset-metadata_with-sync-off.json`
- ✅ `com-adobe-a2b-assetsync-new_minimal.json`

Bad examples:
- ❌ `assetsync-update-test.json` (not following base name pattern)
- ❌ `metadata-only-update.json` (not clear which event this relates to)
- ❌ `test-variant-1.json` (not descriptive)

### Where to Place Files

| File Type | Location | Example |
|-----------|----------|---------|
| Agency-published events | `docs/events/agency/` | `com-adobe-a2b-assetsync-new.json` |
| Brand-published events | `docs/events/brand/` | `com-adobe-b2a-registration-new.json` |
| AEM product events | `docs/events/product/aem/` | `aem-assets-asset-metadata.json` |
| Registration events | `docs/events/registration/` | `com-adobe-a2b-registration-enabled.json` |
| AEM API responses | `docs/apis/aem/asset_metadata/` | `aem-assets-asset-metadata_with-sync-off.json` |

## Migration History

| Date | File | From | To | Reason |
|------|------|------|----|----|
| 2025-10-16 | `com-adobe-a2b-assetsync-update_metadata-only.json` | `docs/events/agency/` | `docs/events/product/aem/` | Better organization - file is AEM-derived test variant |
| 2025-10-14 | Multiple AEM files | `docs/events/product/` | `docs/events/product/aem/` | Created AEM subfolder for better organization |

## Validation Checklist

When moving event files:

- [ ] Search for code references (`grep -r "filename" src/`)
- [ ] Search for test references (`grep -r "filename" test/`)
- [ ] Update documentation (README files)
- [ ] Check for broken imports/requires
- [ ] Verify EventRegistry if file is referenced there
- [ ] Update related documentation
- [ ] Document the move in this file

## Notes

- Event example files are for documentation and testing only
- Most are not directly imported by EventRegistry (registry uses inline event definitions)
- Some test files may be imported by specific test suites
- Always search before moving to ensure no dependencies break

