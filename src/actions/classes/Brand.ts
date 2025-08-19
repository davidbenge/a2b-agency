import { IBrand, IIoEvent } from '../types';

export class Brand implements IBrand {
    brandId: string;
    secret: string;
    name: string;
    endPointUrl: string;
    enabled: boolean;
    logo?: string;
    createdAt: Date;
    updatedAt: Date;
    enabledAt: Date | null;

    constructor(params: Partial<IBrand> = {}) {
        this.brandId = params.brandId || '';
        this.secret = params.secret || '';
        this.name = params.name || '';
        this.endPointUrl = params.endPointUrl || '';
        this.enabled = params.enabled || false;
        this.logo = params.logo;
        this.createdAt = params.createdAt || new Date();
        this.updatedAt = params.updatedAt || new Date();
        this.enabledAt = params.enabledAt ?? null;
    }

    /**
     * Create a Brand instance from a JSON object
     * @param json JSON object containing brand data
     * @returns new Brand instance
     * @throws Error if JSON is invalid or missing required properties
     */
    static fromJSON(json: any): Brand {
        if (!json || typeof json !== 'object') {
            throw new Error('Invalid JSON: Input must be a valid JSON object');
        }

        const missingProps: string[] = [];
        if (!json.brandId) missingProps.push('brandId');
        if (!json.secret) missingProps.push('secret');
        if (!json.name) missingProps.push('name');
        if (!json.endPointUrl) missingProps.push('endPointUrl');

        if (missingProps.length > 0) {
            throw new Error(`Invalid Brand data: Missing required properties: ${missingProps.join(', ')}`);
        }

        return new Brand({
            brandId: json.brandId,
            secret: json.secret,
            name: json.name,
            endPointUrl: json.endPointUrl,
            enabled: json.enabled,
            logo: json.logo,
            createdAt: json.createdAt ? new Date(json.createdAt) : new Date(),
            updatedAt: json.updatedAt ? new Date(json.updatedAt) : new Date(),
            enabledAt: json.enabledAt ? new Date(json.enabledAt) : null
        });
    }

    /**
     * Convert the instance to a JSON object
     * @returns JSON representation of the brand
     */
    toJSON(): IBrand {
        return {
            brandId: this.brandId,
            secret: this.secret,
            name: this.name,
            endPointUrl: this.endPointUrl,
            enabled: this.enabled,
            logo: this.logo,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            enabledAt: this.enabledAt
        };
    }

    /**
     * Convert the instance to a JSON string
     * @returns JSON string representation of the brand
     */
    toJSONString(): string {
        return JSON.stringify(this.toJSON());
    }

    /**
     * Validate if all required fields are present
     * @returns true if all required fields are filled
     */
    isValid(): boolean {
        return Boolean(
            this.brandId &&
            this.secret &&
            this.name &&
            this.endPointUrl
        );
    }

    /**
     * Send an IO event payload to this brand's configured endpoint
     * @param event - the IO event to send
     * @param extraHeaders - optional additional headers to include
     */
    async sendIoEventToEndpoint(event: IIoEvent): Promise<Response> {
        if (!this.enabled) {
            throw new Error('Brand:sendIoEventToEndpoint: brand is disabled');
        }
        if (!this.endPointUrl) {
            throw new Error('Brand:sendIoEventToEndpoint: endPointUrl is missing');
        }

        const validation = event.validate();
        if (!validation.valid) {
            const message = `Brand:sendIoEventToEndpoint: event is not valid ${validation.message ? ` - ${validation.message}` : ''}`;
            throw new Error(message);
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-A2B-Brand-Id': this.brandId,
            'X-A2B-Brand-Secret': this.secret
        };

        const response = await fetch(this.endPointUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(event.toJSON())
        });

        return response;
    }
} 