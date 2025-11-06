/**
 * Get Brand Routing Rules
 * 
 * Returns all routing rules for a specific brand and app event.
 * 
 * @param brandId - The brand ID
 * @param eventCode - The app event code (e.g., "com.adobe.a2b.registration.enabled")
 * 
 * @returns {
 *   brandId: string,
 *   eventCode: string,
 *   rules: IRoutingRule[],
 *   count: number
 * }
 */

import { BrandManager } from '../../../../classes/BrandManager';
import { errorResponse } from "../../../../utils/common";

export async function main(params: any): Promise<any> {
    const logger = params.LOG_LEVEL ? console : { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} };
    
    try {
        const { brandId, eventCode } = params;

        if (!brandId) {
            return errorResponse(400, 'Missing required parameter: brandId', logger);
        }

        if (!eventCode) {
            return errorResponse(400, 'Missing required parameter: eventCode', logger);
        }

        logger.info(`get-brand-routing-rules: Getting rules for brand ${brandId}, event: ${eventCode}`);

        const brandManager = new BrandManager(params.LOG_LEVEL || 'info');
        
        // Verify brand exists
        const brand = await brandManager.getBrand(brandId);
        if (!brand) {
            return errorResponse(404, `Brand with ID ${brandId} not found`, logger);
        }

        const rules = await brandManager.getBrandRoutingRules(brandId, eventCode);

        logger.info(`get-brand-routing-rules: Found ${rules.length} rules for brand ${brandId}, event: ${eventCode}`);

        return {
            statusCode: 200,
            body: {
                brandId,
                eventCode,
                rules,
                count: rules.length
            }
        };
    } catch (error: unknown) {
        logger.error('get-brand-routing-rules: Error:', error);
        return errorResponse(500, 'Failed to get brand routing rules', logger);
    }
}

