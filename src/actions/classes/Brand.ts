import { IBrand, IIoEvent, IBrandEventPostResponse } from '../types';
import axios from 'axios';

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
     * Send an Cloud event payload to this brand's configured endpoint
     * @param event - the IO event to send
     * @returns the response from the brand endpoint
     * @throws Error if the brand is disabled or the endPointUrl is missing
     * @throws Error if the event is not valid
     * @throws Error if the response from the brand endpoint is not valid
     * @throws Error if the response from the brand endpoint is not a valid IBrandEventPostResponse
     */
    async sendCloudEventToEndpoint(event: IIoEvent): Promise<IBrandEventPostResponse> {
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
            'X-A2B-Brand-Id': this.brandId,
            'X-A2B-Brand-Secret': this.secret
        };

        const cloudEvent = event.toCloudEvent();
        const requestPayload = (typeof (cloudEvent as any).toJSON === 'function')
            ? (cloudEvent as any).toJSON()
            : cloudEvent;
        
        try {
            const response = await axios.post(this.endPointUrl, requestPayload, { headers });
            const data: unknown = response?.data;

            // Basic shape validation; keep it simple and debuggable
            const valid = data && typeof data === 'object' &&
              typeof (data as any).eventType === 'string' &&
              (data as any).routingResult && typeof (data as any).routingResult === 'object';

            if (!valid) {
                const summary = {
                    status: typeof response?.status === 'number' ? response.status : undefined,
                    endpoint: this.endPointUrl,
                    requestHeaders: {
                        ...headers,
                        'X-A2B-Brand-Secret': headers['X-A2B-Brand-Secret'].replace(/.(?=.{4})/g, '*')
                    },
                    requestBody: requestPayload,
                    responseData: data
                };
                throw new Error(`invalid response from brand endpoint: ${JSON.stringify(summary)}`);
            }

            return data as IBrandEventPostResponse;

        } catch (unknownError: unknown) {
            const axiosErr = unknownError as any;
            const summary = {
                endpoint: this.endPointUrl,
                requestHeaders: {
                    ...headers,
                    'X-A2B-Brand-Secret': headers['X-A2B-Brand-Secret'].replace(/.(?=.{4})/g, '*')
                },
                requestBody: requestPayload,
                status: axiosErr?.response?.status,
                statusText: axiosErr?.response?.statusText,
                responseHeaders: axiosErr?.response?.headers,
                responseData: axiosErr?.response?.data,
                axiosMessage: axiosErr?.message,
                axiosName: axiosErr?.name
            };
            const wrapped = new Error(`Brand:sendIoEventToEndpoint failed: ${JSON.stringify(summary)}`);
            wrapped.name = 'BrandSendIoEventError';
            throw wrapped;
        }
    }
} 