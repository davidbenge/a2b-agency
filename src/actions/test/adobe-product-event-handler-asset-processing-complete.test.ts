/**
 * Comprehensive test for adobe-product-event-handler handling aem.assets.asset.processing_completed events
 * This test verifies the complete flow from event reception through Brand notification
 */

import { MockFactory } from './mocks/MockFactory';
import { MockOpenWhiskClient, createMockOpenWhisk } from './mocks/MockOpenWhisk';
import { Brand } from '../classes/Brand';
import { BrandManager } from '../classes/BrandManager';

// Import the Jest setup to ensure mocks are loaded
import './mocks/jest.setup';

// Mock data from the JSON files
const mockEventData = {
  "source": "acct:aem-p142461-e1463137@adobe.com",
  "S2S_API_KEY": "FAKE_API_KEY_FOR_TESTING_ONLY",
  "S2S_CLIENT_SECRET": "FAKE_CLIENT_SECRET_FOR_TESTING_ONLY",
  "data": {
    "assetId": "urn:aaid:aem:20fec14a-b5b8-4c7d-85f4-e619d66281dc",
    "assetMetadata": {
      "xcm:machineKeywords": [
        {
          "confidence": 0.896,
          "value": "editorial photography"
        }
      ]
    },
    "repositoryMetadata": {
      "aem:assetState": "processed",
      "dam:sha1": "bfba1fa5db8755f3deefbf62b8c212ea6396fafc",
      "dc:format": "image/png",
      "repo:assetClass": "file",
      "repo:assetId": "urn:aaid:aem:20fec14a-b5b8-4c7d-85f4-e619d66281dc",
      "repo:createDate": "2025-08-29T06:57:15.912Z",
      "repo:createdBy": "DBENGE@ADOBE.COM",
      "repo:modifiedBy": "DBENGE@ADOBE.COM",
      "repo:modifyDate": "2025-08-29T06:57:54.141Z",
      "repo:name": "Screenshot 2025-05-28 at 5.05.48 PM.png",
      "repo:path": "/content/dam/agency_work_for_BRAND_A/Screenshot 2025-05-28 at 5.05.48 PM.png",
      "repo:repositoryId": "author-p142461-e1463137.adobeaemcloud.com",
      "repo:size": "669044",
      "repo:state": "ACTIVE",
      "repo:version": "oak:1.0::ci:ef60ede228dbef257ec147ae0e252ec8",
      "tiff:imageLength": 816,
      "tiff:imageWidth": 1465
    }
  },
  "type": "aem.assets.asset.processing_completed",
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
  "ORG_ID": "33C1401053CF76370A490D4C@AdobeOrg"
};

const mockAemAssetData = {
  "jcr:created": "Fri Oct 25 2024 18:11:41 GMT+0000",
  "jcr:createdBy": "DBENGE@ADOBE.COM",
  "jcr:uuid": "e8cc4fc5-ea72-49ed-9cd2-c71d6f2fa9b1",
  "jcr:content": {
    "jcr:lastModifiedBy": "DBENGE@ADOBE.COM",
    "metadata": {
      "monkey_test": "test monkey 1",
      "dc:description": "sad elmo 90",
      "dam:isAiGenerated": true,
      "tiff:ImageLength": 1024,
      "dc:format": "image/webp",
      "dam:extracted": "Fri Oct 25 2024 18:11:57 GMT+0000",
      "cq:tags": [],
      "dam:hasC2PAManifest": true,
      "dam:activationTarget": "delivery",
      "dam:status": "approved",
      "a2b__customers": ["BRAND_A"],
      "dam:predictedColors": [],
      "dam:size": 268812,
      "a2b__sync_on_change": true,
      "jcr:mixinTypes": [],
      "dam:sha1": "035e7a2fdff69cb94ce651d92e7625d80a749795",
      "jcr:primaryType": "nt:unstructured",
      "tiff:ImageWidth": 1024,
      "imageFeatures": {},
      "dam:colorDistribution": {},
      "predictedTags": {}
    }
  }
};

const mockPresignedUrlResponse = {
  "data": {
    "presignedUrl": "https://author-p111858-e1309055.adobeaemcloud.com/aem-blob-ns-team-aem-cm-prd-n127835-cm-p111858-e1309055/1111-97296aa06a2eb0c7121f0a8705db7e717eb2ef311d48a9d68d411477908b?sig=VAgYhI9ZsN4ZNbsxI1m8XrlNeJ8XbIE5yKGsEdgzFVE%3D&se=2025-08-12T05%3A46%3A47Z&sv=2019-02-02&rscc=private%2C%20max-age%3D43200%2C%20immutable&rsct=image%2Fjpeg&rscd=attachment%3B%20filename%3D%22my_test_image.jpeg%22%3B%20filename*%3DUTF-8%27%27my_test_image.jpeg&sp=r&sr=b"
  },
  "message": "Got presigned url for https://author-p111858-e1309055//content/dam/hls_company/my_test_image.jpeg"
};

const mockBrandData = {
  brandId: "BRAND_A",
  secret: "test-secret-123",
  name: "Test Brand A",
  endPointUrl: "https://example.com/webhook",
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  enabledAt: new Date()
};

// Mock the AEM CSC Utils
jest.mock('../utils/aemCscUtils', () => ({
  getAemAssetData: jest.fn(),
  getAemAuth: jest.fn().mockResolvedValue('mock-auth-token')
}));

// Mock axios for fetch calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock the Brand class sendCloudEventToEndpoint method
const mockSendCloudEventToEndpoint = jest.fn();
jest.spyOn(Brand.prototype, 'sendCloudEventToEndpoint').mockImplementation(mockSendCloudEventToEndpoint);

// Mock BrandManager.getBrand method
const mockGetBrand = jest.fn();
jest.spyOn(BrandManager.prototype, 'getBrand').mockImplementation(mockGetBrand);

// Create a mock OpenWhisk client for testing
const mockOpenWhisk = createMockOpenWhisk();

// Import the main function
const { main } = require('../adobe-product-event-handler');

describe('adobe-product-event-handler - Asset Processing Complete Integration Test', () => {
  let mockOpenWhiskClient: MockOpenWhiskClient;

  beforeEach(() => {
    // Reset all mocks before each test
    MockFactory.reset();
    jest.clearAllMocks();
    
    // Use the manually created mock instance
    mockOpenWhiskClient = mockOpenWhisk;
    
    // Reset the mock instance
    mockOpenWhiskClient.reset();

    // Setup default mock implementations
    const { getAemAssetData } = require('../utils/aemCscUtils');
    getAemAssetData.mockResolvedValue(mockAemAssetData);

    // Mock fetch for presigned URL call
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockPresignedUrlResponse)
    });

    // Mock Brand methods
    mockGetBrand.mockResolvedValue(new Brand(mockBrandData));
    mockSendCloudEventToEndpoint.mockResolvedValue({
      eventType: "assetSyncNew",
      message: "Event processed successfully"
    });
  });

  afterEach(() => {
    MockFactory.clearAll();
    jest.clearAllMocks();
  });

  describe('Asset Processing Complete Event Flow', () => {
    it('should handle aem.assets.asset.processing_completed event and trigger Brand notification', async () => {
      // Setup the mock for agency-assetsync-internal-handler-process-complete to call real implementation
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-process-complete', async (params) => {
        // Import and call the real agency-assetsync-internal-handler-process-complete
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-process-complete');
        return await internalHandlerMain(params.routerParams);
      });

      const result = await main(mockEventData, mockOpenWhisk);

      // Verify the main handler response
      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe('Adobe product event processed successfully');
      expect(result.body.eventType).toBe('aem.assets.asset.processing_completed');
      expect(result.body.routingResult).toBeDefined();
      expect(result.body.routingResult.success).toBe(true);

      // Verify that the agency-assetsync-internal-handler-process-complete was invoked
      expect(mockOpenWhiskClient.wasActionInvoked('a2b-agency/agency-assetsync-internal-handler-process-complete')).toBe(true);
      expect(mockOpenWhiskClient.getInvocationCount('a2b-agency/agency-assetsync-internal-handler-process-complete')).toBe(1);

      // Verify the invocation parameters
      const invocation = mockOpenWhiskClient.getLastInvocation();
      expect(invocation).toBeDefined();
      expect(invocation!.name).toBe('a2b-agency/agency-assetsync-internal-handler-process-complete');
      expect(invocation!.params.routerParams.type).toBe('aem.assets.asset.processing_completed');
      expect(invocation!.params.routerParams.data.assetId).toBe('urn:aaid:aem:20fec14a-b5b8-4c7d-85f4-e619d66281dc');
    });

    it('should call getAemAssetData with correct parameters', async () => {
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-process-complete', async (params) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-process-complete');
        return await internalHandlerMain(params.routerParams);
      });

      await main(mockEventData, mockOpenWhisk);

      // Verify getAemAssetData was called with correct parameters
      const { getAemAssetData } = require('../utils/aemCscUtils');
      expect(getAemAssetData).toHaveBeenCalledWith(
        'https://author-p142461-e1463137.adobeaemcloud.com',
        '/content/dam/agency_work_for_BRAND_A/Screenshot 2025-05-28 at 5.05.48 PM.png',
        expect.objectContaining({
          type: 'aem.assets.asset.processing_completed'
        }),
        expect.any(Object) // logger
      );
    });

    it('should call fetchPresignedReadUrl and get presigned URL', async () => {
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-process-complete', async (params) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-process-complete');
        return await internalHandlerMain(params.routerParams);
      });

      await main(mockEventData, mockOpenWhisk);

      // Verify fetch was called for presigned URL
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/aem-getPresignedReadUrl'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'cm-p142461-e1463137-integration-1',
            'Authorization': 'Bearer mock-auth-token'
          }),
          body: JSON.stringify({
            host: 'author-p142461-e1463137',
            path: '/content/dam/agency_work_for_BRAND_A/Screenshot 2025-05-28 at 5.05.48 PM.png'
          })
        })
      );
    });

    it('should get brand and call sendCloudEventToEndpoint', async () => {
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-process-complete', async (params) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-process-complete');
        return await internalHandlerMain(params.routerParams);
      });

      await main(mockEventData, mockOpenWhisk);

      // Verify BrandManager.getBrand was called
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_A');

      // Verify Brand.sendCloudEventToEndpoint was called
      expect(mockSendCloudEventToEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            asset_id: 'e8cc4fc5-ea72-49ed-9cd2-c71d6f2fa9b1',
            asset_path: '/content/dam/agency_work_for_BRAND_A/Screenshot 2025-05-28 at 5.05.48 PM.png',
            brandId: 'BRAND_A',
            asset_presigned_url: mockPresignedUrlResponse.data.presignedUrl
          })
        })
      );
    });

    it('should handle multiple customers in a2d__customers array', async () => {
      // Modify mock data to have multiple customers
      const multiCustomerAssetData = {
        ...mockAemAssetData,
        "jcr:content": {
          ...mockAemAssetData["jcr:content"],
          "metadata": {
            ...mockAemAssetData["jcr:content"].metadata,
            "a2b__customers": ["BRAND_A", "BRAND_B"]
          }
        }
      };

      const { getAemAssetData } = require('../utils/aemCscUtils');
      getAemAssetData.mockResolvedValue(multiCustomerAssetData);

      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-process-complete', async (params) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-process-complete');
        return await internalHandlerMain(params.routerParams);
      });

      await main(mockEventData, mockOpenWhisk);

      // Verify BrandManager.getBrand was called for both brands
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_A');
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_B');
      expect(mockGetBrand).toHaveBeenCalledTimes(2);

      // Verify Brand.sendCloudEventToEndpoint was called for both brands
      expect(mockSendCloudEventToEndpoint).toHaveBeenCalledTimes(2);
      expect(mockSendCloudEventToEndpoint).toHaveBeenNthCalledWith(1, expect.objectContaining({
        data: expect.objectContaining({ brandId: 'BRAND_A' })
      }));
      expect(mockSendCloudEventToEndpoint).toHaveBeenNthCalledWith(2, expect.objectContaining({
        data: expect.objectContaining({ brandId: 'BRAND_B' })
      }));
    });

    it('should handle disabled brand gracefully', async () => {
      // Mock a disabled brand
      const disabledBrand = new Brand({
        ...mockBrandData,
        enabled: false
      });
      mockGetBrand.mockResolvedValue(disabledBrand);

      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-process-complete', async (params) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-process-complete');
        return await internalHandlerMain(params.routerParams);
      });

      const result = await main(mockEventData, mockOpenWhisk);

      // Should still return success overall
      expect(result.statusCode).toBe(200);

      // Verify getBrand was called but sendCloudEventToEndpoint was not
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_A');
      expect(mockSendCloudEventToEndpoint).not.toHaveBeenCalled();
    });

    it('should handle asset without sync metadata gracefully', async () => {
      // Mock asset data without a2b sync metadata
      const assetWithoutSyncData = {
        ...mockAemAssetData,
        "jcr:content": {
          ...mockAemAssetData["jcr:content"],
          "metadata": {
            ...mockAemAssetData["jcr:content"].metadata,
            "a2b__sync_on_change": false, // sync disabled
            "a2b__customers": undefined
          }
        }
      };

      const { getAemAssetData } = require('../utils/aemCscUtils');
      getAemAssetData.mockResolvedValue(assetWithoutSyncData);

      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-process-complete', async (params) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-process-complete');
        return await internalHandlerMain(params.routerParams);
      });

      const result = await main(mockEventData, mockOpenWhisk);

      // Should still return success
      expect(result.statusCode).toBe(200);

      // Verify that no brand calls were made since sync is disabled
      expect(mockGetBrand).not.toHaveBeenCalled();
      expect(mockSendCloudEventToEndpoint).not.toHaveBeenCalled();
    });

    it('should handle errors in Brand.sendCloudEventToEndpoint gracefully', async () => {
      // Mock Brand.sendCloudEventToEndpoint to throw an error
      mockSendCloudEventToEndpoint.mockRejectedValue(new Error('Brand endpoint failed'));

      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-process-complete', async (params) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-process-complete');
        return await internalHandlerMain(params.routerParams);
      });

      const result = await main(mockEventData, mockOpenWhisk);

      // Should still return success overall (error is caught and logged)
      expect(result.statusCode).toBe(200);

      // Verify that the methods were called despite the error
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_A');
      expect(mockSendCloudEventToEndpoint).toHaveBeenCalled();
    });
  });

  describe('Event Structure Validation', () => {
    it('should create proper CloudEvent structure for Brand notification', async () => {
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-process-complete', async (params) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-process-complete');
        return await internalHandlerMain(params.routerParams);
      });

      await main(mockEventData, mockOpenWhisk);

      // Verify the event structure passed to Brand.sendCloudEventToEndpoint
      expect(mockSendCloudEventToEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          source: expect.any(String),
          type: 'com.adobe.a2b.assetsync.new',
          datacontenttype: 'application/json',
          data: expect.objectContaining({
            asset_id: expect.any(String),
            asset_path: expect.any(String),
            metadata: expect.any(Object),
            asset_presigned_url: expect.any(String),
            brandId: expect.any(String)
          }),
          id: expect.any(String)
        })
      );
    });

    it('should include APPLICATION_RUNTIME_INFO in events', async () => {
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-process-complete', async (params) => {
        const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler-process-complete');
        return await internalHandlerMain(params.routerParams);
      });

      await main(mockEventData, mockOpenWhisk);

      // Verify CloudEvent includes app runtime info
      expect(mockSendCloudEventToEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            app_runtime_info: expect.objectContaining({
              consoleId: "27200",
              projectName: "a2b",
              workspace: "benge",
              appName: "agency",
              actionPackageName: "a2b-agency"
            })
          })
        })
      );
    });
  });
});
