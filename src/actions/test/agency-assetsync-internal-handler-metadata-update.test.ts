/**
 * Comprehensive test for agency-assetsync-internal-handler handling aem.assets.asset.metadata_updated events
 * This test verifies the complete flow from metadata update event through Brand notification
 */

import { MockFactory } from './mocks/MockFactory';
import { Brand } from '../classes/Brand';
import { BrandManager } from '../classes/BrandManager';

// Import the Jest setup to ensure mocks are loaded
import './mocks/jest.setup';

// Mock data from the metadata_change.json file
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
  endPointUrl: "https://brand-b.example.com/webhook",
  enabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  enabledAt: new Date()
};

const mockBrandDataC = {
  brandId: "BRAND_C",
  secret: "test-secret-brand-c",
  name: "Test Brand C",
  endPointUrl: "https://brand-c.example.com/webhook",
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

// Mock the Brand class sendCloudEventToEndpoint method
const mockSendCloudEventToEndpoint = jest.fn();
jest.spyOn(Brand.prototype, 'sendCloudEventToEndpoint').mockImplementation(mockSendCloudEventToEndpoint);

// Mock BrandManager.getBrand method
const mockGetBrand = jest.fn();
jest.spyOn(BrandManager.prototype, 'getBrand').mockImplementation(mockGetBrand);

// Import both the product event handler and internal handler
const { main: productEventHandlerMain } = require('../adobe-product-event-handler');
const { createMockOpenWhisk } = require('./mocks/MockOpenWhisk');

describe('agency-assetsync-internal-handler - Metadata Update Integration Test', () => {
  let mockOpenWhiskClient: any;

  beforeEach(() => {
    // Reset all mocks before each test
    MockFactory.reset();
    jest.clearAllMocks();
    
    // Create mock OpenWhisk client
    mockOpenWhiskClient = createMockOpenWhisk();
    mockOpenWhiskClient.reset();

    // Setup default mock implementations
    const { getAemAssetData } = require('../utils/aemCscUtils');
    getAemAssetData.mockResolvedValue(mockAemAssetDataForMetadataUpdate);

    // Mock fetch for presigned URL call
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockPresignedUrlResponse)
    });

    // Mock Brand methods with different brands
    mockGetBrand.mockImplementation((brandId: string) => {
      if (brandId === 'BRAND_B') {
        return Promise.resolve(new Brand(mockBrandDataB));
      } else if (brandId === 'BRAND_C') {
        return Promise.resolve(new Brand(mockBrandDataC));
      }
      return Promise.resolve(null);
    });

    mockSendCloudEventToEndpoint.mockResolvedValue({
      eventType: "assetSyncUpdate",
      message: "Metadata update event processed successfully"
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
    mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler', async (params: any) => {
      const { main: internalHandlerMain } = require('../agency-assetsync-internal-handler');
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
      const result = await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Verify the main handler response
      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe('Adobe product event processed successfully');
      expect(result.body.eventType).toBe('aem.assets.asset.metadata_updated');
      expect(result.body.routingResult).toBeDefined();
      expect(result.body.routingResult.success).toBe(true);
    });

    it('should call getAemAssetData with correct parameters for metadata update', async () => {
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

      // Verify brands were retrieved
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_B');
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_C');
      expect(mockGetBrand).toHaveBeenCalledTimes(2);
    });

    it('should generate AssetSyncUpdate events for assets with existing sync history', async () => {
      await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Since our mock asset data includes a2b__last_sync, it should trigger update events
      // Verify that sendCloudEventToEndpoint was called with update event structure
      expect(mockSendCloudEventToEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'com.adobe.a2b.assetsync.update',
          data: expect.objectContaining({
            asset_id: 'e8cc4fc5-ea72-49ed-9cd2-c71d6f2fa9b1',
            asset_path: '/content/dam/benge/sad_elmo.webp',
            asset_presigned_url: mockPresignedUrlResponse.data.presignedUrl
          })
        })
      );
    });

    it('should handle single brand scenarios', async () => {
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
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_B');
      expect(mockGetBrand).toHaveBeenCalledTimes(1);
      expect(mockSendCloudEventToEndpoint).toHaveBeenCalledTimes(1);
    });

    it('should handle disabled brand gracefully', async () => {
      // Mock a disabled brand
      const disabledBrand = new Brand({
        ...mockBrandDataB,
        enabled: false
      });
      
      mockGetBrand.mockImplementation((brandId: string) => {
        if (brandId === 'BRAND_B') {
          return Promise.resolve(disabledBrand);
        } else if (brandId === 'BRAND_C') {
          return Promise.resolve(new Brand(mockBrandDataC));
        }
        return Promise.resolve(null);
      });

      const result = await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Should still return success overall
      expect(result.statusCode).toBe(200);

      // Verify getBrand was called for both brands
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_B');
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_C');

      // Only enabled brand (BRAND_C) should receive the event
      expect(mockSendCloudEventToEndpoint).toHaveBeenCalledTimes(1);
      expect(mockSendCloudEventToEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ brandId: 'BRAND_C' })
        })
      );
    });

    it('should handle asset without sync metadata gracefully', async () => {
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
      expect(mockSendCloudEventToEndpoint).not.toHaveBeenCalled();
    });

    it('should handle errors in Brand.sendCloudEventToEndpoint gracefully', async () => {
      // Mock Brand.sendCloudEventToEndpoint to throw an error for one brand
      mockSendCloudEventToEndpoint.mockImplementation((event) => {
        const brandId = event.data.brandId;
        if (brandId === 'BRAND_B') {
          throw new Error('Brand B endpoint failed');
        }
        return Promise.resolve({
          eventType: "assetSyncUpdate",
          message: "Event processed successfully"
        });
      });

      const result = await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Should still return success overall (errors are caught and logged)
      expect(result.statusCode).toBe(200);

      // Verify that both brands were attempted
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_B');
      expect(mockGetBrand).toHaveBeenCalledWith('BRAND_C');
      expect(mockSendCloudEventToEndpoint).toHaveBeenCalledTimes(2);
    });
  });

  describe('Event Structure Validation', () => {
    it('should create proper CloudEvent structure for Brand notification on metadata update', async () => {
      await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Verify the event structure passed to Brand.sendCloudEventToEndpoint
      expect(mockSendCloudEventToEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          source: expect.any(String),
          type: 'com.adobe.a2b.assetsync.update',
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

    it('should include APPLICATION_RUNTIME_INFO in metadata update events', async () => {
      await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

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

    it('should include updated metadata in the event payload', async () => {
      await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Verify that the metadata from the AEM asset is included
      expect(mockSendCloudEventToEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            metadata: expect.objectContaining({
              "dc:description": "sad elmo metadata updated",
              "a2b__customers": ["BRAND_B", "BRAND_C"],
              "a2b__sync_on_change": true,
              "a2b__last_sync": "2024-06-08T15:30:00.000Z"
            })
          })
        })
      );
    });
  });

  describe('Event Type Handling', () => {
    it('should process aem.assets.asset.metadata_updated event type', async () => {
      // Verify the event type is correctly identified and processed
      const result = await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);
      
      expect(result.statusCode).toBe(200);
      
      // The handler should have identified this as a metadata update
      const { getAemAssetData } = require('../utils/aemCscUtils');
      expect(getAemAssetData).toHaveBeenCalled();
      expect(mockSendCloudEventToEndpoint).toHaveBeenCalled();
    });

    it('should differentiate metadata updates from processing completed events', async () => {
      // Since our asset has a2b__last_sync, it should trigger update events, not new events
      await productEventHandlerMain(mockMetadataUpdateEventData, mockOpenWhiskClient);

      // Should generate update events (not new events) because a2b__last_sync exists
      expect(mockSendCloudEventToEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'com.adobe.a2b.assetsync.update'
        })
      );
    });
  });
});
