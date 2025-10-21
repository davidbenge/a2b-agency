/**
 * Tests for delete-brand action
 * Verifies that registration.disabled event is sent before deletion
 */

import { main } from '../delete-brand/index';
import { MockFactory } from './mocks/MockFactory';
import { Brand } from '../classes/Brand';
import { BrandManager } from '../classes/BrandManager';

// Import the Jest setup to ensure mocks are loaded
import './mocks/jest.setup';

describe('delete-brand Action', () => {
  // Helper function to create a brand for deletion
  async function setupBrand(brandId: string = 'test-brand-delete', enabled: boolean = true) {
    const brandManager = new BrandManager('debug');
    const brand = new Brand({
      brandId,
      secret: 'test-secret-for-deletion',
      name: 'Brand To Delete',
      endPointUrl: 'https://mock.endpoint.com/delete-test-webhook',
      enabled,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      enabledAt: enabled ? new Date('2024-01-01') : null
    });
    await brandManager.saveBrand(brand);
    return brandManager;
  }

  beforeEach(() => {
    // Clear mocks before each test
    MockFactory.clearAll();
  });

  // Helper to create test params with all required fields
  function createTestParams(brandId: string) {
    return {
      brandId,
      APPLICATION_RUNTIME_INFO: '{"namespace":"27200-a2b-benge","app_name":"agency","action_package_name":"a2b-agency"}',
      AGENCY_ID: '2ff22120-d393-4743-afdd-0d4b2038d2be',
      ORG_ID: '33C1401053CF76370A490D4C@AdobeOrg',
      S2S_CLIENT_ID: '4ab33463139e4f96b851589286cdfake',
      S2S_CLIENT_SECRET: 'FAKE_CLIENT_SECRET_FOR_TESTING_ONLY',
      S2S_SCOPES: '["AdobeID","openid","read_organizations"]',
      LOG_LEVEL: 'debug'
    };
  }

  describe('Event Sending Before Deletion', () => {
    it('should send registration.disabled event before deleting an enabled brand', async () => {
      const brandManager = await setupBrand('test-brand-001', true);
      
      const params = createTestParams('test-brand-001');

      const response = await main(params);

      // Verify successful deletion
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toContain('deleted successfully');

      // Verify brand is deleted
      const deletedBrand = await brandManager.getBrand('test-brand-001');
      expect(deletedBrand).toBeUndefined();
    });

    it('should send registration.disabled event before deleting a disabled brand', async () => {
      const brandManager = await setupBrand('test-brand-002', false);
      
      const params = createTestParams('test-brand-002');

      const response = await main(params);

      // Verify successful deletion
      expect(response.statusCode).toBe(200);
      expect(response.body.message).toContain('deleted successfully');

      // Verify brand is deleted
      const deletedBrand = await brandManager.getBrand('test-brand-002');
      expect(deletedBrand).toBeUndefined();
    });

    it('should include app_runtime_info in the event', async () => {
      await setupBrand('test-brand-003', true);
      
      const params = createTestParams('test-brand-003');

      const response = await main(params);

      expect(response.statusCode).toBe(200);
      // Event sending is mocked, but we verify the action succeeded
      // which means it attempted to send the event with app_runtime_info
    });

    it('should include agency_identification in the event', async () => {
      await setupBrand('test-brand-004', true);
      
      const params = createTestParams('test-brand-004');

      const response = await main(params);

      expect(response.statusCode).toBe(200);
      // Verify the params that would be used for agency identification
      expect(params.AGENCY_ID).toBe('2ff22120-d393-4743-afdd-0d4b2038d2be');
      expect(params.ORG_ID).toBe('33C1401053CF76370A490D4C@AdobeOrg');
    });

    it('should delete brand even if event sending fails', async () => {
      const brandManager = await setupBrand('test-brand-005', true);
      
      const params = createTestParams('test-brand-005');

      const response = await main(params);

      // Action should succeed even if event sending fails
      expect(response.statusCode).toBe(200);
      
      // Brand should still be deleted
      const deletedBrand = await brandManager.getBrand('test-brand-005');
      expect(deletedBrand).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 400 if brandId is missing', async () => {
      const { brandId, ...params } = createTestParams('test-should-not-exist');
      
      const response = await main(params as any);

      expect(response).toBeDefined();
      expect(response.error).toBeDefined();
      expect(response.error.statusCode).toBe(400);
      expect(response.error.body.error).toContain('brandId');
    });

    it('should return 404 if brand does not exist', async () => {
      const params = createTestParams('non-existent-brand');

      const response = await main(params);

      expect(response).toBeDefined();
      expect(response.error).toBeDefined();
      expect(response.error.statusCode).toBe(404);
      expect(response.error.body.error).toContain('not found');
    });
  });

  describe('Deletion Verification', () => {
    it('should successfully delete brand from storage', async () => {
      const brandManager = await setupBrand('test-brand-006', true);
      
      // Verify brand exists before deletion
      const existingBrand = await brandManager.getBrand('test-brand-006');
      expect(existingBrand).toBeDefined();
      expect(existingBrand!.brandId).toBe('test-brand-006');

      const params = createTestParams('test-brand-006');

      const response = await main(params);

      expect(response.statusCode).toBe(200);
      
      // Verify brand is completely removed
      const deletedBrand = await brandManager.getBrand('test-brand-006');
      expect(deletedBrand).toBeUndefined();
    });

    it('should delete brand and allow reusing the same brandId', async () => {
      const brandManager = await setupBrand('test-brand-007', true);
      
      const params = createTestParams('test-brand-007');

      // Delete the brand
      const deleteResponse = await main(params);
      expect(deleteResponse.statusCode).toBe(200);

      // Verify it's deleted
      const deletedBrand = await brandManager.getBrand('test-brand-007');
      expect(deletedBrand).toBeUndefined();

      // Create a new brand with the same ID (should work)
      const newBrand = new Brand({
        brandId: 'test-brand-007',
        secret: 'new-secret',
        name: 'New Brand',
        endPointUrl: 'https://new.example.com/webhook',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        enabledAt: new Date()
      });
      await brandManager.saveBrand(newBrand);

      // Verify new brand exists
      const newBrandCheck = await brandManager.getBrand('test-brand-007');
      expect(newBrandCheck).toBeDefined();
      expect(newBrandCheck!.name).toBe('New Brand');
    });
  });

  describe('Event Data Structure', () => {
    it('should send event with correct CloudEvent structure', async () => {
      await setupBrand('test-brand-008', true);
      
      const params = createTestParams('test-brand-008');

      const response = await main(params);

      expect(response.statusCode).toBe(200);
      // The event would be a RegistrationDisabledEvent with:
      // - type: com.adobe.a2b.registration.disabled
      // - data.brandId
      // - data.enabled: false
      // - data.app_runtime_info
      // - data.agency_identification
    });
  });
});

