/**
 * Rules Manager
 * 
 * Manages routing rules for event types and provides rule evaluation capabilities.
 * This class is browser-safe and can be used in both Node.js actions and web frontend.
 */

import { Logger } from '../types';
import { 
    RoutingRule, 
    RuleCondition, 
    RuleAction, 
    RuleEvaluationResult,
    noOpLogger,
    EventTypeMetadata
} from '../types/rules-types';

export class RulesManager {
    private rules: Map<string, RoutingRule> = new Map();
    private logger: Logger;
    private eventTypeValidator?: (eventType: string) => boolean;
    private eventTypes: EventTypeMetadata[] = [];

    /**
     * Create a new RulesManager
     * @param logger - Optional logger (aioLogger in Node, consoleLogger in browser, or custom)
     * @param eventTypeValidator - Optional function to validate event types (e.g., EventTypeRegistry.isEventTypeSupported)
     * @param eventTypes - Optional array of event type metadata
     */
    constructor(logger?: Logger, eventTypeValidator?: (eventType: string) => boolean, eventTypes?: EventTypeMetadata[]) {
        this.logger = logger || noOpLogger;
        this.eventTypeValidator = eventTypeValidator;
        this.eventTypes = eventTypes || [];
    }

    /**
     * Set event types for rules management
     * @param eventTypes - Array of event type metadata
     */
    setEventTypes(eventTypes: EventTypeMetadata[]): void {
        this.eventTypes = eventTypes;
        this.logger.info(`Loaded ${eventTypes.length} event types`);
    }

    /**
     * Add a new routing rule
     */
    addRule(rule: RoutingRule): void {
        // Validate that the event type exists (if validator is provided)
        if (this.eventTypeValidator && !this.eventTypeValidator(rule.eventType)) {
            throw new Error(`Event type ${rule.eventType} is not supported`);
        }

        this.rules.set(rule.id, rule);
        this.logger.info(`Added routing rule: ${rule.id} for event type: ${rule.eventType}`);
    }

    /**
     * Get all rules for a specific event type
     */
    getRulesForEventType(eventType: string, direction?: 'inbound' | 'outbound', brandId?: string): RoutingRule[] {
        return Array.from(this.rules.values())
            .filter(rule => {
                if (rule.eventType !== eventType || !rule.enabled) {
                    return false;
                }
                
                // Filter by direction if specified
                if (direction && rule.direction !== 'both' && rule.direction !== direction) {
                    return false;
                }
                
                // Filter by brand if specified
                if (brandId && rule.targetBrands.length > 0 && !rule.targetBrands.includes(brandId)) {
                    return false;
                }
                
                return true;
            })
            .sort((a, b) => b.priority - a.priority); // Higher priority first
    }

    /**
     * Evaluate rules for an event
     */
    evaluateRules(eventType: string, eventData: any, direction?: 'inbound' | 'outbound', brandId?: string): RuleEvaluationResult[] {
        const rules = this.getRulesForEventType(eventType, direction, brandId);
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
    getEventTypesWithRules(direction?: 'inbound' | 'outbound', brandId?: string): Array<EventTypeMetadata & { rules: RoutingRule[] }> {
        return this.eventTypes.map(eventType => ({
            ...eventType,
            rules: this.getRulesForEventType(eventType.type || eventType.code || '', direction, brandId)
        }));
    }

    /**
     * Initialize default rules based on event type metadata
     */
    initializeDefaultRules(): void {
        for (const eventType of this.eventTypes) {
            const eventTypeId = eventType.type || eventType.code || '';
            // Create a default rule for each event type
            const defaultRule: RoutingRule = {
                id: `default-${eventTypeId}`,
                name: `Default rule for ${eventTypeId}`,
                description: `Default routing rule for ${eventTypeId} events`,
                eventType: eventTypeId,
                direction: 'both',
                targetBrands: [], // Empty means applies to all brands
                conditions: [],
                actions: [{
                    type: 'route',
                    target: eventType.handler || 'default-handler'
                }],
                enabled: true,
                priority: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            this.addRule(defaultRule);
        }

        this.logger.info(`Initialized ${this.eventTypes.length} default routing rules`);
    }

    /**
     * Export rules configuration
     */
    exportRules(): { rules: RoutingRule[], eventTypes: EventTypeMetadata[] } {
        return {
            rules: Array.from(this.rules.values()),
            eventTypes: this.eventTypes
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

    /**
     * Get rules that apply to a specific brand
     */
    getRulesForBrand(brandId: string): RoutingRule[] {
        return Array.from(this.rules.values())
            .filter(rule => rule.enabled && (rule.targetBrands.length === 0 || rule.targetBrands.includes(brandId)))
            .sort((a, b) => b.priority - a.priority);
    }

    /**
     * Get rules by direction (inbound/outbound)
     */
    getRulesByDirection(direction: 'inbound' | 'outbound'): RoutingRule[] {
        return Array.from(this.rules.values())
            .filter(rule => rule.enabled && (rule.direction === 'both' || rule.direction === direction))
            .sort((a, b) => b.priority - a.priority);
    }

    /**
     * Update rule target brands
     */
    updateRuleBrands(ruleId: string, targetBrands: string[]): boolean {
        const rule = this.rules.get(ruleId);
        if (rule) {
            rule.targetBrands = targetBrands;
            rule.updatedAt = new Date();
            this.logger.info(`Updated target brands for rule ${ruleId}: ${targetBrands.join(', ')}`);
            return true;
        }
        return false;
    }

    /**
     * Update rule direction
     */
    updateRuleDirection(ruleId: string, direction: 'inbound' | 'outbound' | 'both'): boolean {
        const rule = this.rules.get(ruleId);
        if (rule) {
            rule.direction = direction;
            rule.updatedAt = new Date();
            this.logger.info(`Updated direction for rule ${ruleId}: ${direction}`);
            return true;
        }
        return false;
    }
}