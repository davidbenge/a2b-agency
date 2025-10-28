/**
 * Update Brand Routing Rule
 * 
 * Updates an existing routing rule for a brand-specific app event.
 * 
 * @param brandId - The brand ID
 * @param eventCode - The app event code
 * @param ruleId - The ID of the rule to update
 * @param updates - Partial updates to apply (Partial<IRoutingRule>)
 * 
 * @returns {
 *   message: string,
 *   brandId: string,
 *   eventCode: string,
 *   ruleId: string
 * }
 */

import { BrandManager } from '../../../../classes/BrandManager';
import { errorResponse } from "../../../../utils/common";

export async function main(params: any): Promise<any> {
    const logger = params.LOG_LEVEL ? console : { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} };
    
    try {
        const { brandId, eventCode, ruleId, updates } = params;

        if (!brandId) {
            return errorResponse(400, 'Missing required parameter: brandId', logger);
        }

        if (!eventCode) {
            return errorResponse(400, 'Missing required parameter: eventCode', logger);
        }

        if (!ruleId) {
            return errorResponse(400, 'Missing required parameter: ruleId', logger);
        }

        if (!updates || typeof updates !== 'object') {
            return errorResponse(400, 'Missing or invalid parameter: updates', logger);
        }

        // Prevent changing the rule ID
        if (updates.id && updates.id !== ruleId) {
            return errorResponse(400, 'Cannot change rule ID', logger);
        }

        logger.info(`update-brand-routing-rule: Updating rule ${ruleId} for brand ${brandId}, event: ${eventCode}`);

        const brandManager = new BrandManager(params.LOG_LEVEL || 'info');
        
        // Verify brand exists
        const brand = await brandManager.getBrand(brandId);
        if (!brand) {
            return errorResponse(404, `Brand with ID ${brandId} not found`, logger);
        }

        // Add updatedAt timestamp
        const updatesWithTimestamp = {
            ...updates,
            updatedAt: new Date()
        };

        await brandManager.updateBrandRoutingRule(brandId, eventCode, ruleId, updatesWithTimestamp);

        logger.info(`update-brand-routing-rule: Successfully updated rule ${ruleId} for brand ${brandId}, event: ${eventCode}`);

        return {
            statusCode: 200,
            body: {
                message: `Routing rule ${ruleId} updated successfully for brand ${brandId}, event ${eventCode}`,
                brandId,
                eventCode,
                ruleId
            }
        };
    } catch (error: unknown) {
        logger.error('update-brand-routing-rule: Error:', error);
        
        // Check for not found error
        if (error instanceof Error && error.message.includes('not found')) {
            return errorResponse(404, error.message, logger);
        }
        
        return errorResponse(500, 'Failed to update brand routing rule', logger);
    }
}

