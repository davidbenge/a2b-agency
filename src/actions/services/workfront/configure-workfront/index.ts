/**
 * Configure Workfront Action
 * 
 * Saves Workfront configuration (server URL, company, group) to a Brand
 * 
 * Input params:
 * - brandId: Brand ID to configure
 * - workfrontServerUrl: Base URL of Workfront instance
 * - workfrontCompanyId: Selected company ID
 * - workfrontCompanyName: Company name for display
 * - workfrontGroupId: Selected group ID
 * - workfrontGroupName: Group name for display
 * - APPLICATION_RUNTIME_INFO: Runtime info (JSON string)
 * - LOG_LEVEL: Logging level (optional)
 */

import aioLogger from '@adobe/aio-lib-core-logging';
import { BrandManager } from '../../../classes/BrandManager';
import { ApplicationRuntimeInfo } from '../../../classes/ApplicationRuntimeInfo';

interface ActionParams {
    brandId: string;
    workfrontServerUrl: string;
    workfrontCompanyId: string;
    workfrontCompanyName: string;
    workfrontGroupId: string;
    workfrontGroupName: string;
    APPLICATION_RUNTIME_INFO: string;
    LOG_LEVEL?: string;
}

/**
 * Main action handler
 */
export async function main(params: ActionParams): Promise<any> {
    const logger = aioLogger('configure-workfront', { level: params.LOG_LEVEL || 'info' });
    
    try {
        logger.info('Configuring Workfront for brand', { brandId: params.brandId });

        // Validate required parameters
        const missing: string[] = [];
        if (!params.brandId) missing.push('brandId');
        if (!params.workfrontServerUrl) missing.push('workfrontServerUrl');
        if (!params.workfrontCompanyId) missing.push('workfrontCompanyId');
        if (!params.workfrontCompanyName) missing.push('workfrontCompanyName');
        if (!params.workfrontGroupId) missing.push('workfrontGroupId');
        if (!params.workfrontGroupName) missing.push('workfrontGroupName');
        if (!params.APPLICATION_RUNTIME_INFO) missing.push('APPLICATION_RUNTIME_INFO');

        if (missing.length > 0) {
            return {
                statusCode: 400,
                body: {
                    error: 'Missing required parameters',
                    missing
                }
            };
        }

        // Parse runtime info
        const runtimeInfo = new ApplicationRuntimeInfo(
            JSON.parse(params.APPLICATION_RUNTIME_INFO)
        );

        // Initialize Brand Manager
        const brandManager = new BrandManager(params.LOG_LEVEL || 'info');

        // Get existing brand
        const brand = await brandManager.getBrand(params.brandId);
        if (!brand) {
            return {
                statusCode: 404,
                body: {
                    error: 'Brand not found',
                    brandId: params.brandId
                }
            };
        }

        // Update brand with Workfront configuration
        // Update the brand object properties
        (brand as any).workfrontServerUrl = params.workfrontServerUrl;
        (brand as any).workfrontCompanyId = params.workfrontCompanyId;
        (brand as any).workfrontCompanyName = params.workfrontCompanyName;
        (brand as any).workfrontGroupId = params.workfrontGroupId;
        (brand as any).workfrontGroupName = params.workfrontGroupName;
        (brand as any).workfrontEventSubscriptions = []; // Will be populated when subscriptions are created
        
        // Save the updated brand
        const updatedBrand = await brandManager.saveBrand(brand);

        logger.info('Successfully configured Workfront for brand', { 
            brandId: params.brandId,
            workfrontCompanyId: params.workfrontCompanyId,
            workfrontGroupId: params.workfrontGroupId
        });

        return {
            statusCode: 200,
            body: {
                success: true,
                brand: updatedBrand.toSafeJSON()
            }
        };

    } catch (error: unknown) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.error('Error configuring Workfront', errorObj);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        return {
            statusCode: 500,
            body: {
                error: 'Failed to configure Workfront',
                message: errorMessage
            }
        };
    }
}

