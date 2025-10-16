# AEM Event Flow Architecture Chart

This document provides a comprehensive overview of how AEM events flow through the a2b-agency system, from initial reception to final processing and downstream event publishing.

## Event Flow Overview

```mermaid
graph TB
    %% External Systems
    AEM[AEM Assets<br/>Adobe Experience Manager] --> |Cloud Events v1| AEH[Adobe Event Hub]
    WF[Workfront] --> |Webhook Events| AEH
    CC[Creative Cloud] --> |Cloud Events v1| AEH
    
    %% Event Reception Layer
    AEH --> |HTTP POST| APEH[adobe-product-event-handler<br/>Main Event Router]
    AEH --> |HTTP POST| BEH[brand-event-handler<br/>Brand Event Router]
    AEH --> |HTTP POST| WEH[workfront-event-handler<br/>Workfront Event Router]
    
    %% Event Routing Logic
    APEH --> |aem.assets.* events| AASH[agency-assetsync-internal-handler<br/>Asset Sync Processor]
    BEH --> |com.adobe.b2a.assetsync.* events| AASH
    WEH --> |workfront.* events| WEH_Internal[WorkfrontEventHandler<br/>Internal Processing]
    
    %% Asset Sync Processing
    AASH --> |Validate Metadata| MetadataCheck{Metadata Valid?<br/>a2b__sync_on_change<br/>a2d__customers}
    MetadataCheck --> |Yes| BrandLookup[Brand Manager<br/>Lookup Brand Config]
    MetadataCheck --> |No| SkipProcessing[Skip Processing<br/>Log Warning]
    
    BrandLookup --> |Brand Found & Enabled| BrandEndpoint[Send to Brand Endpoint<br/>HTTP POST Cloud Event]
    BrandLookup --> |Brand Not Found/Disabled| SkipBrand[Skip Brand Processing<br/>Log Warning]
    
    %% Event Publishing
    BrandEndpoint --> |Success| EventManager[Event Manager<br/>Publish to Adobe Event Hub]
    BrandEndpoint --> |Error| ErrorLog[Log Error<br/>Continue Processing]
    ErrorLog --> EventManager
    
    EventManager --> |S2S Authentication| AdobeEventHub[Adobe Event Hub<br/>Publish Custom Events]
    
    %% Event Types Published
    AdobeEventHub --> |com.adobe.b2a.assetsync.new| Downstream1[Downstream Systems<br/>Asset Processing]
    AdobeEventHub --> |com.adobe.b2a.assetsync.updated| Downstream2[Downstream Systems<br/>Asset Updates]
    AdobeEventHub --> |com.adobe.b2a.assetsync.deleted| Downstream3[Downstream Systems<br/>Asset Deletion]
    AdobeEventHub --> |com.adobe.b2a.brand.registered| Downstream4[Downstream Systems<br/>Brand Registration]
    
    %% Styling
    classDef external fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef handler fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef processor fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef decision fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef endpoint fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef downstream fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    
    class AEM,WF,CC,AEH external
    class APEH,BEH,WEH handler
    class AASH,WEH_Internal,BrandLookup,EventManager processor
    class MetadataCheck decision
    class BrandEndpoint,AdobeEventHub endpoint
    class Downstream1,Downstream2,Downstream3,Downstream4 downstream
```

## Detailed Event Processing Flow

### 1. Event Reception
- **AEM Assets** generates Cloud Events v1 format events for asset operations
- **Adobe Event Hub** receives and routes events to configured webhook endpoints
- Events include metadata like `a2b__sync_on_change` and `a2d__customers` for processing control

### 2. Event Routing
- **adobe-product-event-handler**: Routes AEM asset events (`aem.assets.asset.*`)
- **brand-event-handler**: Routes brand-specific events (`com.adobe.b2a.assetsync.*`)
- **workfront-event-handler**: Routes Workfront events

### 3. Asset Sync Processing
- **agency-assetsync-internal-handler** processes asset events
- Validates required metadata fields
- Looks up brand configuration using Brand Manager
- Sends events to brand-specific endpoints if configured

### 4. Event Publishing
- **Event Manager** handles S2S authentication with Adobe Event Hub
- Publishes custom events in Cloud Events v1 format
- Includes runtime isolation information for multi-tenant support

## Supported Event Types

### AEM Asset Events (Input)
| Event Type | Description | Handler |
|------------|-------------|---------|
| `aem.assets.asset.created` | New asset created in AEM | agency-assetsync-internal-handler |
| `aem.assets.asset.updated` | Asset updated in AEM | agency-assetsync-internal-handler |
| `aem.assets.asset.deleted` | Asset deleted from AEM | agency-assetsync-internal-handler |
| `aem.assets.asset.metadata_updated` | Asset metadata changed | agency-assetsync-internal-handler |

### Brand Asset Sync Events (Internal)
| Event Type | Description | Published To |
|------------|-------------|--------------|
| `com.adobe.b2a.assetsync.new` | New asset sync event | Adobe Event Hub |
| `com.adobe.b2a.assetsync.updated` | Asset sync update event | Adobe Event Hub |
| `com.adobe.b2a.assetsync.deleted` | Asset sync deletion event | Adobe Event Hub |

### Brand Registration Events
| Event Type | Description | Published To |
|------------|-------------|--------------|
| `com.adobe.b2a.brand.registered` | New brand registration | Adobe Event Hub |

### Workfront Events
| Event Type | Description | Handler |
|------------|-------------|---------|
| `workfront.task.created` | New Workfront task | WorkfrontEventHandler |
| `workfront.task.updated` | Workfront task updated | WorkfrontEventHandler |
| `workfront.task.completed` | Workfront task completed | WorkfrontEventHandler |

## Technical Implementation Details

### Authentication Flow
1. **S2S Authentication**: Uses Adobe I/O Service-to-Service credentials
2. **Runtime Isolation**: Each event includes `app_runtime_info` for multi-tenant support
3. **Token Management**: Automatic token refresh for Adobe Event Hub publishing

### Event Validation
- **Metadata Validation**: Checks for required fields like `a2b__sync_on_change`
- **Brand Validation**: Ensures brand exists and is enabled before processing
- **Event Structure**: Validates Cloud Events v1 format compliance

### Error Handling
- **Graceful Degradation**: Continues processing even if brand endpoint fails
- **Comprehensive Logging**: Detailed error logging with context
- **Retry Logic**: Built-in retry mechanisms for transient failures

### Performance Considerations
- **Lazy Loading**: Runtime configuration loaded on-demand
- **Async Processing**: Non-blocking event processing
- **Resource Optimization**: Efficient memory usage for large asset operations

## Configuration Requirements

### Required Environment Variables
- `AIO_runtime_apihost`: Adobe I/O Runtime API host
- `AIO_runtime_auth`: Runtime authentication key
- `AIO_runtime_namespace`: Runtime namespace
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

### Brand Configuration
- **Endpoint URL**: Brand-specific webhook endpoint
- **Authentication**: Brand-specific authentication credentials
- **Enabled Status**: Boolean flag to enable/disable processing

### Adobe Event Hub Configuration
- **Provider ID**: Unique identifier for event provider
- **Event Schema**: Cloud Events v1 format compliance
- **S2S Credentials**: Service-to-service authentication setup

## Monitoring and Observability

### Logging
- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Event Tracing**: End-to-end event flow tracking
- **Performance Metrics**: Processing time and success rates

### Error Tracking
- **Error Classification**: Categorized error types for monitoring
- **Alerting**: Configurable alerts for critical failures
- **Recovery**: Automatic retry and manual intervention capabilities

This architecture provides a robust, scalable, and maintainable event processing system that can handle high-volume AEM asset operations while maintaining data integrity and providing comprehensive observability.

