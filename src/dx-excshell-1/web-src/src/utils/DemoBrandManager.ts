/**
 * Demo Mode BrandManager for Frontend
 * 
 * This is a browser-compatible version of the BrandManager class specifically
 * designed for demo mode. It provides the same interface as the backend 
 * BrandManager but works with in-memory storage instead of Adobe I/O state/file stores.
 */

import { Brand } from "../../../../actions/classes/Brand";
import { IBrand } from "../../../../actions/types";

export class DemoBrandManager {
    private brands: Map<string, Brand> = new Map();

    /**
     * Factory method to create a Brand from JSON data
     * @param json JSON object containing brand data
     * @returns new Brand instance
     * @throws Error if JSON is invalid or missing required properties
     * 
     * Note: secret is optional because API responses exclude it for security.
     * Demo mode and mock data will include secrets, but production API calls will not.
     */
    static getBrandFromJson(json: any): Brand {
        if (!json || typeof json !== 'object') {
            throw new Error('Invalid JSON: Input must be a valid JSON object');
        }

        const missingProps: string[] = [];
        if (!json.brandId) missingProps.push('brandId');
        // secret is optional - API responses don't include it for security
        if (!json.name) missingProps.push('name');
        if (!json.endPointUrl) missingProps.push('endPointUrl');

        if (missingProps.length > 0) {
            throw new Error(`Invalid Brand data: Missing required properties: ${missingProps.join(', ')}`);
        }

        return new Brand({
            brandId: json.brandId,
            secret: json.secret, // Optional - will be empty string if not provided
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
     * Factory method to create a new Brand
     * @param data Partial brand data
     * @returns new Brand instance
     */
    static createBrand(data: Partial<IBrand>): Brand {
        const now = new Date();
        return new Brand({
            brandId: data.brandId || this.generateBrandId(),
            secret: data.secret || this.generateSecret(),
            name: data.name || '',
            endPointUrl: data.endPointUrl || '',
            enabled: data.enabled ?? false,
            logo: data.logo,
            createdAt: data.createdAt ?? now,
            updatedAt: data.updatedAt ?? now,
            enabledAt: data.enabledAt ?? null
        });
    }

    private static generateBrandId(): string {
        return `brand-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private static generateSecret(): string {
        return Math.random().toString(36).substr(2, 15) + Math.random().toString(36).substr(2, 15);
    }

    /**
     * Get a brand by its ID (demo mode - from memory)
     * @param brandId The brand id to get
     * @returns The brand or undefined if not found
     */
    getBrand(brandId: string): Brand | undefined {
        return this.brands.get(brandId);
    }

    /**
     * Save a brand (demo mode - to memory)
     * @param brand The brand to save
     * @returns The saved brand
     */
    saveBrand(brand: Brand): Brand {
        this.brands.set(brand.brandId, brand);
        return brand;
    }

    /**
     * Delete a brand (demo mode - from memory)
     * @param brandId The brand id to delete
     */
    deleteBrand(brandId: string): void {
        this.brands.delete(brandId);
    }

    /**
     * Get all brands (demo mode - from memory)
     * @returns Array of all brands
     */
    getAllBrands(): Brand[] {
        return Array.from(this.brands.values());
    }

    /**
     * Initialize with mock data for demo mode
     * @param mockBrands Array of mock brands to initialize with
     */
    initializeWithMockData(mockBrands: Brand[]): void {
        this.brands.clear();
        mockBrands.forEach(brand => {
            this.brands.set(brand.brandId, brand);
        });
    }

    /**
     * Clear all brands (demo mode)
     */
    clear(): void {
        this.brands.clear();
    }
}

// Create a singleton instance for demo mode
export const demoBrandManager = new DemoBrandManager();
