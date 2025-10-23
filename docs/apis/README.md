# A2B Agency API Documentation

Complete reference for all Agency-to-Brand (A2B) Agency application APIs.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Event Handlers](#event-handlers)
- [Brand Services](#brand-services)
- [Event Definition Services](#event-definition-services)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)

---

## Overview

The A2B Agency application provides RESTful APIs for:
- **Brand Management**: Register, manage, and configure brand integrations
- **Event Processing**: Handle incoming events from brands and Adobe products
- **Event Definitions**: Configure and manage event routing rules

**Base URL**: `https://{namespace}.adobeioruntime.net/api/v1/web/{package}/`

**Static URL**: `https://{consoleId}-{projectName}-{workspace}.adobeio-static.net/`

---

## Authentication

### Adobe IMS Authentication

Most APIs require Adobe IMS authentication:

```http
Authorization: Bearer {IMS_TOKEN}
x-api-key: {API_KEY}
```

### Brand Secret Authentication

Event handlers from brands require secret validation:

```http
X-A2B-Agency-Secret: {BRAND_SECRET}
```

**Note**: Registration events (`com.adobe.b2a.registration.*`) do NOT require secret validation.

---

## Event Handlers

Event handlers process incoming events from external sources (brands and Adobe products).

### Brand Event Handler

**Endpoint**: `POST /brand-event-handler`

**Purpose**: Receives and routes events FROM brands TO the agency.

**Authentication**: 
- Secret header required (except for registration events)
- `X-A2B-Agency-Secret: {secret}`

**Request Body** (CloudEvents format):
```json
{
  "type": "com.adobe.b2a.assetsync.new",
  "source": "urn:uuid:brand-id",
  "id": "event-uuid",
  "data": {
    "app_runtime_info": {
      "consoleId": "27200",
      "projectName": "a2b",
      "workspace": "production"
    },
    "asset_id": "asset-123",
    "asset_path": "/content/dam/...",
    "metadata": { }
  }
}
```

**Supported Event Types**:
- `com.adobe.b2a.assetsync.new`
- `com.adobe.b2a.assetsync.updated`
- `com.adobe.b2a.assetsync.deleted`

**Response**:
```json
{
  "statusCode": 200,
  "body": {
    "message": "Event com.adobe.b2a.assetsync.new processed successfully",
    "data": { }
  }
}
```

**Error Responses**:
- `400`: Missing required fields or invalid event type
- `401`: Missing or invalid secret header
- `500`: Internal processing error

---

### Product Event Handlers

#### Adobe Product Event Handler

**Endpoint**: `POST /adobe-product-event-handler`

**Purpose**: Receives and routes events FROM Adobe products (AEM, Workfront, etc.).

**Authentication**: Adobe IMS

**Request Body** (CloudEvents format):
```json
{
  "type": "com.adobe.aem.assets.metadata.updated",
  "source": "urn:uuid:aem-instance",
  "id": "event-uuid",
  "data": {
    "asset_id": "asset-123",
    "metadata": { }
  }
}
```

**Response**:
```json
{
  "statusCode": 200,
  "body": {
    "message": "Event processed successfully"
  }
}
```

#### Asset Sync Handlers

**Internal handlers** (not directly exposed):
- `agency-assetsync-internal-handler-metadata-updated`
- `agency-assetsync-internal-handler-process-complete`

---

## Brand Services

APIs for managing brand registrations and configurations.

### List Brands

**Endpoint**: `GET /get-brands`

**Purpose**: Retrieve all registered brands.

**Authentication**: Adobe IMS (required)

**Query Parameters**:
- `enabled` (optional): Filter by enabled status (`true`/`false`)

**Response**:
```json
{
  "statusCode": 200,
  "body": {
    "brands": [
      {
        "brandId": "c6409c52-9295-4d15-94e6-7bd39d04360c",
        "name": "ACME Corporation",
        "endPointUrl": "https://27200-a2b-production.adobeio-static.net",
        "enabled": true,
        "logo": "https://...",
        "imsOrgName": "ACME Inc",
        "imsOrgId": "org-123",
        "createdAt": "2025-10-22T12:00:00.000Z",
        "updatedAt": "2025-10-22T12:00:00.000Z",
        "enabledAt": "2025-10-22T12:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

**Documentation**: [get-brands/README.md](./get-brands/README.md)

---

### Get Brand

**Endpoint**: `GET /get-brand`

**Purpose**: Retrieve a specific brand by ID.

**Authentication**: Adobe IMS (required)

**Query Parameters**:
- `brandId` (required): Brand identifier

**Response**:
```json
{
  "statusCode": 200,
  "body": {
    "brandId": "c6409c52-9295-4d15-94e6-7bd39d04360c",
    "name": "ACME Corporation",
    "endPointUrl": "https://27200-a2b-production.adobeio-static.net",
    "enabled": true,
    "logo": "https://...",
    "imsOrgName": "ACME Inc",
    "imsOrgId": "org-123",
    "createdAt": "2025-10-22T12:00:00.000Z",
    "updatedAt": "2025-10-22T12:00:00.000Z",
    "enabledAt": "2025-10-22T12:00:00.000Z"
  }
}
```

**Error Responses**:
- `400`: Missing brandId parameter
- `404`: Brand not found

**Documentation**: [get-brand/README.md](./get-brand/README.md)

---

### New Brand Registration

**Endpoint**: `POST /new-brand-registration`

**Purpose**: Register a new brand with the agency.

**Authentication**: Adobe IMS (required)

**Request Body**:
```json
{
  "data": {
    "app_runtime_info": {
      "consoleId": "27200",
      "projectName": "a2b",
      "workspace": "production",
      "app_name": "brand",
      "action_package_name": "dx-excshell-1"
    },
    "brandId": "c6409c52-9295-4d15-94e6-7bd39d04360c",
    "name": "ACME Corporation",
    "endPointUrl": "https://27200-a2b-production.adobeio-static.net",
    "imsOrgName": "ACME Inc",
    "imsOrgId": "org-123",
    "logo": "https://..."
  }
}
```

**Response**:
```json
{
  "statusCode": 200,
  "body": {
    "message": "Brand registration processed successfully for brand id c6409c52-9295-4d15-94e6-7bd39d04360c",
    "brandId": "c6409c52-9295-4d15-94e6-7bd39d04360c",
    "name": "ACME Corporation",
    "enabled": false,
    "createdAt": "2025-10-22T12:00:00.000Z"
  }
}
```

**Important Notes**:
- Brand secret is generated internally and NOT returned in the response
- Brand is created in **disabled** state by default
- `endPointUrl` is set during registration and CANNOT be changed later
- Secret is only sent to the brand via `com.adobe.a2b.registration.enabled` event

**Documentation**: [new-brand-registration/README.md](./new-brand-registration/README.md)

---

### Update Brand

**Endpoint**: `PUT /update-brand`

**Purpose**: Update an existing brand's configuration.

**Authentication**: Adobe IMS (required)

**Request Body**:
```json
{
  "brandId": "c6409c52-9295-4d15-94e6-7bd39d04360c",
  "name": "ACME Corporation Updated",
  "enabled": true,
  "logo": "https://..."
}
```

**Response**:
```json
{
  "statusCode": 200,
  "body": {
    "message": "Brand updated successfully",
    "brand": {
      "brandId": "c6409c52-9295-4d15-94e6-7bd39d04360c",
      "name": "ACME Corporation Updated",
      "enabled": true,
      "enabledAt": "2025-10-22T12:00:00.000Z",
      "updatedAt": "2025-10-22T12:00:00.000Z"
    }
  }
}
```

**Important Notes**:
- `endPointUrl` is **immutable** and cannot be changed
- `secret` cannot be set via API (generated internally)
- Enabling a brand triggers `com.adobe.a2b.registration.enabled` event

**Documentation**: [update-brand/README.md](./update-brand/README.md)

---

### Delete Brand

**Endpoint**: `DELETE /delete-brand`

**Purpose**: Delete a specific brand.

**Authentication**: Adobe IMS (required)

**Query Parameters**:
- `brandId` (required): Brand identifier

**Response**:
```json
{
  "statusCode": 200,
  "body": {
    "message": "Brand deleted successfully",
    "brandId": "c6409c52-9295-4d15-94e6-7bd39d04360c"
  }
}
```

---

### Delete All Brands

**Endpoint**: `DELETE /delete-all-brands`

**Purpose**: Delete all brands (use with caution).

**Authentication**: Adobe IMS (required)

**Response**:
```json
{
  "statusCode": 200,
  "body": {
    "message": "All brands deleted successfully",
    "count": 5
  }
}
```

**⚠️ Warning**: This action is irreversible!

---

## Event Definition Services

APIs for managing event routing rules and definitions.

### Global App Event Definitions

Manage global app-level event definitions that apply to all brands.

#### List App Events

**Endpoint**: `GET /list-app-events`

**Purpose**: Retrieve all global app event definitions.

**Authentication**: Adobe IMS (required)

**Query Parameters**:
- `category` (optional): Filter by category (`agency`, `brand`, `registration`, `product`)

**Response**:
```json
{
  "statusCode": 200,
  "body": {
    "events": [
      {
        "code": "com.adobe.a2b.assetsync.new",
        "category": "agency",
        "name": "Asset Sync New",
        "description": "Emitted when syncing a new asset to brand",
        "handlerActionName": "agency-assetsync-internal-handler",
        "callBlocking": true,
        "sendSecretHeader": true
      }
    ],
    "count": 9,
    "categories": ["agency", "brand", "registration"]
  }
}
```

**Documentation**: [list-app-events/README.md](./list-app-events/README.md)

---

#### Get App Event

**Endpoint**: `GET /get-app-event`

**Purpose**: Retrieve a specific global app event definition.

**Authentication**: Adobe IMS (required)

**Query Parameters**:
- `eventCode` (required): Event code (e.g., `com.adobe.a2b.assetsync.new`)

**Response**:
```json
{
  "statusCode": 200,
  "body": {
    "code": "com.adobe.a2b.assetsync.new",
    "category": "agency",
    "name": "Asset Sync New",
    "description": "Emitted when syncing a new asset to brand",
    "handlerActionName": "agency-assetsync-internal-handler",
    "callBlocking": true,
    "sendSecretHeader": true
  }
}
```

---

#### Create App Event

**Endpoint**: `POST /create-app-event`

**Purpose**: Create a new global app event definition.

**Authentication**: Adobe IMS (required)

**Request Body**:
```json
{
  "code": "com.adobe.a2b.custom.event",
  "category": "agency",
  "name": "Custom Event",
  "description": "Custom event description",
  "handlerActionName": "custom-handler",
  "callBlocking": true,
  "sendSecretHeader": true
}
```

**Response**:
```json
{
  "statusCode": 201,
  "body": {
    "message": "App event definition created successfully",
    "eventCode": "com.adobe.a2b.custom.event"
  }
}
```

---

#### Update App Event

**Endpoint**: `PUT /update-app-event`

**Purpose**: Update an existing global app event definition.

**Authentication**: Adobe IMS (required)

**Request Body**:
```json
{
  "code": "com.adobe.a2b.custom.event",
  "name": "Updated Custom Event",
  "description": "Updated description",
  "callBlocking": false
}
```

**Response**:
```json
{
  "statusCode": 200,
  "body": {
    "message": "App event definition updated successfully",
    "eventCode": "com.adobe.a2b.custom.event"
  }
}
```

---

#### Delete App Event

**Endpoint**: `DELETE /delete-app-event`

**Purpose**: Delete a global app event definition.

**Authentication**: Adobe IMS (required)

**Query Parameters**:
- `eventCode` (required): Event code to delete

**Response**:
```json
{
  "statusCode": 200,
  "body": {
    "message": "App event definition deleted successfully",
    "eventCode": "com.adobe.a2b.custom.event"
  }
}
```

---

### Product Event Definitions

Manage product event definitions for Adobe product integrations.

#### List Product Events

**Endpoint**: `GET /list-product-events`

**Purpose**: Retrieve all product event definitions.

**Authentication**: Adobe IMS (required)

**Query Parameters**:
- `category` (optional): Filter by category

**Response**:
```json
{
  "statusCode": 200,
  "body": {
    "events": [
      {
        "code": "com.adobe.aem.assets.metadata.updated",
        "category": "aem",
        "name": "AEM Asset Metadata Updated",
        "description": "Emitted when AEM asset metadata is updated",
        "handlerActionName": "agency-assetsync-internal-handler-metadata-updated",
        "callBlocking": false
      }
    ],
    "count": 8,
    "categories": ["aem", "workfront"]
  }
}
```

**Documentation**: [list-product-events/README.md](./list-product-events/README.md)

---

#### Get Product Event

**Endpoint**: `GET /get-product-event`

**Purpose**: Retrieve a specific product event definition.

**Authentication**: Adobe IMS (required)

**Query Parameters**:
- `eventCode` (required): Event code

---

#### Create Product Event

**Endpoint**: `POST /create-product-event`

**Purpose**: Create a new product event definition.

**Authentication**: Adobe IMS (required)

---

#### Update Product Event

**Endpoint**: `PUT /update-product-event`

**Purpose**: Update an existing product event definition.

**Authentication**: Adobe IMS (required)

---

#### Delete Product Event

**Endpoint**: `DELETE /delete-product-event`

**Purpose**: Delete a product event definition.

**Authentication**: Adobe IMS (required)

---

### Brand-Specific App Event Definitions

Manage event definitions specific to individual brands.

#### List Brand App Events

**Endpoint**: `GET /list-brand-app-events`

**Purpose**: Retrieve all event definitions for a specific brand.

**Authentication**: Adobe IMS (required)

**Query Parameters**:
- `brandId` (required): Brand identifier

**Response**:
```json
{
  "statusCode": 200,
  "body": {
    "brandId": "c6409c52-9295-4d15-94e6-7bd39d04360c",
    "events": [
      {
        "code": "com.adobe.a2b.assetsync.new",
        "category": "agency",
        "name": "Asset Sync New (Brand Override)",
        "description": "Brand-specific override for asset sync",
        "handlerActionName": "custom-brand-handler",
        "callBlocking": true
      }
    ],
    "count": 2
  }
}
```

---

#### Create Brand App Event

**Endpoint**: `POST /create-brand-app-event`

**Purpose**: Create a brand-specific event definition override.

**Authentication**: Adobe IMS (required)

**Request Body**:
```json
{
  "brandId": "c6409c52-9295-4d15-94e6-7bd39d04360c",
  "code": "com.adobe.a2b.assetsync.new",
  "name": "Custom Asset Sync",
  "handlerActionName": "custom-handler"
}
```

---

#### Update Brand App Event

**Endpoint**: `PUT /update-brand-app-event`

**Purpose**: Update a brand-specific event definition.

**Authentication**: Adobe IMS (required)

---

#### Delete Brand App Event

**Endpoint**: `DELETE /delete-brand-app-event`

**Purpose**: Delete a brand-specific event definition.

**Authentication**: Adobe IMS (required)

**Query Parameters**:
- `brandId` (required): Brand identifier
- `eventCode` (required): Event code

---

## Error Handling

### Standard Error Response

```json
{
  "statusCode": 400,
  "body": {
    "error": "Bad Request",
    "message": "Missing required parameter: brandId"
  }
}
```

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Rate Limits

Adobe App Builder enforces the following limits:

- **Concurrent requests**: 1000 per namespace
- **Request timeout**: 60 seconds (blocking), 1 minute (non-blocking)
- **Payload size**: 5 MB maximum

---

## Event Flow Architecture

### Brand Registration Flow

```
1. Brand → POST /new-brand-registration
2. Agency creates brand (disabled, generates secret)
3. Agency → Response (no secret returned)
4. Admin → PUT /update-brand (enabled: true)
5. Agency → Sends com.adobe.a2b.registration.enabled event TO brand
6. Event includes secret in payload
7. Brand stores secret for future API calls
```

### Event Processing Flow

```
1. Brand → POST /brand-event-handler (with X-A2B-Agency-Secret header)
2. Agency validates secret
3. Agency routes to internal handler based on event type
4. Handler processes event
5. Agency → Response to brand
```

### Event Definition Hierarchy

Event definitions are applied in this order:

1. **Product Event Definitions** (from Adobe products)
2. **Global App Event Definitions** (apply to all brands)
3. **Brand-Specific Event Definitions** (override global for specific brand)
4. **Event Transmission** (send to brand endpoint)

---

## Additional Resources

- **CloudEvents Specification**: [docs/cursor/CLOUDEVENTS_DOCUMENTATION.md](../cursor/CLOUDEVENTS_DOCUMENTATION.md)
- **Event Naming Conventions**: See `.cursor/rules/event-naming-conventions.mdc`
- **Security Guidelines**: [docs/SECURITY_GUIDELINES.md](../SECURITY_GUIDELINES.md)
- **Brand Secret Security**: See `.cursor/rules/brand-secret-security.md`

---

## Support

For questions or issues:
- Review the [Event Registry Implementation](../cursor/EVENT_REGISTRY_IMPLEMENTATION.md)
- Check [Testing Documentation](../cursor/TESTING_AND_CI.md)
- See individual API documentation in `docs/apis/{api-name}/README.md`

---

**Last Updated**: October 22, 2025  
**Version**: 1.0.0  
**Project**: A2B Agency Application

