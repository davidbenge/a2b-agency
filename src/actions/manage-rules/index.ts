/**
 * Manage Rules Action
 * 
 * Provides REST API endpoints for managing routing rules for event types.
 */

import { errorResponse, checkMissingRequestInputs } from "../utils/common";
import aioLogger from "@adobe/aio-lib-core-logging";
import { RulesManager, RoutingRule } from "../classes/RulesManager";
import { EventTypeRegistry, initializeEventRegistry } from "../classes/EventTypeRegistry";
import { randomUUID } from "crypto";

export async function main(params: any): Promise<any> {
    const logger = aioLogger("manage-rules", { level: params.LOG_LEVEL || "info" });

    try {
        // Initialize the event registry
        initializeEventRegistry();

        const requiredParams: string[] = [];
        const requiredHeaders: string[] = [];
        const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders);
        if (errorMessage) {
            return errorResponse(400, errorMessage, logger);
        }

        const method = params.__ow_method || 'GET';
        const rulesManager = new RulesManager();

        // Initialize default rules if none exist
        rulesManager.initializeDefaultRules();

        switch (method) {
            case 'GET':
                return handleGetRules(params, rulesManager, logger);
            case 'POST':
                return handleCreateRule(params, rulesManager, logger);
            case 'PUT':
                return handleUpdateRule(params, rulesManager, logger);
            case 'DELETE':
                return handleDeleteRule(params, rulesManager, logger);
            default:
                return errorResponse(405, `Method ${method} not allowed`, logger);
        }

    } catch (error: unknown) {
        logger.error('Error in manage-rules action', error as any);
        return {
            statusCode: 500,
            body: {
                message: 'Error managing rules',
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        };
    }
}

async function handleGetRules(params: any, rulesManager: RulesManager, logger: any): Promise<any> {
    const eventType = params.eventType;
    const includeEventTypes = params.includeEventTypes === 'true';

    if (eventType) {
        // Get rules for specific event type
        const rules = rulesManager.getRulesForEventType(eventType);
        const eventTypeMetadata = EventTypeRegistry.getEventTypeMetadata(eventType);

        return {
            statusCode: 200,
            body: {
                message: `Rules for event type: ${eventType}`,
                data: {
                    eventType: eventTypeMetadata,
                    rules: rules,
                    count: rules.length
                }
            }
        };
    } else {
        // Get all rules with event types
        const eventTypesWithRules = rulesManager.getEventTypesWithRules();

        return {
            statusCode: 200,
            body: {
                message: 'All routing rules retrieved successfully',
                data: {
                    eventTypesWithRules: eventTypesWithRules,
                    totalEventTypes: eventTypesWithRules.length,
                    totalRules: eventTypesWithRules.reduce((sum, et) => sum + et.rules.length, 0)
                }
            }
        };
    }
}

async function handleCreateRule(params: any, rulesManager: RulesManager, logger: any): Promise<any> {
    const requiredFields = ['name', 'eventType', 'conditions', 'actions'];
    const missingFields = requiredFields.filter(field => !params[field]);

    if (missingFields.length > 0) {
        return errorResponse(400, `Missing required fields: ${missingFields.join(', ')}`, logger);
    }

    const rule: RoutingRule = {
        id: params.id || randomUUID(),
        name: params.name,
        description: params.description || '',
        eventType: params.eventType,
        conditions: params.conditions,
        actions: params.actions,
        enabled: params.enabled !== false, // Default to true
        priority: params.priority || 10,
        direction: params.direction || 'inbound',
        targetBrands: params.targetBrands || ['*'],
        createdAt: new Date(),
        updatedAt: new Date()
    };

    try {
        rulesManager.addRule(rule);
        logger.info(`Created new rule: ${rule.id} for event type: ${rule.eventType}`);

        return {
            statusCode: 201,
            body: {
                message: 'Rule created successfully',
                data: rule
            }
        };
    } catch (error: unknown) {
        return errorResponse(400, `Error creating rule: ${error instanceof Error ? error.message : 'Unknown error'}`, logger);
    }
}

async function handleUpdateRule(params: any, rulesManager: RulesManager, logger: any): Promise<any> {
    const ruleId = params.ruleId;
    if (!ruleId) {
        return errorResponse(400, 'ruleId is required for updates', logger);
    }

    // This would require implementing update functionality in RulesManager
    // For now, return a placeholder response
    return {
        statusCode: 501,
        body: {
            message: 'Rule updates not yet implemented',
            note: 'Use DELETE and POST to modify rules'
        }
    };
}

async function handleDeleteRule(params: any, rulesManager: RulesManager, logger: any): Promise<any> {
    const ruleId = params.ruleId;
    if (!ruleId) {
        return errorResponse(400, 'ruleId is required for deletion', logger);
    }

    // This would require implementing delete functionality in RulesManager
    // For now, return a placeholder response
    return {
        statusCode: 501,
        body: {
            message: 'Rule deletion not yet implemented',
            note: 'Feature coming soon'
        }
    };
}
