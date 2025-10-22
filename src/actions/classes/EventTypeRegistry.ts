/**
 * Event Type Registry
 * 
 * Centralized registry for all event types supported by the application.
 * Uses factory pattern to create event handlers and provides metadata for rules management.
 */

export interface EventTypeMetadata {
    type: string;
    category: 'aem' | 'workfront' | 'brand' | 'custom';
    description: string;
    handler: string;
    requiredFields: string[];
    optionalFields: string[];
    routingRules: string[];
    example: any;
}

export interface EventHandlerFactory {
    createHandler(): any;
    getMetadata(): EventTypeMetadata;
}

/**
 * Central registry of all supported event types
 */
export class EventTypeRegistry {
    private static eventTypes: Map<string, EventTypeMetadata> = new Map();
    private static handlers: Map<string, EventHandlerFactory> = new Map();

    /**
     * Register an event type with its metadata and handler factory
     */
    static registerEventType(
        type: string, 
        metadata: EventTypeMetadata, 
        handlerFactory: EventHandlerFactory
    ): void {
        this.eventTypes.set(type, metadata);
        this.handlers.set(type, handlerFactory);
    }

    /**
     * Get all registered event types
     */
    static getAllEventTypes(): EventTypeMetadata[] {
        return Array.from(this.eventTypes.values());
    }

    /**
     * Get event types by category
     */
    static getEventTypesByCategory(category: string): EventTypeMetadata[] {
        return this.getAllEventTypes().filter(event => event.category === category);
    }

    /**
     * Get metadata for a specific event type
     */
    static getEventTypeMetadata(type: string): EventTypeMetadata | undefined {
        return this.eventTypes.get(type);
    }

    /**
     * Create a handler for a specific event type
     */
    static createHandler(type: string): any {
        const factory = this.handlers.get(type);
        if (!factory) {
            throw new Error(`No handler factory registered for event type: ${type}`);
        }
        return factory.createHandler();
    }

    /**
     * Check if an event type is supported
     */
    static isEventTypeSupported(type: string): boolean {
        return this.eventTypes.has(type);
    }

    /**
     * Get all event types for rules management (with routing information)
     */
    static getEventTypesForRules(): Array<EventTypeMetadata & { routingRules: string[] }> {
        return this.getAllEventTypes().map(event => ({
            ...event,
            routingRules: event.routingRules || []
        }));
    }
}

// Initialize the registry with all supported event types
export function initializeEventRegistry(): void {
    // AEM Asset Events
    EventTypeRegistry.registerEventType('aem.assets.asset.created', {
        type: 'aem.assets.asset.created',
        category: 'aem',
        description: 'AEM asset created event',
        handler: 'agency-assetsync-internal-handler',
        requiredFields: ['assetId', 'assetPath', 'assetName'],
        optionalFields: ['metadata', 'renditions'],
        routingRules: ['asset-sync-new'],
        example: {
            assetId: 'asset-123',
            assetPath: '/content/dam/brand/logo.png',
            assetName: 'logo.png',
            metadata: { 'a2b__sync_on_change': 'true' }
        }
    }, {
        createHandler: () => import('../agency-assetsync-internal-handler'),
        getMetadata: () => EventTypeRegistry.getEventTypeMetadata('aem.assets.asset.created')!
    });

    EventTypeRegistry.registerEventType('aem.assets.asset.updated', {
        type: 'aem.assets.asset.updated',
        category: 'aem',
        description: 'AEM asset updated event',
        handler: 'agency-assetsync-internal-handler',
        requiredFields: ['assetId', 'assetPath', 'assetName'],
        optionalFields: ['metadata', 'renditions', 'changes'],
        routingRules: ['asset-sync-update'],
        example: {
            assetId: 'asset-123',
            assetPath: '/content/dam/brand/logo.png',
            assetName: 'logo.png',
            metadata: { 'a2b__sync_on_change': 'true' }
        }
    }, {
        createHandler: () => import('../agency-assetsync-internal-handler'),
        getMetadata: () => EventTypeRegistry.getEventTypeMetadata('aem.assets.asset.updated')!
    });

    EventTypeRegistry.registerEventType('aem.assets.asset.deleted', {
        type: 'aem.assets.asset.deleted',
        category: 'aem',
        description: 'AEM asset deleted event',
        handler: 'agency-assetsync-internal-handler',
        requiredFields: ['assetId', 'assetPath'],
        optionalFields: ['assetName'],
        routingRules: ['asset-sync-delete'],
        example: {
            assetId: 'asset-123',
            assetPath: '/content/dam/brand/logo.png'
        }
    }, {
        createHandler: () => import('../agency-assetsync-internal-handler'),
        getMetadata: () => EventTypeRegistry.getEventTypeMetadata('aem.assets.asset.deleted')!
    });

    EventTypeRegistry.registerEventType('aem.assets.asset.metadata_updated', {
        type: 'aem.assets.asset.metadata_updated',
        category: 'aem',
        description: 'AEM asset metadata updated event',
        handler: 'agency-assetsync-internal-handler',
        requiredFields: ['assetId', 'assetPath', 'metadata'],
        optionalFields: ['assetName', 'changes'],
        routingRules: ['asset-sync-metadata-update'],
        example: {
            assetId: 'asset-123',
            assetPath: '/content/dam/brand/logo.png',
            metadata: { 'a2b__sync_on_change': 'true', 'a2d__customers': 'brand1,brand2' }
        }
    }, {
        createHandler: () => import('../agency-assetsync-internal-handler'),
        getMetadata: () => EventTypeRegistry.getEventTypeMetadata('aem.assets.asset.metadata_updated')!
    });

    // Workfront Events
    EventTypeRegistry.registerEventType('workfront.task.created', {
        type: 'workfront.task.created',
        category: 'workfront',
        description: 'Workfront task created event',
        handler: 'workfront-event-handler',
        requiredFields: ['taskId', 'taskName', 'projectId'],
        optionalFields: ['assignee', 'dueDate', 'priority'],
        routingRules: ['workfront-task-created'],
        example: {
            taskId: 'task-123',
            taskName: 'Create brand guidelines',
            projectId: 'project-456',
            assignee: 'user@example.com'
        }
    }, {
        createHandler: () => import('../workfront-event-handler'),
        getMetadata: () => EventTypeRegistry.getEventTypeMetadata('workfront.task.created')!
    });

    EventTypeRegistry.registerEventType('workfront.task.updated', {
        type: 'workfront.task.updated',
        category: 'workfront',
        description: 'Workfront task updated event',
        handler: 'workfront-event-handler',
        requiredFields: ['taskId', 'changes'],
        optionalFields: ['taskName', 'projectId', 'assignee'],
        routingRules: ['workfront-task-updated'],
        example: {
            taskId: 'task-123',
            changes: { status: 'In Progress', progress: 50 }
        }
    }, {
        createHandler: () => import('../workfront-event-handler'),
        getMetadata: () => EventTypeRegistry.getEventTypeMetadata('workfront.task.updated')!
    });

    EventTypeRegistry.registerEventType('workfront.task.completed', {
        type: 'workfront.task.completed',
        category: 'workfront',
        description: 'Workfront task completed event',
        handler: 'workfront-event-handler',
        requiredFields: ['taskId', 'completionDate'],
        optionalFields: ['taskName', 'projectId', 'assignee'],
        routingRules: ['workfront-task-completed'],
        example: {
            taskId: 'task-123',
            completionDate: '2024-01-15T10:30:00Z'
        }
    }, {
        createHandler: () => import('../workfront-event-handler'),
        getMetadata: () => EventTypeRegistry.getEventTypeMetadata('workfront.task.completed')!
    });

    // Brand Events
    EventTypeRegistry.registerEventType('com.adobe.b2a.assetsync.new', {
        type: 'com.adobe.b2a.assetsync.new',
        category: 'brand',
        description: 'Brand asset sync new event',
        handler: 'agency-assetsync-internal-handler',
        requiredFields: ['brandId', 'assetId', 'assetUrl'],
        optionalFields: ['metadata', 'customers'],
        routingRules: ['brand-asset-sync-new'],
        example: {
            brandId: 'brand-123',
            assetId: 'asset-456',
            assetUrl: 'https://aem.example.com/content/dam/asset.jpg'
        }
    }, {
        createHandler: () => import('../agency-assetsync-internal-handler'),
        getMetadata: () => EventTypeRegistry.getEventTypeMetadata('com.adobe.b2a.assetsync.new')!
    });

    EventTypeRegistry.registerEventType('com.adobe.b2a.assetsync.updated', {
        type: 'com.adobe.b2a.assetsync.updated',
        category: 'brand',
        description: 'Brand asset sync updated event',
        handler: 'agency-assetsync-internal-handler',
        requiredFields: ['brandId', 'assetId', 'changes'],
        optionalFields: ['assetUrl', 'metadata'],
        routingRules: ['brand-asset-sync-updated'],
        example: {
            brandId: 'brand-123',
            assetId: 'asset-456',
            changes: { metadata: { 'a2b__sync_on_change': 'true' } }
        }
    }, {
        createHandler: () => import('../agency-assetsync-internal-handler'),
        getMetadata: () => EventTypeRegistry.getEventTypeMetadata('com.adobe.b2a.assetsync.updated')!
    });

    EventTypeRegistry.registerEventType('com.adobe.b2a.assetsync.deleted', {
        type: 'com.adobe.b2a.assetsync.deleted',
        category: 'brand',
        description: 'Brand asset sync deleted event',
        handler: 'agency-assetsync-internal-handler',
        requiredFields: ['brandId', 'assetId'],
        optionalFields: ['assetPath'],
        routingRules: ['brand-asset-sync-deleted'],
        example: {
            brandId: 'brand-123',
            assetId: 'asset-456'
        }
    }, {
        createHandler: () => import('../agency-assetsync-internal-handler'),
        getMetadata: () => EventTypeRegistry.getEventTypeMetadata('com.adobe.b2a.assetsync.deleted')!
    });

    EventTypeRegistry.registerEventType('com.adobe.b2a.brand.registered', {
        type: 'com.adobe.b2a.brand.registered',
        category: 'brand',
        description: 'Brand registration event',
        handler: 'new-brand-registration',
        requiredFields: ['brandId', 'brandName', 'endpointUrl'],
        optionalFields: ['secret', 'logo', 'metadata'],
        routingRules: ['brand-registration'],
        example: {
            brandId: 'brand-123',
            brandName: 'Acme Corp',
            endpointUrl: 'https://acme.com/api/events'
        }
    }, {
        createHandler: () => import('../new-brand-registration'),
        getMetadata: () => EventTypeRegistry.getEventTypeMetadata('com.adobe.b2a.brand.registered')!
    });
}
