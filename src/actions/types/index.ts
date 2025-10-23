/**
 * Action-specific TypeScript type definitions
 * 
 * This module contains types that are ONLY used in backend OpenWhisk actions.
 * Types that need to be shared with frontend should be in src/shared/types/
 * 
 * @module actions/types
 */

import { CloudEvent } from "cloudevents";

// ============================================================================
// Re-export shared types for backward compatibility
// ============================================================================

export {
    // Brand types
    IBrand,
    IBrandEventPostResponse,
    IBrandCreateData,
    IBrandUpdateData,
    IBrandListItem,
    
    // Event types
    IValidationResult,
    IEventBase,
    IA2bEventData,
    IB2aEventData,
    IEventMetadata,
    IEventHistoryEntry,
    
    // API types
    ApiSuccessResponse,
    ApiErrorResponse,
    ApiResponse,
    ApiErrorResponseAlt,
    GetBrandsResponse,
    UpdateBrandResponse,
    DeleteBrandResponse,
    ListEventsResponse,
    GetEventResponse,
    ListEventsByCategoryResponse,
    ListProductEventsResponse,
    ProductEventHandlerResponse,
    
    // Runtime types
    IApplicationRuntimeInfo,
    IAgencyIdentification,
    IEnvironmentConfig,
    ILogger,
    
    // Event registry types
    IAppEventDefinition,
    IProductEventDefinition,
    
    // Routing rules types
    IRoutingRule,
    
    // Backward compatibility
    Logger
} from '../../shared/types';

// ============================================================================
// Backend-Only Types (Node.js/OpenWhisk specific)
// ============================================================================

/**
 * Event handler interface for product event handlers
 * Backend-only - uses Node.js logger and async patterns
 */
export interface Ia2bEventHandler {
    logger: any;
    handleEvent(event: any): Promise<any>;
}

/**
 * A2B Event interface with CloudEvents conversion
 * Backend-only - requires 'cloudevents' npm package
 */
export interface Ia2bEvent {
    source: string;
    type: string;
    datacontenttype: string;
    data: any;
    id: string;
    validate(): import('../../shared/types').IValidationResult;
    toJSON(): any;
    toCloudEvent(): CloudEvent;
}

/**
 * B2A Event interface with CloudEvents conversion
 * Backend-only - requires 'cloudevents' npm package
 */
export interface Ib2aEvent {
    source: string;
    type: string;
    datacontenttype: string;
    data: any;
    id: string;
    validate(): import('../../shared/types').IValidationResult;
    toJSON(): any;
    toCloudEvent(): CloudEvent;
}

/**
 * Server-to-Server authentication credentials
 * Backend-only - never exposed to frontend for security
 */
export interface IS2SAuthenticationCredentials {
    clientId: string;
    clientSecret: string;
    scopes: string;
    orgId: string;
}