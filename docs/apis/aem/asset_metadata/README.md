# AEM Asset Metadata API Examples

This directory contains example responses from Adobe Experience Manager (AEM) Assets API for asset metadata operations.

## Files

### `aem-assets-asset-metadata_with-sync-off.json`

Example AEM asset metadata response where the `a2b__sync_on_change` metadata field is set to `"false"`.

**Use Case**: Testing scenarios where assets should NOT be automatically synced to brands when metadata changes occur.

**Key Metadata Fields**:
- `a2b__sync_on_change`: `"false"` - Disables automatic sync
- `a2b__customers`: Array of brand IDs that have access to this asset
- Standard AEM metadata (dam:*, dc:*, etc.)

**Location**: This file is used for API testing and documentation purposes, not imported by the EventRegistry.

### `aem-assets-asset-metadata_without-sync-data.json`

Example AEM asset metadata response where the A2B custom metadata fields (`a2b__*`) are completely absent.

**Use Case**: Testing scenarios where assets do not have any A2B sync configuration, representing assets that have not been set up for brand synchronization.

**Key Characteristics**:
- No `a2b__sync_on_change` field present
- No `a2b__customers` field present
- Only standard AEM metadata fields (dam:*, dc:*, exif:*, tiff:*, etc.)

**Location**: This file is used for API testing and documentation purposes, not imported by the EventRegistry.

## Related Documentation

- **Event Examples**: See `docs/events/product/aem/` for AEM event body examples used by the EventRegistry
- **Event Registry**: See `src/shared/classes/EventRegistry.ts` for event definitions

## Naming Convention

Files in this directory follow the pattern:
- Base name from AEM API context (e.g., `aem-assets-asset-metadata`)
- Variants use underscore prefix (e.g., `_with-sync-off`, `_without-sync-data`)

