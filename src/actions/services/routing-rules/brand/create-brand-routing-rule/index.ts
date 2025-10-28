/**
 * Create Brand Routing Rule
 * 
 * Adds a new routing rule to a brand-specific app event.
 * 
 * @param brandId - The brand ID
 * @param eventCode - The app event code
 * @param rule - The routing rule to add (IRoutingRule)
 * 
 * @returns {
 *   message: string,
 *   brandId: string,
 *   eventCode: string,
 *   ruleId: string,
 *   totalRules: number
 * }
 */

import { BrandManager } from '../../../../classes/BrandManager';
import { errorResponse } from "../../../../utils/common";

export async function main(params: any): Promise<any> {
    const logger = params.LOG_LEVEL ? console : { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} };
    
    try {
        const { brandId, eventCode, rule } = params;

        if (!brandId) {
            return errorResponse(400, 'Missing required parameter: brandId', logger);
        }

        if (!eventCode) {
            return errorResponse(400, 'Missing required parameter: eventCode', logger);
        }

        if (!rule) {
            return errorResponse(400, 'Missing required parameter: rule', logger);
        }

        // Validate rule structure
        if (!rule.id || !rule.name || rule.priority === undefined || rule.enabled === undefined || !rule.actions) {
            return errorResponse(400, 'Invalid rule: must include id, name, priority, enabled, and actions', logger);
        }

        if (!Array.isArray(rule.actions) || rule.actions.length === 0) {
            return errorResponse(400, 'Invalid rule: actions must be a non-empty array', logger);
        }

        logger.info(`create-brand-routing-rule: Adding rule ${rule.id} for brand ${brandId}, event: ${eventCode}`);

        const brandManager = new BrandManager(params.LOG_LEVEL || 'info');
        
        // Verify brand exists
        const brand = await brandManager.getBrand(brandId);
        if (!brand) {
            return errorResponse(404, `Brand with ID ${brandId} not found`, logger);
        }

        // Add timestamps if not present
        const ruleWithTimestamps = {
            ...rule,
            createdAt: rule.createdAt || new Date(),
            updatedAt: rule.updatedAt || new Date()
        };

        await brandManager.addBrandRoutingRule(brandId, eventCode, ruleWithTimestamps);

        // Get updated count
        const allRules = await brandManager.getBrandRoutingRules(brandId, eventCode);

        logger.info(`create-brand-routing-rule: Successfully added rule ${rule.id} for brand ${brandId}, event: ${eventCode}`);

        return {
            statusCode: 200,
            body: {
                message: `Routing rule ${rule.id} added successfully for brand ${brandId}, event ${eventCode}`,
                brandId,
                eventCode,
                ruleId: rule.id,
                totalRules: allRules.length
            }
        };
    } catch (error: unknown) {
        logger.error('create-brand-routing-rule: Error:', error);
        
        // Check for duplicate rule error
        if (error instanceof Error && error.message.includes('already exists')) {
            return errorResponse(409, error.message, logger);
        }
        
        return errorResponse(500, 'Failed to create brand routing rule', logger);
    }
}

