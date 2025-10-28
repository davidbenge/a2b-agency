# CloudEvents Documentation Implementation

## Overview

Implemented comprehensive CloudEvents documentation across both `a2b-agency` and `a2b-brand` projects to clarify that all events follow the CloudEvents specification (CNCF standard).

**Date**: 2025-10-16

## What is CloudEvents?

CloudEvents is a CNCF (Cloud Native Computing Foundation) specification that provides a standardized way to describe event data. It has reached v1.0.2 and is used by major cloud providers including Adobe I/O Events.

- **Website**: https://cloudevents.io/
- **Specification**: https://github.com/cloudevents/spec
- **Adobe I/O Events**: Listed as an official CloudEvents adopter

## Changes Made

### 1. Created Cursor Rules

Created `.cursor/rules/cloudevents-structure.mdc` in both projects:

**a2b-agency**:
- `/Users/dbenge/Documents/Adobe/code/2025/a2b/a2b-agency/.cursor/rules/cloudevents-structure.mdc`

**a2b-brand**:
- `/Users/dbenge/Documents/Adobe/code/2025/a2b/a2b-brand/.cursor/rules/cloudevents-structure.mdc`

### 2. Updated Event Documentation

Updated `docs/events/README.md` in `a2b-agency`:
- Added CloudEvents structure explanation at the top
- Clarified that top-level properties are CloudEvents spec fields
- Clarified that `data` property contains application-specific payload
- Updated example structure to show complete CloudEvent (not just payload)
- Added links to CloudEvents resources

### 3. Rule Content

The CloudEvents rule documents:

#### CloudEvents Specification Overview
- What CloudEvents is and why it matters
- Link to official spec and website
- Adobe's adoption of CloudEvents

#### Event Structure
- Complete CloudEvent format with all properties
- Table of CloudEvents properties (top-level)
- Explanation of `data` property (application-specific)

#### CloudEvents vs Application Data
Key distinction:
```json
{
  // ↓ CloudEvents specification fields (standardized)
  "source": "urn:uuid:...",
  "type": "com.adobe.a2b.event.type",
  "id": "uuid",
  "datacontenttype": "application/json",
  "time": "2025-08-28T07:29:29.728Z",
  "specversion": "1.0",
  
  // ↓ Application-specific payload (A2B-defined)
  "data": {
    "app_runtime_info": { ... },
    "brandId": "...",
    "asset_id": "..."
  }
}
```

#### A2B Event Payload Standards
- `app_runtime_info` requirement
- Usage for routing, identification, isolation
- `consoleId` as agency/brand identifier

#### Code Examples
- Creating events with CloudEvents classes
- Reading events and accessing CloudEvents properties
- Testing with CloudEvents structure

#### Event Categories
- Registration Events
- Agency Events (a2b-agency specific)
- Brand Events (a2b-brand specific)
- Product Events

#### Best Practices
- Always include required CloudEvents properties
- Always include `app_runtime_info` in payload
- Use reverse DNS notation for event types
- Generate unique UUIDs for event IDs
- Include timestamps when possible

#### Security Considerations (a2b-brand)
- Secret-based authentication
- Agency identification from `app_runtime_info.consoleId`
- Exception for registration events

## Key Learning Points

### 1. Top-Level = CloudEvents, Data = Application

**CloudEvents Envelope** (standardized):
- `source` - Where the event came from
- `type` - What kind of event
- `id` - Unique event identifier
- `datacontenttype` - Content type of data
- `time` - When it happened
- `specversion` - CloudEvents version

**Application Payload** (A2B-specific):
- Everything inside `data` property
- Includes `app_runtime_info`
- Includes event-specific fields

### 2. Event Examples in docs/events/

All event example JSON files in `docs/events/` are **complete CloudEvents**, not just payloads:

```json
{
  "type": "com.adobe.a2b.assetsync.new",  // CloudEvents
  "source": "urn:uuid:...",                // CloudEvents
  "id": "uuid",                            // CloudEvents
  "datacontenttype": "application/json",   // CloudEvents
  "data": {                                // Application payload
    "app_runtime_info": { ... },
    "brandId": "...",
    "asset_id": "..."
  }
}
```

### 3. Adobe I/O Events Uses CloudEvents

Adobe I/O Events is listed as an official CloudEvents adopter on the CloudEvents website. Our A2B system builds on top of Adobe I/O Events, so we inherit CloudEvents compliance.

## Benefits of CloudEvents

1. **Consistency**: Common way to describe events across all services
2. **Accessibility**: Standard libraries, tooling, and infrastructure
3. **Portability**: Events can flow across different platforms
4. **Interoperability**: Works with other CloudEvents-compliant systems

## Event Flow Examples

### Agency-to-Brand Asset Sync

```
AEM (Product) → Agency (processes) → Brand (receives)
      ↓                ↓                    ↓
  AEM event      Enriches with      Receives complete
  (CloudEvents)  app_runtime_info   CloudEvent
                 Creates CloudEvent  Validates & processes
```

### Brand Registration

```
Brand (initiates) → Agency (processes) → Brand (confirms)
      ↓                    ↓                     ↓
  Sends CloudEvent    Validates          Receives CloudEvent
  b2a.registration    Creates brand      a2b.registration
  .new event          Responds with      .received event
                      CloudEvent
```

## Testing Impact

**a2b-agency**:
- ✅ All 8 test suites pass
- ✅ 139 tests pass
- ✅ No new failures introduced

**a2b-brand**:
- ✅ 2 test suites pass, 1 failing (pre-existing)
- ✅ 63 tests pass, 6 failing (pre-existing)
- ✅ No new failures introduced

## Files Created/Modified

### Created Files

1. **a2b-agency**:
   - `.cursor/rules/cloudevents-structure.mdc` (new rule)
   - `docs/cursor/CLOUDEVENTS_DOCUMENTATION.md` (this file)

2. **a2b-brand**:
   - `.cursor/rules/cloudevents-structure.mdc` (new rule)

### Modified Files

1. **a2b-agency**:
   - `docs/events/README.md` (added CloudEvents section)

## Related Documentation

- [Event Naming Conventions](./.cursor/rules/event-naming-conventions.mdc)
- [Event Registry Synchronization](./.cursor/rules/event-registry-sync.mdc)
- [Event File Organization](./EVENT_FILE_MOVES.md)
- [AEM Events](../events/product/aem/README.md)
- [Event Classes Synchronization](./EVENT_CLASSES_SYNCHRONIZATION.md)
- [Brand Registration Flow](./BRAND_REGISTRATION_FLOW_IMPLEMENTATION.md)

## Usage for Developers

### When Creating New Events

1. **Follow CloudEvents structure**:
   ```typescript
   const event = new MyEvent(params);
   event.setSourceUri(applicationRuntimeInfo); // Sets CloudEvents 'source'
   const cloudEvent = event.toCloudEvent();     // Converts to CloudEvents format
   ```

2. **Always include app_runtime_info in data**:
   ```typescript
   data: {
     app_runtime_info: {
       consoleId: "...",
       projectName: "...",
       workspace: "..."
     },
     // ... your event-specific fields
   }
   ```

3. **Use proper event type naming**:
   - `com.adobe.a2b.*` for agency-published events
   - `com.adobe.b2a.*` for brand-published events

### When Receiving Events

1. **Access CloudEvents properties at top level**:
   ```typescript
   const eventType = params.type;
   const eventSource = params.source;
   const eventId = params.id;
   ```

2. **Access application data in data property**:
   ```typescript
   const eventData = params.data;
   const appRuntimeInfo = eventData.app_runtime_info;
   const brandId = eventData.brandId;
   ```

3. **Extract sender ID from app_runtime_info**:
   ```typescript
   const senderId = eventData.app_runtime_info.consoleId;
   // For agency events: senderId = agencyId
   // For brand events: senderId = brandId
   ```

## CloudEvents SDK Support

CloudEvents provides official SDKs for:
- Go
- JavaScript
- Java
- C#
- Ruby
- PHP
- Python
- Rust
- PowerShell

Our A2B system uses JavaScript/TypeScript and implements CloudEvents through:
- Custom event classes (`A2bEvent`, `B2aEvent`)
- CloudEvents library (`cloudevents` npm package)
- Adobe I/O Events platform

## Future Considerations

1. **CloudEvents SQL**: Version 1.0 released June 2024 for querying/filtering events
2. **CloudEvents Discovery**: Specification for discovering event producers
3. **CloudEvents Subscriptions**: Specification for managing event subscriptions
4. **Additional Protocol Bindings**: WebSockets, AMQP, Kafka, etc.

## Summary

This documentation effort clarifies that:
- All A2B events are CloudEvents-compliant
- Top-level properties are CloudEvents standard fields
- `data` property contains our application-specific payload
- Adobe I/O Events (our platform) is an official CloudEvents adopter
- CloudEvents provides consistency, accessibility, and portability

The documentation helps developers understand:
- What parts of the event are standardized (CloudEvents)
- What parts are application-specific (A2B)
- How to create and consume CloudEvents properly
- Best practices for event structure

