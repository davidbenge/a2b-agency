/**
 * Event Registry - Single Source of Truth for A2B Events
 * 
 * This file is browser-safe and can be imported by both actions and web frontend.
 * Do not import Node-only modules here.
 */

import { EventDefinition } from "../types";
import { EventCategory } from "../constants";

// Import event body examples from docs/events
const registrationDisabledBody = require('../../../docs/events/registration/com-adobe-a2b-registration-disabled.json');
const registrationReceivedBody = require('../../../docs/events/registration/com-adobe-a2b-registration-received.json');
const registrationEnabledBody = require('../../../docs/events/registration/com-adobe-a2b-registration-enabled.json');
const assetsyncNewBody = require('../../../docs/events/agency/com-adobe-a2b-assetsync-new.json');
const assetsyncUpdateBody = require('../../../docs/events/agency/com-adobe-a2b-assetsync-update.json');
const assetsyncDeleteBody = require('../../../docs/events/agency/com-adobe-a2b-assetsync-delete.json');
const workfrontTaskCreatedBody = require('../../../docs/events/agency/com-adobe-a2b-workfront-task-created.json');
const workfrontTaskUpdatedBody = require('../../../docs/events/agency/com-adobe-a2b-workfront-task-updated.json');
const workfrontTaskCompletedBody = require('../../../docs/events/agency/com-adobe-a2b-workfront-task-completed.json');

/**
 * Central registry of all A2B events with metadata
 */
export const EVENT_REGISTRY: Record<string, EventDefinition> = {
    // Brand Registration Events
    'com.adobe.a2b.registration.disabled': {
        code: 'com.adobe.a2b.registration.disabled',
        category: EventCategory.REGISTRATION,
        name: 'Brand Registration Disabled',
        description: 'Emitted when a brand registration is disabled',
        eventClass: 'NewBrandRegistrationEvent',
        version: '1.0.0',
        eventBodyexample: registrationDisabledBody,
        routingRules: [],
        requiredFields: ['brandId', 'enabled','endPointUrl'],
        optionalFields: []
    },
    'com.adobe.a2b.registration.received': {
        code: 'com.adobe.a2b.registration.received',
        category: EventCategory.REGISTRATION,
        name: 'Brand Registration Received',
        description: 'Emitted when a new brand registration is received',
        eventClass: 'NewBrandRegistrationEvent',
        version: '1.0.0',
        eventBodyexample: registrationReceivedBody,
        routingRules: [],
        requiredFields: ['name', 'endPointUrl'],
        optionalFields: []
    },
    'com.adobe.a2b.registration.enabled': {
        code: 'com.adobe.a2b.registration.enabled',
        category: EventCategory.REGISTRATION,
        name: 'Brand Registration Enabled',
        description: 'Emitted when a brand registration is enabled and secret is provided',
        eventClass: 'NewBrandRegistrationEvent',
        version: '1.0.0',
        eventBodyexample: registrationEnabledBody,
        routingRules: [],
        requiredFields: ['brandId', 'secret', 'enabled'],
        optionalFields: ['name', 'endPointUrl', 'enabledAt']
    },

    // Asset Sync Events
    'com.adobe.a2b.assetsync.new': {
        code: 'com.adobe.a2b.assetsync.new',
        category: EventCategory.AGENCY,
        name: 'Asset Sync New',
        description: 'Emitted when a new asset is synced from AEM',
        eventClass: 'AssetSyncNewEvent',
        version: '1.0.0',
        eventBodyexample: assetsyncNewBody,
        routingRules: [],
        requiredFields: ['asset_id', 'asset_path', 'metadata', 'brandId', 'asset_presigned_url'],
        optionalFields: ['app_runtime_info']
    },
    'com.adobe.a2b.assetsync.update': {
        code: 'com.adobe.a2b.assetsync.update',
        category: EventCategory.AGENCY,
        name: 'Asset Sync Update',
        description: 'Emitted when an asset is updated in AEM',
        eventClass: 'AssetSyncUpdateEvent',
        version: '1.0.0',
        eventBodyexample: assetsyncUpdateBody,
        routingRules: [],
        requiredFields: ['asset_id', 'brandId'],
        optionalFields: ['asset_path', 'metadata', 'app_runtime_info']
    },
    'com.adobe.a2b.assetsync.delete': {
        code: 'com.adobe.a2b.assetsync.delete',
        category: EventCategory.AGENCY,
        name: 'Asset Sync Delete',
        description: 'Emitted when an asset is deleted in AEM',
        eventClass: 'AssetSyncDeleteEvent',
        version: '1.0.0',
        eventBodyexample: assetsyncDeleteBody,
        routingRules: [],
        requiredFields: ['asset_id', 'brandId'],
        optionalFields: ['asset_path', 'app_runtime_info']
    },

    // Workfront Events (Agency events - com.adobe.a2b.* = agency-published)
    'com.adobe.a2b.workfront.task.created': {
        code: 'com.adobe.a2b.workfront.task.created',
        category: EventCategory.AGENCY,
        name: 'Workfront Task Created',
        description: 'Emitted when a task is created in Workfront',
        eventClass: 'WorkfrontTaskCreatedEvent',
        version: '1.0.0',
        eventBodyexample: workfrontTaskCreatedBody,
        routingRules: [],
        requiredFields: ['taskId'],
        optionalFields: ['projectId', 'assigneeId', 'taskName', 'dueDate']
    },
    'com.adobe.a2b.workfront.task.updated': {
        code: 'com.adobe.a2b.workfront.task.updated',
        category: EventCategory.AGENCY,
        name: 'Workfront Task Updated',
        description: 'Emitted when a task is updated in Workfront',
        eventClass: 'WorkfrontTaskUpdatedEvent',
        version: '1.0.0',
        eventBodyexample: workfrontTaskUpdatedBody,
        routingRules: [],
        requiredFields: ['taskId'],
        optionalFields: ['projectId', 'assigneeId', 'taskName', 'dueDate', 'status']
    },
    'com.adobe.a2b.workfront.task.completed': {
        code: 'com.adobe.a2b.workfront.task.completed',
        category: EventCategory.AGENCY,
        name: 'Workfront Task Completed',
        description: 'Emitted when a task is completed in Workfront',
        eventClass: 'WorkfrontTaskCompletedEvent',
        version: '1.0.0',
        eventBodyexample: workfrontTaskCompletedBody,
        routingRules: [],
        requiredFields: ['taskId'],
        optionalFields: ['projectId', 'completedDate', 'completedBy']
    }
};

/**
 * Get all events for a specific category
 */
export const getEventsByCategory = (category: EventDefinition['category']): EventDefinition[] => {
    return Object.values(EVENT_REGISTRY).filter(e => e.category === category);
};

/**
 * Get all event codes
 */
export const getAllEventCodes = (): string[] => {
    return Object.keys(EVENT_REGISTRY);
};

/**
 * Get a specific event definition by code
 */
export const getEventDefinition = (code: string): EventDefinition | undefined => {
    return EVENT_REGISTRY[code];
};

/**
 * Get all available event categories
 */
export const getEventCategories = (): Array<EventDefinition['category']> => {
    return [...new Set(Object.values(EVENT_REGISTRY).map(e => e.category))];
};

/**
 * Check if an event code exists in the registry
 */
export const isValidEventCode = (code: string): boolean => {
    return code in EVENT_REGISTRY;
};

/**
 * Get event count by category
 */
export const getEventCountByCategory = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    Object.values(EVENT_REGISTRY).forEach(event => {
        counts[event.category] = (counts[event.category] || 0) + 1;
    });
    return counts;
};

