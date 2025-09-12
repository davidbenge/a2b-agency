/**
 * Rules Manager
 * 
 * Manages routing rules for event types and provides rule evaluation capabilities.
 */

import { EventTypeRegistry, EventTypeMetadata } from './EventTypeRegistry';
import aioLogger from '@adobe/aio-lib-core-logging';

export interface RoutingRule {
    id: string;
    name: string;
    description: string;
    eventType: string;
    conditions: RuleCondition[];
    actions: RuleAction[];
    enabled: boolean;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface RuleCondition {
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'exists' | 'notExists';
    value: any;
    logicalOperator?: 'AND' | 'OR';
}

export interface RuleAction {
    type: 'route' | 'transform' | 'filter' | 'log';
    target?: string;
    parameters?: Record<string, any>;
}

export interface RuleEvaluationResult {
    ruleId: string;
    matched: boolean;
    actions: RuleAction[];
    executionTime: number;
}

export class RulesManager {
    private rules: Map<string, RoutingRule> = new Map();
    private logger: any;

    constructor() {
        this.logger = aioLogger('rules-manager', { level: 'info' });
    }

    /**
     * Add a new routing rule
     */
    addRule(rule: RoutingRule): void {
        // Validate that the event type exists
        if (!EventTypeRegistry.isEventTypeSupported(rule.eventType)) {
            throw new Error(`Event type ${rule.eventType} is not supported`);
        }

        this.rules.set(rule.id, rule);
        this.logger.info(`Added routing rule: ${rule.id} for event type: ${rule.eventType}`);
    }

    /**
     * Get all rules for a specific event type
     */
    getRulesForEventType(eventType: string): RoutingRule[] {
        return Array.from(this.rules.values())
            .filter(rule => rule.eventType === eventType && rule.enabled)
            .sort((a, b) => b.priority - a.priority); // Higher priority first
    }

    /**
     * Evaluate rules for an event
     */
    evaluateRules(eventType: string, eventData: any): RuleEvaluationResult[] {
        const rules = this.getRulesForEventType(eventType);
        const results: RuleEvaluationResult[] = [];

        for (const rule of rules) {
            const startTime = Date.now();
            const matched = this.evaluateRule(rule, eventData);
            const executionTime = Date.now() - startTime;

            results.push({
                ruleId: rule.id,
                matched,
                actions: matched ? rule.actions : [],
                executionTime
            });

            // If rule matched and has high priority, we might want to stop here
            if (matched && rule.priority >= 100) {
                break;
            }
        }

        return results;
    }

    /**
     * Evaluate a single rule against event data
     */
    private evaluateRule(rule: RoutingRule, eventData: any): boolean {
        if (rule.conditions.length === 0) {
            return true; // No conditions means always match
        }

        let result = true;
        let logicalOperator: 'AND' | 'OR' = 'AND';

        for (let i = 0; i < rule.conditions.length; i++) {
            const condition = rule.conditions[i];
            const conditionResult = this.evaluateCondition(condition, eventData);

            if (i === 0) {
                result = conditionResult;
            } else {
                if (logicalOperator === 'AND') {
                    result = result && conditionResult;
                } else {
                    result = result || conditionResult;
                }
            }

            logicalOperator = condition.logicalOperator || 'AND';
        }

        return result;
    }

    /**
     * Evaluate a single condition
     */
    private evaluateCondition(condition: RuleCondition, eventData: any): boolean {
        const fieldValue = this.getNestedFieldValue(eventData, condition.field);

        switch (condition.operator) {
            case 'equals':
                return fieldValue === condition.value;
            case 'contains':
                return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
            case 'startsWith':
                return typeof fieldValue === 'string' && fieldValue.startsWith(condition.value);
            case 'endsWith':
                return typeof fieldValue === 'string' && fieldValue.endsWith(condition.value);
            case 'regex':
                return typeof fieldValue === 'string' && new RegExp(condition.value).test(fieldValue);
            case 'exists':
                return fieldValue !== undefined && fieldValue !== null;
            case 'notExists':
                return fieldValue === undefined || fieldValue === null;
            default:
                return false;
        }
    }

    /**
     * Get nested field value from object using dot notation
     */
    private getNestedFieldValue(obj: any, fieldPath: string): any {
        return fieldPath.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Get all available event types with their routing rules
     */
    getEventTypesWithRules(): Array<EventTypeMetadata & { rules: RoutingRule[] }> {
        const eventTypes = EventTypeRegistry.getAllEventTypes();
        
        return eventTypes.map(eventType => ({
            ...eventType,
            rules: this.getRulesForEventType(eventType.type)
        }));
    }

    /**
     * Initialize default rules based on event type metadata
     */
    initializeDefaultRules(): void {
        const eventTypes = EventTypeRegistry.getAllEventTypes();

        for (const eventType of eventTypes) {
            // Create a default rule for each event type
            const defaultRule: RoutingRule = {
                id: `default-${eventType.type}`,
                name: `Default rule for ${eventType.type}`,
                description: `Default routing rule for ${eventType.type} events`,
                eventType: eventType.type,
                conditions: [],
                actions: [{
                    type: 'route',
                    target: eventType.handler
                }],
                enabled: true,
                priority: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.addRule(defaultRule);
        }

        this.logger.info(`Initialized ${eventTypes.length} default routing rules`);
    }

    /**
     * Export rules configuration
     */
    exportRules(): { rules: RoutingRule[], eventTypes: EventTypeMetadata[] } {
        return {
            rules: Array.from(this.rules.values()),
            eventTypes: EventTypeRegistry.getAllEventTypes()
        };
    }

    /**
     * Import rules configuration
     */
    importRules(config: { rules: RoutingRule[], eventTypes?: EventTypeMetadata[] }): void {
        // Clear existing rules
        this.rules.clear();

        // Add imported rules
        for (const rule of config.rules) {
            this.addRule(rule);
        }

        this.logger.info(`Imported ${config.rules.length} routing rules`);
    }
}
