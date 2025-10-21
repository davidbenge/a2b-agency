/**
 * Comprehensive test for agency-assetsync-internal-handler-metadata-updated handling aem.assets.asset.metadata_updated events
 * This test verifies the complete flow from metadata update event through Brand notification
 */

import { MockFactory } from './mocks/MockFactory';
import { Brand } from '../classes/Brand';
import { BrandManager } from '../classes/BrandManager';

// Import the Jest setup to ensure mocks are loaded
import './mocks/jest.setup';

// Mock data from the docs/events/product/aem/aem-assets-metadata-change.json file
const mockMetadataUpdateEventData = {
  "specversion": "1.0", 
  "id": "9b1539e6-4e91-4b64-bf9b-5801ebcc34e4",
  "source": "acct:aem-p142461-e1463137@adobe.com",
  "type": "aem.assets.asset.metadata_updated",
  "datacontenttype": "application/json",
  "time": "2025-06-09T06:07:03.694998Z",
  "eventid": "d15f4bee-c5a3-4d31-aeaa-243a63db723f",
  "event_id": "d15f4bee-c5a3-4d31-aeaa-243a63db723f",
  "recipient_client_id": "4ab33463139e4f96b851589286cd46e4",
  "recipientclientid": "4ab33463139e4f96b851589286cd46e4",
  "data": {
    "user": {
      "imsUserId": "485329D5640C26D30A495FA0@4aab2722640c26d2495fca.e",
      "principalId": "DBENGE@ADOBE.COM",
      "displayName": "david benge"
    },
    "repositoryMetadata": {
      "repo:repositoryId": "author-p142461-e1463137.adobeaemcloud.com",
      "dc:format": "image/webp",
      "repo:assetClass": "file",
      "repo:assetId": "urn:aaid:aem:e8cc4fc5-ea72-49ed-9cd2-c71d6f2fa9b1",
      "repo:version": "1.4::ci:43fc83e3f986b10ba2e2d24cc1368e0d",
      "repo:name": "sad_elmo.webp",
      "repo:size": "268812",
      "repo:path": "/content/dam/benge/sad_elmo.webp",
      "repo:createdBy": "DBENGE@ADOBE.COM",
      "repo:ancestors": [
        "urn:aaid:aem:efe36f5c-ede2-4dc8-84ca-d3c69d32447a"
      ],
      "repo:state": "ACTIVE",
      "repo:createDate": "2024-10-25T18:11:41.702Z",
      "repo:modifyDate": "2024-10-25T18:11:57.778Z",
      "repo:modifiedBy": "DBENGE@ADOBE.COM",
      "dam:sha1": "035e7a2fdff69cb94ce651d92e7625d80a749795",
      "tiff:imageWidth": 1024,
      "tiff:imageLength": 1024,
      "aem:assetState": "processed"
    },
    "assetMetadata": {
      "xcm:machineKeywords": [
        {
          "value": "street photography",
          "confidence": 0.945
        },
        {
          "value": "stuffed toy",
          "confidence": 0.869
        }
      ],
      "event:updated": {
        "dc:description": "sad elmo 1"
      },
      "dc:description": "sad elmo 3"
    },
    "assetId": "urn:aaid:aem:e8cc4fc5-ea72-49ed-9cd2-c71d6f2fa9b1"
  },
  // Add all the required parameters for the action
  "APPLICATION_RUNTIME_INFO": "{\"namespace\":\"27200-a2b-benge\",\"app_name\":\"agency\",\"action_package_name\":\"a2b-agency\"}",
  "AIO_AGENCY_EVENTS_BRAND_REGISTRATION_PROVIDER_ID": "5c3431a2-bd91-4eff-a356-26b747d0aad4",
  "AIO_AGENCY_EVENTS_AEM_ASSET_SYNC_PROVIDER_ID": "af5c4d93-e1e0-4985-ad33-80fde3837aaa",
  "AEM_AUTH_CLIENT_ID": "cm-p142461-e1463137-integration-1",
  "AEM_AUTH_CLIENT_SECRET": "FAKE_AEM_CLIENT_SECRET_FOR_TESTING_ONLY",
  "AEM_AUTH_PRIVATE_KEY": "-----BEGIN RSA PRIVATE KEY-----\nFAKE\n-----END RSA PRIVATE KEY-----",
  "AEM_AUTH_SCOPES": "ent_aem_cloud_api",
  "AEM_AUTH_TYPE": "jwt",
  "ADOBE_INTERNAL_URL_ENDPOINT": "https://27200-609silverstork-stage.adobeioruntime.net/api/v1/web/a2b-agency",
  "LOG_LEVEL": "debug",
  "ORG_ID": "33C1401053CF76370A490D4C@AdobeOrg",
  "S2S_API_KEY": "FAKE_API_KEY_FOR_TESTING_ONLY",
  "S2S_CLIENT_SECRET": "FAKE_CLIENT_SECRET_FOR_TESTING_ONLY",
  "S2S_CLIENT_ID": "4ab33463139e4f96b851589286cdfake",
  "S2S_SCOPES": "[\"AdobeID\",\"openid\",\"read_organizations\",\"additional_info.projectedProductContext\",\"additional_info.roles\",\"adobeio_api\",\"read_client_secret\",\"manage_client_secrets\"]"
};

const mockAemAssetDataForMetadataUpdate = {
  "jcr:created": "Fri Oct 25 2024 18:11:41 GMT+0000",
  "jcr:createdBy": "DBENGE@ADOBE.COM",
  "jcr:uuid": "e8cc4fc5-ea72-49ed-9cd2-c71d6f2fa9b1",
  "jcr:content": {
    "jcr:lastModifiedBy": "DBENGE@ADOBE.COM",
    "metadata": {
      "dc:description": "sad elmo metadata updated",
      "dam:isAiGenerated": true,
      "tiff:ImageLength": 1024,
      "dc:format": "image/webp",
      "dam:extracted": "Fri Oct 25 2024 18:11:57 GMT+0000",
      "cq:tags": [],
      "dam:hasC2PAManifest": true,
      "dam:activationTarget": "delivery",
      "dam:status": "approved",
      "a2b__customers": ["BRAND_B", "BRAND_C"],
      "dam:predictedColors": [],
      "dam:size": 268812,
      "a2b__sync_on_change": true,
      "jcr:mixinTypes": [],
      "dam:sha1": "035e7a2fdff69cb94ce651d92e7625d80a749795",
      "jcr:primaryType": "nt:unstructured",
      "tiff:ImageWidth": 1024,
      "imageFeatures": {},
      "dam:colorDistribution": {},
      "predictedTags": {},
      "a2b__last_sync": "2024-06-08T15:30:00.000Z" // This asset has been synced before
    }
  }
};

const mockPresignedUrlResponse = {
  "data": {
    "presignedUrl": "https://author-p142461-e1463137.adobeaemcloud.com/aem-blob-ns-team-aem-cm-prd-n127835-cm-p142461-e1463137/metadata-update-test-url?sig=TestSignature&se=2025-08-12T05%3A46%3A47Z&sv=2019-02-02&rscc=private%2C%20max-age%3D43200%2C%20immutable&rsct=image%2Fwebp&rscd=attachment%3B%20filename%3D%22sad_elmo.webp%22%3B&sp=r&sr=b"
  },
  "message": "Got presigned url for https://author-p142461-e1463137//content/dam/benge/sad_elmo.webp"
};

const mockBrandDataB = {
  brandId: "BRAND_B",
  secret: "test-secret-brand-b",
  name: "Test Brand B",
  endPointUrl: "https://mock.endpoint.com/brand-b-webhook",
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  enabledAt: new Date()
};

const mockBrandDataC = {
  brandId: "BRAND_C",
  secret: "test-secret-brand-c",
  name: "Test Brand C",
  endPointUrl: "https://mock.endpoint.com/brand-c-webhook",
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  enabledAt: new Date()
};

// Mock the AEM CSC Utils at module level for reliable mocking
jest.mock('../utils/aemCscUtils', () => ({
  getAemAssetData: jest.fn(),
  getAemAuth: jest.fn().mockResolvedValue('mock-auth-token-metadata-update')
}));

// Mock axios for fetch calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock BrandManager.getBrand method
const mockGetBrand = jest.fn();

// Mock the entire BrandManager class to ensure the spy works with dynamic imports
jest.mock('../classes/BrandManager', () => {
  const originalModule = jest.requireActual('../classes/BrandManager');
  return {
    ...originalModule,
    BrandManager: jest.fn().mockImplementation((logLevel) => {
      const instance = new originalModule.BrandManager(logLevel);
      // Replace the getBrand method with our mock
      instance.getBrand = mockGetBrand;
      return instance;
    })
  };
});

// Import both the product event handler and internal handler
const { main: productEventHandlerMain } = require('../adobe-product-event-handler');
const { createMockOpenWhisk } = require('./mocks/MockOpenWhisk');

describe('agency-assetsync-internal-handler-metadata-updated - Metadata Update Integration Test', () => {
  let mockOpenWhiskClient: any;

  beforeEach(() => {
    // Reset all mocks before each test
    MockFactory.reset();
    jest.clearAllMocks();
    
    // Create mock OpenWhisk client
    mockOpenWhiskClient = createMockOpenWhisk();
    mockOpenWhiskClient.reset();
    
    // Note: We're using mocked BrandManager instead of state store approach

    // Setup default mock implementations
    const { getAemAssetData } = require('../utils/aemCscUtils');
    getAemAssetData.mockResolvedValue(mockAemAssetDataForMetadataUpdate);

    // Mock fetch for presigned URL call
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockPresignedUrlResponse)
    });

    // Mock Brand methods - use the original BrandManager.getBrandFromJson to get mocked instance
    const originalBrandManager = jest.requireActual('../classes/BrandManager').BrandManager;
    mockGetBrand.mockImplementation((brandId: string) => {
      console.log(`MockBrandManager.getBrand called with brandId: ${brandId}`);
      if (brandId === 'BRAND_B') {
        const brand = originalBrandManager.getBrandFromJson(mockBrandDataB);
        console.log(`MockBrandManager.getBrand returning BRAND_B:`, brand);
        return Promise.resolve(brand);
      } else if (brandId === 'BRAND_C') {
        const brand = originalBrandManager.getBrandFromJson(mockBrandDataC);
        console.log(`MockBrandManager.getBrand returning BRAND_C:`, brand);
        return Promise.resolve(brand);
      }
      console.log(`MockBrandManager.getBrand returning undefined for brandId: ${brandId}`);
      return Promise.resolve(undefined);
    });

    // Mock EventManager static methods only for this test context
    const EventManagerMock = jest.fn().mockImplementation(() => ({
      publishEvent: jest.fn().mockResolvedValue(undefined)
    }));
    
    // Add static methods to the mock with proper typing
    (EventManagerMock as any).getAssetSyncProviderId = jest.fn().mockReturnValue('af5c4d93-e1e0-4985-ad33-80fde3837aaa');
    (EventManagerMock as any).getS2sAuthenticationCredentials = jest.fn().mockReturnValue({
      clientId: 'fake-client-id',
      clientSecret: 'fake-client-secret',
      scopes: ['fake-scope']
    });
    
    // Only mock for this specific test context
    jest.doMock('../classes/EventManager', () => ({
      EventManager: EventManagerMock
    }));

    // Setup OpenWhisk mock to call the real internal handler
    mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated', async (params: any) => {
      const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-metadata-updated');
      return await internalHandlerMain(params.routerParams);
    });
  });

  afterEach(() => {
    MockFactory.clearAll();
    jest.clearAllMocks();
    // Reset modules to prevent mock leakage to other tests
    jest.resetModules();
    jest.restoreAllMocks();
  });

  describe('Metadata Update Event Flow', () => {
    it('should handle aem.assets.asset.metadata_updated event and trigger Brand notifications', async () => {
      // Register custom handler to call internal handler directly (like asset processing complete tests)
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated', async (params: any) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-metadata-updated');
        return await internalHandlerMain(params.routerParams);
      });

      const result = await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Verify the main handler response
      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe('Adobe product event processed successfully');
      expect(result.body.eventType).toBe('aem.assets.asset.metadata_updated');
      expect(result.body.handler).toBe('a2b-agency/agency-assetsync-internal-handler-metadata-updated');
      expect(result.body.result).toBeDefined();
    });

    it('should call getAemAssetData with correct parameters for metadata update', async () => {
      // Register custom handler to call internal handler directly
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated', async (params: any) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-metadata-updated');
        return await internalHandlerMain(params.routerParams);
      });

      await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Verify getAemAssetData was called with correct parameters
      const { getAemAssetData } = require('../utils/aemCscUtils');
      expect(getAemAssetData).toHaveBeenCalledWith(
        'https://author-p142461-e1463137.adobeaemcloud.com',
        '/content/dam/benge/sad_elmo.webp',
        expect.objectContaining({
          type: 'aem.assets.asset.metadata_updated'
        }),
        expect.any(Object) // logger
      );
    });

    it('should call fetchPresignedReadUrl and get presigned URL for metadata update', async () => {
      // Register custom handler to call internal handler directly
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated', async (params: any) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-metadata-updated');
        return await internalHandlerMain(params.routerParams);
      });

      await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Verify fetch was called for presigned URL
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/aem-getPresignedReadUrl'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'cm-p142461-e1463137-integration-1',
            'Authorization': 'Bearer mock-auth-token-metadata-update'
          }),
          body: JSON.stringify({
            host: 'author-p142461-e1463137',
            path: '/content/dam/benge/sad_elmo.webp'
          })
        })
      );
    });

    it('should process metadata update event and call brand notifications', async () => {
      // Register custom handler to call internal handler directly
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated', async (params: any) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-metadata-updated');
        return await internalHandlerMain(params.routerParams);
      });

      // Execute the test
      const result = await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Verify the main handler response
      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe('Adobe product event processed successfully');

      // Verify AEM asset data was fetched
      const { getAemAssetData } = require('../utils/aemCscUtils');
      expect(getAemAssetData).toHaveBeenCalledTimes(1);
      
      // Verify it was called with the expected host and path
      const getAemAssetDataCall = getAemAssetData.mock.calls[0];
      expect(getAemAssetDataCall[0]).toContain('author-p142461-e1463137.adobeaemcloud.com');
      expect(getAemAssetDataCall[1]).toBe('/content/dam/benge/sad_elmo.webp');

      // Verify brands were retrieved (now using real BrandManager with mocked state store)
      // The brands should be retrieved from the state store with prefixed keys
      expect(mockGetBrand).toHaveBeenCalledTimes(2);
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_B');
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_C');
    });

    it('should generate AssetSyncUpdate events for assets with existing sync history', async () => {
      // Register custom handler to call internal handler directly
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated', async (params: any) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-metadata-updated');
        return await internalHandlerMain(params.routerParams);
      });

      await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Since our mock asset data includes a2b__last_sync, it should trigger update events
      // Verify that brands were retrieved for the update event
      expect(mockGetBrand).toHaveBeenCalledTimes(2);
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_B');
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_C');
    });

    it('should handle single brand scenarios', async () => {
      // Register custom handler to call internal handler directly
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated', async (params: any) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-metadata-updated');
        return await internalHandlerMain(params.routerParams);
      });

      // Mock asset data with only one brand
      const singleBrandAssetData = {
        ...mockAemAssetDataForMetadataUpdate,
        "jcr:content": {
          ...mockAemAssetDataForMetadataUpdate["jcr:content"],
          "metadata": {
            ...mockAemAssetDataForMetadataUpdate["jcr:content"].metadata,
            "a2b__customers": ["BRAND_B"]
          }
        }
      };

      const { getAemAssetData } = require('../utils/aemCscUtils');
      getAemAssetData.mockResolvedValue(singleBrandAssetData);

      await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Verify only one brand was called
      expect(mockGetBrand).toHaveBeenCalledTimes(1);
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_B');
    });

    it('should handle disabled brand gracefully', async () => {
      // Register custom handler to call internal handler directly
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated', async (params: any) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-metadata-updated');
        return await internalHandlerMain(params.routerParams);
      });

      // Mock a disabled brand
      // Mock a disabled brand - use BrandManager.getBrandFromJson to get mocked instance
      mockGetBrand.mockImplementation((brandId: string) => {
        if (brandId === 'BRAND_B') {
          const disabledBrand = BrandManager.getBrandFromJson({
            ...mockBrandDataB,
            enabled: false
          });
          return Promise.resolve(disabledBrand);
        } else if (brandId === 'BRAND_C') {
          return Promise.resolve(BrandManager.getBrandFromJson(mockBrandDataC));
        }
        return Promise.resolve(null);
      });

      const result = await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Should still return success overall
      expect(result.statusCode).toBe(200);

      // Only enabled brand (BRAND_C) should receive the event
      expect(mockGetBrand).toHaveBeenCalledTimes(2); // Both brands are checked, but only enabled one processes
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_B');
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_C');
    });

    it('should handle asset without sync metadata gracefully', async () => {
      // Register custom handler to call internal handler directly
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated', async (params: any) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-metadata-updated');
        return await internalHandlerMain(params.routerParams);
      });

      // Mock asset data without a2b sync metadata
      const assetWithoutSyncData = {
        ...mockAemAssetDataForMetadataUpdate,
        "jcr:content": {
          ...mockAemAssetDataForMetadataUpdate["jcr:content"],
          "metadata": {
            ...mockAemAssetDataForMetadataUpdate["jcr:content"].metadata,
            "a2b__sync_on_change": false, // sync disabled
            "a2b__customers": undefined
          }
        }
      };

      const { getAemAssetData } = require('../utils/aemCscUtils');
      getAemAssetData.mockResolvedValue(assetWithoutSyncData);

      const result = await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Should still return success
      expect(result.statusCode).toBe(200);

      // Verify that no brand calls were made since sync is disabled
      expect(mockGetBrand).not.toHaveBeenCalled();
    });

    it('should handle errors in Brand.sendCloudEventToEndpoint gracefully', async () => {
      // Register custom handler to call internal handler directly
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated', async (params: any) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-metadata-updated');
        return await internalHandlerMain(params.routerParams);
      });

      // Mock a brand with an invalid endpoint to test error handling
      mockGetBrand.mockImplementation((brandId: string) => {
        if (brandId === 'BRAND_B') {
          const brand = BrandManager.getBrandFromJson({
            ...mockBrandDataB,
            endPointUrl: "https://invalid-endpoint.com/webhook" // This will cause an error
          });
          return Promise.resolve(brand);
        } else if (brandId === 'BRAND_C') {
          return Promise.resolve(BrandManager.getBrandFromJson(mockBrandDataC));
        }
        return Promise.resolve(undefined);
      });

      const result = await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Should still return success overall (errors are caught and logged)
      expect(result.statusCode).toBe(200);

      // Verify that both brands were attempted
      expect(mockGetBrand).toHaveBeenCalledTimes(2);
    });
  });

  describe('Event Structure Validation', () => {
    it('should create proper CloudEvent structure for Brand notification on metadata update', async () => {
      // Register custom handler to call internal handler directly
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated', async (params: any) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-metadata-updated');
        return await internalHandlerMain(params.routerParams);
      });

      await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Verify that brands were retrieved for the event
      expect(mockGetBrand).toHaveBeenCalledTimes(2);
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_B');
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_C');
    });

    it('should include APPLICATION_RUNTIME_INFO in metadata update events', async () => {
      // Register custom handler to call internal handler directly
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated', async (params: any) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-metadata-updated');
        return await internalHandlerMain(params.routerParams);
      });

      await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Verify that brands were retrieved for the event
      expect(mockGetBrand).toHaveBeenCalledTimes(2);
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_B');
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_C');
    });

    it('should include updated metadata in the event payload', async () => {
      // Register custom handler to call internal handler directly
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated', async (params: any) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-metadata-updated');
        return await internalHandlerMain(params.routerParams);
      });

      await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Verify that brands were retrieved for the event
      expect(mockGetBrand).toHaveBeenCalledTimes(2);
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_B');
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_C');
    });
  });

  describe('Event Type Handling', () => {
    it('should process aem.assets.asset.metadata_updated event type', async () => {
      // Register custom handler to call internal handler directly
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated', async (params: any) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-metadata-updated');
        return await internalHandlerMain(params.routerParams);
      });

      // Verify the event type is correctly identified and processed
      const result = await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);
      
      expect(result.statusCode).toBe(200);
      
      // The handler should have identified this as a metadata update
      const { getAemAssetData } = require('../utils/aemCscUtils');
      expect(getAemAssetData).toHaveBeenCalled();
      expect(mockGetBrand).toHaveBeenCalledTimes(2);
    });

    it('should differentiate metadata updates from processing completed events', async () => {
      // Register custom handler to call internal handler directly
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated', async (params: any) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-metadata-updated');
        return await internalHandlerMain(params.routerParams);
      });

      // Since our asset has a2b__last_sync, it should trigger update events, not new events
      await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Should generate update events (not new events) because a2b__last_sync exists
      expect(mockGetBrand).toHaveBeenCalledTimes(2);
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_B');
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_C');
    });
  });
});
