import { IBrand } from "../../../../shared/types";

/**
 * Simple Brand class for frontend demo mode
 * Does not include Node-specific dependencies like axios
 */
export class Brand implements Omit<IBrand, 'secret'> {
    readonly brandId: string;
    readonly name: string;
    readonly endPointUrl: string;
    readonly enabled: boolean;
    readonly logo?: string;
    readonly imsOrgName?: string;
    readonly imsOrgId?: string;
    readonly createdAt: Date | string;
    readonly updatedAt: Date | string;
    readonly enabledAt: Date | string | null;
    readonly workfrontServerUrl?: string;
    readonly workfrontCompanyId?: string;
    readonly workfrontCompanyName?: string;
    readonly workfrontGroupId?: string;
    readonly workfrontGroupName?: string;
    readonly workfrontEventSubscriptions?: string[];

    constructor(params: Omit<IBrand, 'secret'>) {
        this.brandId = params.brandId;
        this.name = params.name;
        this.endPointUrl = params.endPointUrl;
        this.enabled = params.enabled;
        this.logo = params.logo;
        this.imsOrgName = params.imsOrgName;
        this.imsOrgId = params.imsOrgId;
        this.createdAt = params.createdAt;
        this.updatedAt = params.updatedAt;
        this.enabledAt = params.enabledAt;
        this.workfrontServerUrl = params.workfrontServerUrl;
        this.workfrontCompanyId = params.workfrontCompanyId;
        this.workfrontCompanyName = params.workfrontCompanyName;
        this.workfrontGroupId = params.workfrontGroupId;
        this.workfrontGroupName = params.workfrontGroupName;
        this.workfrontEventSubscriptions = params.workfrontEventSubscriptions;
    }

    /**
     * Convert the instance to a JSON object
     * @returns JSON representation of the brand
     */
    toJSON(): IBrand {
        return {
            brandId: this.brandId,
            name: this.name,
            endPointUrl: this.endPointUrl,
            enabled: this.enabled,
            logo: this.logo,
            imsOrgName: this.imsOrgName,
            imsOrgId: this.imsOrgId,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            enabledAt: this.enabledAt,
            workfrontServerUrl: this.workfrontServerUrl,
            workfrontCompanyId: this.workfrontCompanyId,
            workfrontCompanyName: this.workfrontCompanyName,
            workfrontGroupId: this.workfrontGroupId,
            workfrontGroupName: this.workfrontGroupName,
            workfrontEventSubscriptions: this.workfrontEventSubscriptions
        };
    }

    /**
     * Convert the instance to a safe JSON object WITHOUT the secret
     * Use this for API responses to frontend/external systems
     * @returns JSON representation of the brand without the secret field
     */
        toSafeJSON(): Omit<IBrand, 'secret'> {
            return {
                brandId: this.brandId,
                name: this.name,
                endPointUrl: this.endPointUrl,
                enabled: this.enabled,
                logo: this.logo,
                imsOrgName: this.imsOrgName,
                imsOrgId: this.imsOrgId,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt,
                enabledAt: this.enabledAt,
                workfrontServerUrl: this.workfrontServerUrl,
                workfrontCompanyId: this.workfrontCompanyId,
                workfrontCompanyName: this.workfrontCompanyName,
                workfrontGroupId: this.workfrontGroupId,
                workfrontGroupName: this.workfrontGroupName,
                workfrontEventSubscriptions: this.workfrontEventSubscriptions
            };
        }
}