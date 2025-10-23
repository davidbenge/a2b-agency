/**
 * List Brand Routing Rules
 * 
 * Returns a list of all app event codes that have brand-specific routing rules configured.
 * 
 * @param brandId - The brand ID
 * 
 * @returns {
 *   brandId: string,
 *   eventCodes: string[],  // Array of event codes with routing rules
 *   count: number          // Total count
 * }
 */

import { BrandManager } from '../../../../classes/BrandManager';
import { errorResponse } from "../../../../utils/common";

export async function main(params: any): Promise<any> {
    const logger = params.LOG_LEVEL ? console : { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} };
    
    try {
        const { brandId } = params;

        if (!brandId) {
            return errorResponse(400, 'Missing required parameter: brandId', logger);
        }

        logger.info(`list-brand-routing-rules: Getting event codes for brand: ${brandId}`);

        const brandManager = new BrandManager(params.LOG_LEVEL || 'info');
        
        // Verify brand exists
        const brand = await brandManager.getBrand(brandId);
        if (!brand) {
            return errorResponse(404, `Brand with ID ${brandId} not found`, logger);
        }

        const eventCodes = await brandManager.getBrandEventCodesWithRoutingRules(brandId);

        logger.info(`list-brand-routing-rules: Found ${eventCodes.length} app events with routing rules for brand: ${brandId}`);

        return {
            statusCode: 200,
            body: {
                brandId,
                eventCodes,
                count: eventCodes.length
            }
        };
    } catch (error: unknown) {
        logger.error('list-brand-routing-rules: Error:', error);
        return errorResponse(500, 'Failed to list brand routing rules', logger);
    }
}

