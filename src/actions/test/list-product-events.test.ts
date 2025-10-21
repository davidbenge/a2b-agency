/**
 * Tests for list-product-events action
 * 
 * Validates that the list-product-events action returns correct responses
 * matching the samples in docs/apis/list-product-events/
 */

import { 
    EVENT_REGISTRY, 
    getAllProductEventCodes, 
    getProductEventsByCategory, 
    getProductEventDefinition,
    getProductEventCategories,
    isValidProductEventCode,
    getProductEventCountByCategory
} from '../../shared/classes/ProductEventRegistry';
import { ProductEventDefinition } from '../../shared/types';

describe('Product Event Registry', () => {
    describe('getAllProductEventCodes', () => {
        it('should return all 2 product event codes', () => {
            const codes = getAllProductEventCodes();
            expect(codes).toHaveLength(2);
            expect(codes).toEqual([
                'aem.assets.asset.metadata_updated',
                'aem.assets.asset.processing_completed'
            ]);
        });
    });

    describe('getProductEventCategories', () => {
        it('should return product category', () => {
            const categories = getProductEventCategories();
            expect(categories).toHaveLength(1);
            expect(categories).toContain('product');
        });
    });

    describe('getProductEventCountByCategory', () => {
        it('should return correct count for product category', () => {
            const counts = getProductEventCountByCategory();
            expect(counts['product']).toBe(2);
        });
    });

    describe('getProductEventsByCategory', () => {
        it('should return 2 product events', () => {
            const events = getProductEventsByCategory('product');
            expect(events).toHaveLength(2);
            expect(events.every(e => e.category === 'product')).toBe(true);
        });
    });

    describe('getProductEventDefinition', () => {
        it('should return correct definition for AEM metadata updated event', () => {
            const event = getProductEventDefinition('aem.assets.asset.metadata_updated');
            expect(event).toBeDefined();
            expect(event?.code).toBe('aem.assets.asset.metadata_updated');
            expect(event?.category).toBe('product');
            expect(event?.name).toBe('AEM Asset Metadata Updated');
            expect(event?.handlerActionName).toBe('a2b-agency/agency-assetsync-internal-handler-metadata-updated');
            expect(event?.callBlocking).toBe(true);
        });

        it('should return correct definition for AEM processing completed event', () => {
            const event = getProductEventDefinition('aem.assets.asset.processing_completed');
            expect(event).toBeDefined();
            expect(event?.code).toBe('aem.assets.asset.processing_completed');
            expect(event?.category).toBe('product');
            expect(event?.name).toBe('AEM Assets Processing Completed');
            expect(event?.handlerActionName).toBe('a2b-agency/agency-assetsync-internal-handler-process-complete');
            expect(event?.callBlocking).toBe(true);
        });

        it('should return undefined for invalid event code', () => {
            const event = getProductEventDefinition('invalid.event.code');
            expect(event).toBeUndefined();
        });

        it('should have required fields for all events', () => {
            const allCodes = getAllProductEventCodes();
            allCodes.forEach(code => {
                const event = getProductEventDefinition(code);
                expect(event).toBeDefined();
                expect(event?.requiredFields).toBeDefined();
                expect(Array.isArray(event?.requiredFields)).toBe(true);
                expect(event!.requiredFields.length).toBeGreaterThan(0);
            });
        });

        it('should have handlerActionName for all events', () => {
            const allCodes = getAllProductEventCodes();
            allCodes.forEach(code => {
                const event = getProductEventDefinition(code);
                expect(event).toBeDefined();
                expect(event?.handlerActionName).toBeDefined();
                expect(typeof event?.handlerActionName).toBe('string');
                expect(event!.handlerActionName.length).toBeGreaterThan(0);
            });
        });

        it('should have callBlocking defined for all events', () => {
            const allCodes = getAllProductEventCodes();
            allCodes.forEach(code => {
                const event = getProductEventDefinition(code);
                expect(event).toBeDefined();
                expect(event?.callBlocking).toBeDefined();
                expect(typeof event?.callBlocking).toBe('boolean');
            });
        });
    });

    describe('isValidProductEventCode', () => {
        it('should return true for valid event codes', () => {
            expect(isValidProductEventCode('aem.assets.asset.metadata_updated')).toBe(true);
            expect(isValidProductEventCode('aem.assets.asset.processing_completed')).toBe(true);
        });

        it('should return false for invalid event codes', () => {
            expect(isValidProductEventCode('invalid.event.code')).toBe(false);
            expect(isValidProductEventCode('com.adobe.a2b.assetsync.new')).toBe(false);
            expect(isValidProductEventCode('')).toBe(false);
        });
    });

    describe('Product Event Registry Structure', () => {
        it('should have all required fields for each event', () => {
            Object.values(EVENT_REGISTRY).forEach((event: ProductEventDefinition) => {
                expect(event.code).toBeDefined();
                expect(typeof event.code).toBe('string');
                
                expect(event.category).toBeDefined();
                expect(event.category).toBe('product');
                
                expect(event.name).toBeDefined();
                expect(typeof event.name).toBe('string');
                
                expect(event.description).toBeDefined();
                expect(typeof event.description).toBe('string');
                
                expect(event.version).toBeDefined();
                expect(typeof event.version).toBe('string');
                
                expect(event.requiredFields).toBeDefined();
                expect(Array.isArray(event.requiredFields)).toBe(true);
                
                expect(event.handlerActionName).toBeDefined();
                expect(typeof event.handlerActionName).toBe('string');
                
                expect(event.callBlocking).toBeDefined();
                expect(typeof event.callBlocking).toBe('boolean');
            });
        });

        it('should not have sendSecretHeader or sendSignedKey (product events dont use these)', () => {
            Object.values(EVENT_REGISTRY).forEach((event: ProductEventDefinition) => {
                expect((event as any).sendSecretHeader).toBeUndefined();
                expect((event as any).sendSignedKey).toBeUndefined();
            });
        });

        it('should not have injectedObjects (product events dont inject agency data)', () => {
            Object.values(EVENT_REGISTRY).forEach((event: ProductEventDefinition) => {
                expect((event as any).injectedObjects).toBeUndefined();
            });
        });
    });
});

describe('Product Event Data Validation', () => {
    describe('AEM Events', () => {
        it('should have correct required fields for metadata updated event', () => {
            const event = getProductEventDefinition('aem.assets.asset.metadata_updated');
            expect(event?.requiredFields).toBeDefined();
            expect(event?.requiredFields).toContain('assetId,repositoryMetadata');
        });

        it('should have correct required fields for processing completed event', () => {
            const event = getProductEventDefinition('aem.assets.asset.processing_completed');
            expect(event?.requiredFields).toBeDefined();
            expect(event?.requiredFields).toContain('assetId,repositoryMetadata');
        });

        it('should have handlerActionName pointing to internal handlers', () => {
            const metadataEvent = getProductEventDefinition('aem.assets.asset.metadata_updated');
            const processingEvent = getProductEventDefinition('aem.assets.asset.processing_completed');
            
            expect(metadataEvent?.handlerActionName).toBe('a2b-agency/agency-assetsync-internal-handler-metadata-updated');
            expect(processingEvent?.handlerActionName).toBe('a2b-agency/agency-assetsync-internal-handler-process-complete');
        });
    });
});

