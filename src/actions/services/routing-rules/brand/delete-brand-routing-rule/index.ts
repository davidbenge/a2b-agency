/**
 * Delete Brand Routing Rule
 * 
 * Deletes a routing rule from a brand-specific app event.
 * 
 * @param brandId - The brand ID
 * @param eventCode - The app event code
 * @param ruleId - The ID of the rule to delete
 * 
 * @returns {
 *   message: string,
 *   brandId: string,
 *   eventCode: string,
 *   ruleId: string,
 *   remainingRules: number
 * }
 */

import { BrandManager } from '../../../../classes/BrandManager';
import { errorResponse } from "../../../../utils/common";

export async function main(params: any): Promise<any> {
    const logger = params.LOG_LEVEL ? console : { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} };
    
    try {
        const { brandId, eventCode, ruleId } = params;

        if (!brandId) {
            return errorResponse(400, 'Missing required parameter: brandId', logger);
        }

        if (!eventCode) {
            return errorResponse(400, 'Missing required parameter: eventCode', logger);
        }

        if (!ruleId) {
            return errorResponse(400, 'Missing required parameter: ruleId', logger);
        }

        logger.info(`delete-brand-routing-rule: Deleting rule ${ruleId} for brand ${brandId}, event: ${eventCode}`);

        const brandManager = new BrandManager(params.LOG_LEVEL || 'info');
        
        // Verify brand exists
        const brand = await brandManager.getBrand(brandId);
        if (!brand) {
            return errorResponse(404, `Brand with ID ${brandId} not found`, logger);
        }

        await brandManager.deleteBrandRoutingRule(brandId, eventCode, ruleId);

        // Get remaining count
        const remainingRules = await brandManager.getBrandRoutingRules(brandId, eventCode);

        logger.info(`delete-brand-routing-rule: Successfully deleted rule ${ruleId} for brand ${brandId}, event: ${eventCode}`);

        return {
            statusCode: 200,
            body: {
                message: `Routing rule ${ruleId} deleted successfully for brand ${brandId}, event ${eventCode}`,
                brandId,
                eventCode,
                ruleId,
                remainingRules: remainingRules.length
            }
        };
    } catch (error: unknown) {
        logger.error('delete-brand-routing-rule: Error:', error);
        
        // Check for not found error
        if (error instanceof Error && error.message.includes('not found')) {
            return errorResponse(404, error.message, logger);
        }
        
        return errorResponse(500, 'Failed to delete brand routing rule', logger);
    }
}

