#!/bin/bash
# sync-shared-types.sh
# Synchronize shared type files between a2b-agency and a2b-brand projects
# 
# Usage: ./sync-shared-types.sh [agency|brand]
#   agency - Copy FROM a2b-agency TO a2b-brand
#   brand  - Copy FROM a2b-brand TO a2b-agency

set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SOURCE=$1

# Validate argument
if [ "$SOURCE" != "agency" ] && [ "$SOURCE" != "brand" ]; then
    echo -e "${RED}Error: Invalid argument${NC}"
    echo "Usage: ./sync-shared-types.sh [agency|brand]"
    echo "  agency - Copy FROM a2b-agency TO a2b-brand"
    echo "  brand  - Copy FROM a2b-brand TO a2b-agency"
    exit 1
fi

# Determine source and target directories
if [ "$SOURCE" = "agency" ]; then
    FROM="/Users/dbenge/Documents/Adobe/code/2025/a2b/a2b-agency"
    TO="/Users/dbenge/Documents/Adobe/code/2025/a2b/a2b-brand"
    FROM_NAME="a2b-agency"
    TO_NAME="a2b-brand"
elif [ "$SOURCE" = "brand" ]; then
    FROM="/Users/dbenge/Documents/Adobe/code/2025/a2b/a2b-brand"
    TO="/Users/dbenge/Documents/Adobe/code/2025/a2b/a2b-agency"
    FROM_NAME="a2b-brand"
    TO_NAME="a2b-agency"
fi

echo -e "${YELLOW}Starting shared types sync: ${FROM_NAME} → ${TO_NAME}${NC}"
echo ""

# Verify source directory exists
if [ ! -d "$FROM" ]; then
    echo -e "${RED}Error: Source directory not found: $FROM${NC}"
    exit 1
fi

# Verify target directory exists
if [ ! -d "$TO" ]; then
    echo -e "${RED}Error: Target directory not found: $TO${NC}"
    exit 1
fi

# Create target shared/types directory if it doesn't exist
mkdir -p "$TO/src/shared/types"
mkdir -p "$TO/src/shared/classes"

# Sync shared type files
echo -e "${GREEN}Syncing shared type files...${NC}"
cp "$FROM/src/shared/types/brand.ts" "$TO/src/shared/types/"
cp "$FROM/src/shared/types/events.ts" "$TO/src/shared/types/"
cp "$FROM/src/shared/types/api.ts" "$TO/src/shared/types/"
cp "$FROM/src/shared/types/runtime.ts" "$TO/src/shared/types/"
cp "$FROM/src/shared/types/index.ts" "$TO/src/shared/types/"
echo "  ✓ brand.ts"
echo "  ✓ events.ts"
echo "  ✓ api.ts"
echo "  ✓ runtime.ts"
echo "  ✓ index.ts"

# Sync constants (already shared)
echo ""
echo -e "${GREEN}Syncing shared constants...${NC}"
cp "$FROM/src/shared/constants.ts" "$TO/src/shared/"
echo "  ✓ constants.ts"

# Sync event registries (per event registry sync rule)
echo ""
echo -e "${GREEN}Syncing event registries...${NC}"
cp "$FROM/src/shared/classes/AppEventRegistry.ts" "$TO/src/shared/classes/"
echo "  ✓ AppEventRegistry.ts"

# Copy registry documentation if it exists
if [ -f "$FROM/docs/cursor/APP_EVENT_REGISTRY_DOCUMENTATION.md" ]; then
    cp "$FROM/docs/cursor/APP_EVENT_REGISTRY_DOCUMENTATION.md" "$TO/docs/cursor/"
    echo "  ✓ APP_EVENT_REGISTRY_DOCUMENTATION.md"
fi

# Sync ProductEventRegistry (agency-specific but kept in sync)
if [ -f "$FROM/src/shared/classes/ProductEventRegistry.ts" ]; then
    cp "$FROM/src/shared/classes/ProductEventRegistry.ts" "$TO/src/shared/classes/"
    echo "  ✓ ProductEventRegistry.ts"
fi

if [ -f "$FROM/docs/cursor/PRODUCT_EVENT_REGISTRY_DOCUMENTATION.md" ]; then
    cp "$FROM/docs/cursor/PRODUCT_EVENT_REGISTRY_DOCUMENTATION.md" "$TO/docs/cursor/"
    echo "  ✓ PRODUCT_EVENT_REGISTRY_DOCUMENTATION.md"
fi

echo ""
echo -e "${GREEN}✅ Sync completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. cd $TO"
echo "2. Run tests: npm test"
echo "3. Verify no linter errors: check your IDE"
echo "4. Commit and push to $TO_NAME"
echo ""
echo -e "${YELLOW}Note: You MUST sync changes in BOTH directions when either project is updated!${NC}"

