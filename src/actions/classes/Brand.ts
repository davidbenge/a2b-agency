import { IBrand } from '../types';

export class Brand implements IBrand {
    bid: string;
    secret: string;
    name: string;
    endPointUrl: string;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    enabledAt: Date | null;

    constructor(params: Partial<IBrand> = {}) {
        this.bid = params.bid || '';
        this.secret = params.secret || '';
        this.name = params.name || '';
        this.endPointUrl = params.endPointUrl || '';
        this.enabled = params.enabled || false;
        this.createdAt = params.createdAt ? new Date(params.createdAt) : new Date();
        this.updatedAt = params.updatedAt ? new Date(params.updatedAt) : new Date();
        this.enabledAt = params.enabledAt ? new Date(params.enabledAt) : null;
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
        if (!json.bid) missingProps.push('bid');
        if (!json.secret) missingProps.push('secret');
        if (!json.name) missingProps.push('name');
        if (!json.endPointUrl) missingProps.push('endPointUrl');

        if (missingProps.length > 0) {
            throw new Error(`Invalid Brand data: Missing required properties: ${missingProps.join(', ')}`);
        }

        return new Brand({
            bid: json.bid,
            secret: json.secret,
            name: json.name,
            endPointUrl: json.endPointUrl,
            enabled: json.enabled,
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
            bid: this.bid,
            secret: this.secret,
            name: this.name,
            endPointUrl: this.endPointUrl,
            enabled: this.enabled,
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
            this.bid &&
            this.secret &&
            this.name &&
            this.endPointUrl
        );
    }
} 