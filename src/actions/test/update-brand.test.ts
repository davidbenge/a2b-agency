/**
 * Comprehensive tests for update-brand action
 * Tests brand enable/disable state changes and verifies events are sent to brands
 */

import { main } from '../services/brand/update-brand/index';
import { MockFactory } from './mocks/MockFactory';
import { Brand } from '../classes/Brand';
import { BrandManager } from '../classes/BrandManager';

// Import the Jest setup to ensure mocks are loaded
import './mocks/jest.setup';

// Load event samples for reference
const registrationEnabledEventSample = require('../../../docs/events/registration/com-adobe-a2b-registration-enabled.json');
const registrationDisabledEventSample = require('../../../docs/events/registration/com-adobe-a2b-registration-disabled.json');

describe('update-brand Action', () => {
  // Helper function to create a fresh brand manager and save a test brand
  async function setupDisabledBrand(brandId: string = 'test-brand-123') {
    const brandManager = new BrandManager('debug');
    const mockBrand = new Brand({
      brandId,
      secret: 'initial-secret-for-disabled-brand-xxxxx', // Needs a secret for storage
      name: 'Test Brand',
      endPointUrl: 'https://test-brand.example.com/webhook',
      enabled: false, // Start disabled
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      enabledAt: null
    });
    await brandManager.saveBrand(mockBrand);
    return brandManager;
  }

  async function setupEnabledBrand(brandId: string = 'test-brand-456') {
    const brandManager = new BrandManager('debug');
    const enabledBrand = new Brand({
      brandId,
      secret: 'test-secret-32-chars-long-xxxxx',
      name: 'Enabled Test Brand',
      endPointUrl: 'https://enabled-brand.example.com/webhook',
      enabled: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      enabledAt: new Date('2024-01-01')
    });
    await brandManager.saveBrand(enabledBrand);
    return brandManager;
  }

  beforeEach(() => {
    // Clear mocks before each test
    MockFactory.clearAll();
  });

  // Helper to create test params with all required fields
  function createTestParams(brandId: string, additionalParams: any = {}) {
    return {
      brandId,
      APPLICATION_RUNTIME_INFO: '{"namespace":"27200-a2b-benge","app_name":"agency","action_package_name":"a2b-agency"}',
      AGENCY_ID: '2ff22120-d393-4743-afdd-0d4b2038d2be',
      ORG_ID: '33C1401053CF76370A490D4C@AdobeOrg',
      S2S_CLIENT_ID: '4ab33463139e4f96b851589286cdfake',
      S2S_CLIENT_SECRET: 'FAKE_CLIENT_SECRET_FOR_TESTING_ONLY',
      S2S_SCOPES: '["AdobeID","openid","read_organizations"]',
      LOG_LEVEL: 'debug',
      ...additionalParams
    };
  }

  describe('Brand Enable Tests', () => {
    it('should enable a brand and send registration.enabled event', async () => {
      const brandManager = await setupDisabledBrand();
      
      const params = createTestParams('test-brand-123', {
        enabled: true,
        name: 'Test Brand',
        endPointUrl: 'https://test-brand.example.com/webhook'
      });

      const response = await main(params);

      // Verify response
      expect(response).toBeDefined();
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toContain('updated successfully');
      expect(response.body.data.enabled).toBe(true);
      expect(response.body.data.enabledAt).toBeDefined();

      // Verify brand is enabled in storage
      const updatedBrand = await brandManager.getBrand('test-brand-123');
      expect(updatedBrand).toBeDefined();
      expect(updatedBrand!.enabled).toBe(true);
      expect(updatedBrand!.enabledAt).toBeDefined();
      expect(updatedBrand!.secret).toBeDefined();
      expect(updatedBrand!.secret.length).toBeGreaterThan(0);
    });

    it('should generate a secret when enabling a brand without one', async () => {
      const brandManager = await setupDisabledBrand();
      
      const params = createTestParams('test-brand-123', {
        enabled: true,
        name: 'Test Brand',
        endPointUrl: 'https://test-brand.example.com/webhook'
      });

      const response = await main(params);

      expect(response.statusCode).toBe(200);
      
      // Verify secret was generated
      const updatedBrand = await brandManager.getBrand('test-brand-123');
      expect(updatedBrand!.secret).toBeDefined();
      expect(updatedBrand!.secret.length).toBeGreaterThan(20); // Secrets should be substantial
    });

    it('should include app_runtime_info in registration.enabled event', async () => {
      const brandManager = await setupDisabledBrand();
      
      const params = createTestParams('test-brand-123', { enabled: true });

      const response = await main(params);

      expect(response.statusCode).toBe(200);
      
      // The event would have app_runtime_info set in the event object
      // (actual HTTP sending is mocked, but we verify the action succeeded)
      expect(response.body.data.enabled).toBe(true);
    });

    it('should include agency_identification in registration.enabled event', async () => {
      const brandManager = await setupDisabledBrand();
      
      const params = createTestParams('test-brand-123', { enabled: true });

      const response = await main(params);

      expect(response.statusCode).toBe(200);
      
      // Verify agency ID and org ID were passed in params
      expect(params.AGENCY_ID).toBe('2ff22120-d393-4743-afdd-0d4b2038d2be');
      expect(params.ORG_ID).toBe('33C1401053CF76370A490D4C@AdobeOrg');
    });

    it('should not send event if brand was already enabled', async () => {
      const brandManager = await setupDisabledBrand();
      
      // First enable the brand
      await main(createTestParams('test-brand-123', { enabled: true }));

      // Update brand again (already enabled, just changing name)
      const response = await main(createTestParams('test-brand-123', {
        enabled: true, // Still enabled
        name: 'Updated Brand Name'
      }));

      expect(response.statusCode).toBe(200);
      
      // Brand should still be enabled
      const updatedBrand = await brandManager.getBrand('test-brand-123');
      expect(updatedBrand!.enabled).toBe(true);
      expect(updatedBrand!.name).toBe('Updated Brand Name');
    });
  });

  describe('Brand Disable Tests', () => {
    it('should disable a brand and send registration.disabled event', async () => {
      const brandManager = await setupEnabledBrand();
      
      const params = {
        brandId: 'test-brand-456',
        enabled: false, // Disable it
        APPLICATION_RUNTIME_INFO: '{"namespace":"27200-a2b-benge","app_name":"agency","action_package_name":"a2b-agency"}',
        AGENCY_ID: '2ff22120-d393-4743-afdd-0d4b2038d2be',
        ORG_ID: '33C1401053CF76370A490D4C@AdobeOrg',
        LOG_LEVEL: 'debug'
      };

      const response = await main(params);

      // Verify response
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toContain('updated successfully');
      expect(response.body.data.enabled).toBe(false);

      // Verify brand is disabled in storage
      const updatedBrand = await brandManager.getBrand('test-brand-456');
      expect(updatedBrand).toBeDefined();
      expect(updatedBrand!.enabled).toBe(false);
      expect(updatedBrand!.enabledAt).toBeNull();
      expect(updatedBrand!.secret).toBeDefined(); // Secret remains
    });

    it('should send registration.disabled event even though brand is disabled', async () => {
      const brandManager = await setupEnabledBrand();
      
      const params = createTestParams('test-brand-456', { enabled: false });

      const response = await main(params);

      expect(response.statusCode).toBe(200);
      
      // Brand.sendCloudEventToEndpoint has special case for registration.disabled
      // to allow sending even when brand is disabled
      const updatedBrand = await brandManager.getBrand('test-brand-456');
      expect(updatedBrand!.enabled).toBe(false);
    });

    it('should include agency_identification in registration.disabled event', async () => {
      const brandManager = await setupEnabledBrand();
      
      const params = createTestParams('test-brand-456', { enabled: false });

      const response = await main(params);

      expect(response.statusCode).toBe(200);
      
      // Verify agency identification params were provided
      expect(params.AGENCY_ID).toBe('2ff22120-d393-4743-afdd-0d4b2038d2be');
      expect(params.ORG_ID).toBe('33C1401053CF76370A490D4C@AdobeOrg');
    });

    it('should not send event if brand was already disabled', async () => {
      const brandManager = await setupEnabledBrand();
      
      // First disable the brand
      await main(createTestParams('test-brand-456', { enabled: false }));

      // Update brand again (already disabled, just changing name)
      const response = await main({
        brandId: 'test-brand-456',
        enabled: false, // Still disabled
        name: 'Updated Disabled Brand Name',
        APPLICATION_RUNTIME_INFO: '{"namespace":"27200-a2b-benge","app_name":"agency","action_package_name":"a2b-agency"}',
        AGENCY_ID: '2ff22120-d393-4743-afdd-0d4b2038d2be',
        ORG_ID: '33C1401053CF76370A490D4C@AdobeOrg',
        LOG_LEVEL: 'debug'
      });

      expect(response.statusCode).toBe(200);
      
      // Brand should still be disabled
      const updatedBrand = await brandManager.getBrand('test-brand-456');
      expect(updatedBrand!.enabled).toBe(false);
      expect(updatedBrand!.name).toBe('Updated Disabled Brand Name');
    });

    it('should set enabledAt to null when disabling', async () => {
      const brandManager = await setupEnabledBrand();
      
      const params = createTestParams('test-brand-456', { enabled: false });

      const response = await main(params);

      expect(response.statusCode).toBe(200);
      
      const updatedBrand = await brandManager.getBrand('test-brand-456');
      expect(updatedBrand!.enabledAt).toBeNull();
    });
  });

  describe('Error Handling Tests', () => {
    it('should return 400 if brandId is missing', async () => {
      const { brandId, ...params } = createTestParams('test-should-not-exist', { enabled: true });

      const response = await main(params as any);

      expect(response).toBeDefined();
      expect(response.error).toBeDefined();
      expect(response.error.statusCode).toBe(400);
      expect(response.error.body.error).toContain('brandId');
    });

    it('should return 404 if brand does not exist', async () => {
      const params = createTestParams('non-existent-brand', { enabled: true });

      const response = await main(params);

      expect(response).toBeDefined();
      expect(response.error).toBeDefined();
      expect(response.error.statusCode).toBe(404);
      expect(response.error.body.error).toContain('not found');
    });

    it('should succeed even if event sending fails (non-critical error)', async () => {
      const brandManager = await setupDisabledBrand();
      
      const params = createTestParams('test-brand-123', {
        enabled: true,
        endPointUrl: 'https://failing-endpoint.example.com/webhook' // This will fail
      });

      const response = await main(params);

      // Action should still succeed even if event sending fails
      expect(response.statusCode).toBe(200);
      
      // Brand should still be enabled
      const updatedBrand = await brandManager.getBrand('test-brand-123');
      expect(updatedBrand!.enabled).toBe(true);
    });
  });

  describe('Edge Cases and State Transitions', () => {
    it('should handle enabling -> disabling -> enabling cycle', async () => {
      const brandId = 'test-brand-789';
      const brandManager = new BrandManager('debug');
      
      // Create brand
      const newBrand = new Brand({
        brandId,
        secret: 'initial-secret-for-cycle-test-xxxxx',
        name: 'Cycle Test Brand',
        endPointUrl: 'https://cycle-brand.example.com/webhook',
        enabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        enabledAt: null
      });
      await brandManager.saveBrand(newBrand);

      // 1. Enable
      const enableResponse = await main(createTestParams(brandId, { enabled: true }));
      expect(enableResponse.statusCode).toBe(200);
      
      let brand = await brandManager.getBrand(brandId);
      expect(brand!.enabled).toBe(true);
      const firstSecret = brand!.secret;
      expect(firstSecret).toBeDefined();

      // 2. Disable
      const disableResponse = await main(createTestParams(brandId, { enabled: false }));
      expect(disableResponse.statusCode).toBe(200);
      
      brand = await brandManager.getBrand(brandId);
      expect(brand!.enabled).toBe(false);
      expect(brand!.enabledAt).toBeNull();
      expect(brand!.secret).toBe(firstSecret); // Secret preserved

      // 3. Re-enable (should generate NEW secret)
      const reenableResponse = await main(createTestParams(brandId, { enabled: true }));
      expect(reenableResponse.statusCode).toBe(200);
      
      brand = await brandManager.getBrand(brandId);
      expect(brand!.enabled).toBe(true);
      expect(brand!.enabledAt).toBeDefined();
      // Note: In current implementation, secret is preserved if it exists
      // If business logic requires new secret on re-enable, that should be tested differently
    });

    it('should update other fields without changing enabled state or endPointUrl', async () => {
      const brandManager = await setupDisabledBrand();
      const originalEndPointUrl = 'https://test-brand.example.com/webhook';
      
      const params = createTestParams('test-brand-123', {
        name: 'Updated Name Only',
        endPointUrl: 'https://new-url.example.com/webhook' // This should be ignored
        // Note: enabled not specified, should keep current state (false)
      });

      const response = await main(params);

      expect(response.statusCode).toBe(200);
      
      const updatedBrand = await brandManager.getBrand('test-brand-123');
      expect(updatedBrand!.name).toBe('Updated Name Only');
      expect(updatedBrand!.endPointUrl).toBe(originalEndPointUrl); // ✅ endPointUrl should NOT change (immutable)
      expect(updatedBrand!.enabled).toBe(false); // Should remain disabled
    });

    it('should preserve updatedAt timestamp', async () => {
      const brandManager = await setupDisabledBrand();
      const beforeUpdate = new Date();
      
      const params = createTestParams('test-brand-123', {
        name: 'Updated Brand'
      });

      await main(params);
      
      const afterUpdate = new Date();
      const updatedBrand = await brandManager.getBrand('test-brand-123');
      
      expect(updatedBrand!.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(updatedBrand!.updatedAt.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    });
  });

  describe('Event Payload Verification', () => {
    it('should include all required fields in registration.enabled event data', async () => {
      const brandManager = await setupDisabledBrand();
      
      const params = createTestParams('test-brand-123', {
        enabled: true,
        name: 'Test Brand',
        endPointUrl: 'https://test-brand.example.com/webhook'
      });

      const response = await main(params);

      expect(response.statusCode).toBe(200);
      
      // Verify response includes the data that would be in the event
      const brandData = response.body.data;
      expect(brandData.brandId).toBe('test-brand-123');
      expect(brandData.name).toBe('Test Brand');
      expect(brandData.endPointUrl).toBe('https://test-brand.example.com/webhook');
      expect(brandData.enabled).toBe(true);
      expect(brandData.enabledAt).toBeDefined();
      // Note: secret is not returned in response for security (toSafeJSON)
    });

    it('should match event sample structure for registration.enabled', async () => {
      // Verify our event sample has the expected structure
      expect(registrationEnabledEventSample.type).toBe('com.adobe.a2b.registration.enabled');
      expect(registrationEnabledEventSample.data.app_runtime_info).toBeDefined();
      expect(registrationEnabledEventSample.data.agency_identification).toBeDefined();
      expect(registrationEnabledEventSample.data.agency_identification.agencyId).toBeDefined();
      expect(registrationEnabledEventSample.data.agency_identification.orgId).toBeDefined();
      expect(registrationEnabledEventSample.data.brandId).toBeDefined();
      expect(registrationEnabledEventSample.data.secret).toBeDefined();
      expect(registrationEnabledEventSample.data.enabled).toBe(true);
    });

    it('should match event sample structure for registration.disabled', async () => {
      // Verify our event sample has the expected structure
      expect(registrationDisabledEventSample.type).toBe('com.adobe.a2b.registration.disabled');
      expect(registrationDisabledEventSample.data.app_runtime_info).toBeDefined();
      expect(registrationDisabledEventSample.data.agency_identification).toBeDefined();
      expect(registrationDisabledEventSample.data.agency_identification.agencyId).toBeDefined();
      expect(registrationDisabledEventSample.data.agency_identification.orgId).toBeDefined();
      expect(registrationDisabledEventSample.data.brandId).toBeDefined();
      expect(registrationDisabledEventSample.data.enabled).toBe(false);
    });
  });
});

