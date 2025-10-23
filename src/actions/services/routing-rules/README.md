# Routing Rules Service

The Routing Rules Service provides CRUD APIs for managing event routing rules at multiple levels:

- **Global Product Event Routing Rules**: Rules that apply to all product events (e.g., AEM, Workfront)
- **Global App Event Routing Rules**: Rules that apply to all app events (e.g., asset sync, registration)
- **Brand-Specific Routing Rules**: Rules that apply to specific brands for app events

## Architecture

### Storage Strategy

Routing rules are stored using an optimized embedded structure:

- **Global Rules**: Stored in App Builder State Store with dedicated prefixes
  - Product Event Rules: `P-EVENT-RULE-GLOBAL_{eventCode}`
  - App Event Rules: `A-EVENT-RULE-GLOBAL_{eventCode}`
  
- **Brand-Specific Rules**: Embedded directly within the `Brand` object
  - Stored under `Brand.routingRules[eventCode]`
  - Eliminates separate state store entries
  - Reduces reads/writes by 50%
  - Improves latency and reduces costs

### Rule Structure

Each routing rule follows the `IRoutingRule` interface:

```typescript
interface IRoutingRule {
  id: string;                    // Unique rule ID (UUID)
  name: string;                  // Human-readable rule name
  description?: string;          // Optional description
  enabled: boolean;              // Whether the rule is active
  priority: number;              // Execution order (lower = higher priority)
  conditions: IRuleCondition[];  // Conditions to match
  actions: IRuleAction[];        // Actions to execute
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

## API Endpoints

### Global Product Event Routing Rules

Located in: `services/routing-rules/global/product/`

- **List Product Routing Rules**: `GET /list-product-routing-rules`
  - Lists all event codes with product routing rules
  
- **Get Product Routing Rules**: `GET /get-product-routing-rules`
  - Gets all rules for a specific product event code
  - Params: `eventCode`
  
- **Create Product Routing Rule**: `POST /create-product-routing-rule`
  - Creates a new product event routing rule
  - Params: `eventCode`, `rule`
  
- **Update Product Routing Rule**: `PUT /update-product-routing-rule`
  - Updates an existing product event routing rule
  - Params: `eventCode`, `ruleId`, `updates`
  
- **Delete Product Routing Rule**: `DELETE /delete-product-routing-rule`
  - Deletes a product event routing rule
  - Params: `eventCode`, `ruleId`

### Global App Event Routing Rules

Located in: `services/routing-rules/global/app/`

- **List App Routing Rules**: `GET /list-app-routing-rules`
  - Lists all event codes with app routing rules
  
- **Get App Routing Rules**: `GET /get-app-routing-rules`
  - Gets all rules for a specific app event code
  - Params: `eventCode`
  
- **Create App Routing Rule**: `POST /create-app-routing-rule`
  - Creates a new app event routing rule
  - Params: `eventCode`, `rule`
  
- **Update App Routing Rule**: `PUT /update-app-routing-rule`
  - Updates an existing app event routing rule
  - Params: `eventCode`, `ruleId`, `updates`
  
- **Delete App Routing Rule**: `DELETE /delete-app-routing-rule`
  - Deletes an app event routing rule
  - Params: `eventCode`, `ruleId`

### Brand-Specific Routing Rules

Located in: `services/routing-rules/brand/`

- **List Brand Routing Rules**: `GET /list-brand-routing-rules`
  - Lists all event codes with brand-specific routing rules
  - Params: `brandId`
  
- **Get Brand Routing Rules**: `GET /get-brand-routing-rules`
  - Gets all rules for a specific brand and event code
  - Params: `brandId`, `eventCode`
  
- **Create Brand Routing Rule**: `POST /create-brand-routing-rule`
  - Creates a new brand-specific routing rule
  - Params: `brandId`, `eventCode`, `rule`
  
- **Update Brand Routing Rule**: `PUT /update-brand-routing-rule`
  - Updates an existing brand-specific routing rule
  - Params: `brandId`, `eventCode`, `ruleId`, `updates`
  
- **Delete Brand Routing Rule**: `DELETE /delete-brand-routing-rule`
  - Deletes a brand-specific routing rule
  - Params: `brandId`, `eventCode`, `ruleId`

## Authentication

All routing rules APIs are protected with Adobe authentication:

```yaml
annotations:
  require-adobe-auth: true
```

## Usage Examples

### Creating a Global Product Event Rule

```bash
curl -X POST https://your-namespace.adobeioruntime.net/api/v1/web/a2b-agency/create-product-routing-rule \
  -H "Authorization: Bearer $ADOBE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventCode": "aem-assets-metadata-updated",
    "rule": {
      "name": "Route to Active Brands Only",
      "description": "Only send metadata updates to enabled brands",
      "enabled": true,
      "priority": 10,
      "conditions": [
        {
          "field": "brand.enabled",
          "operator": "equals",
          "value": true
        }
      ],
      "actions": [
        {
          "type": "forward",
          "target": "brand.endPointUrl"
        }
      ]
    }
  }'
```

### Creating a Brand-Specific Rule

```bash
curl -X POST https://your-namespace.adobeioruntime.net/api/v1/web/a2b-agency/create-brand-routing-rule \
  -H "Authorization: Bearer $ADOBE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "brandId": "brand-uuid-here",
    "eventCode": "com.adobe.a2b.assetsync.new",
    "rule": {
      "name": "Filter by Asset Type",
      "description": "Only send image assets to this brand",
      "enabled": true,
      "priority": 5,
      "conditions": [
        {
          "field": "data.metadata.dc:format",
          "operator": "startsWith",
          "value": "image/"
        }
      ],
      "actions": [
        {
          "type": "forward",
          "target": "brand.endPointUrl"
        }
      ]
    }
  }'
```

## Rule Execution Order

Rules are executed in the following order:

1. **Global Product Event Rules** (if product event)
2. **Global App Event Rules** (if app event)
3. **Brand-Specific Rules** (if applicable)

Within each level, rules are executed by priority (lower number = higher priority).

## Performance Optimizations

### Embedded Brand Rules

Brand-specific routing rules are stored directly within the `Brand` object:

**Before (Separate State Entries):**
- Read brand: 1 state store operation
- Read rules: N state store operations (one per event code)
- **Total: N+1 operations**

**After (Embedded):**
- Read brand with embedded rules: 1 state store operation
- **Total: 1 operation**

**Benefits:**
- 50% reduction in state store reads
- 50% reduction in state store writes
- ~50% reduction in latency
- ~50% reduction in costs

## Related Documentation

- `src/actions/classes/RoutingRulesManager.ts` - Global rules manager
- `src/actions/classes/BrandManager.ts` - Brand-specific rules management
- `src/shared/types/rules-types.ts` - Type definitions
- `docs/cursor/ROUTING_RULES_REFACTORING_STATUS.md` - Implementation details
- `docs/cursor/EMBEDDED_ROUTING_RULES_OPTIMIZATION.md` - Optimization details

## State Store Prefixes

- `P-EVENT-RULE-GLOBAL_` - Global product event rules
- `A-EVENT-RULE-GLOBAL_` - Global app event rules
- Brand-specific rules are embedded in the `Brand` object (no separate prefix)

## Testing

Run tests with:

```bash
npm test -- BrandManager.test.ts
npm test -- RoutingRulesManager.test.ts
```

## Migration Notes

If upgrading from the old `EventRegistryManager` system:

1. Global rules are now managed by `RoutingRulesManager`
2. Brand-specific rules are now embedded in `Brand` objects
3. Old event definition CRUD APIs have been removed
4. Event registries (`AppEventRegistry`, `ProductEventRegistry`) are now read-only
