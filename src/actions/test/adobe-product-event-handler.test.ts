import { MockFactory } from './mocks/MockFactory';
import { MockOpenWhiskClient, createMockOpenWhisk } from './mocks/MockOpenWhisk';

// Import the Jest setup to ensure mocks are loaded
import './mocks/jest.setup';

// Create a mock OpenWhisk client for testing
const mockOpenWhisk = createMockOpenWhisk();

// Import the main function
const { main } = require('../adobe-product-event-handler');

describe('adobe-product-event-handler', () => {
  let mockOpenWhiskClient: MockOpenWhiskClient;

  beforeEach(() => {
    // Reset all mocks before each test
    MockFactory.reset();
    
    // Use the manually created mock instance
    mockOpenWhiskClient = mockOpenWhisk;
    
    // Reset the mock instance
    mockOpenWhiskClient.reset();
  });

  afterEach(() => {
    MockFactory.clearAll();
  });

  describe('main function', () => {
    it('should handle IO webhook challenge', async () => {
      const params = {
        challenge: 'test-challenge',
        LOG_LEVEL: 'debug'
      };

      const result = await main(params, mockOpenWhisk);

      expect(result.statusCode).toBe(200);
      expect(result.body.challenge).toBe('test-challenge');
    });

    it('should return error when no event type is provided', async () => {
      const params = {
        LOG_LEVEL: 'debug'
        // Missing 'type' parameter
      };

      const result = await main(params, mockOpenWhisk);

      expect(result.statusCode).toBe(400);
      expect(result.body.message).toBe('No event type provided');
      expect(result.body.error).toBe('Event type is required for routing');
    });

    it('should return error when required parameters are missing', async () => {
      const params = {
        // Missing all required parameters
      };

      const result = await main(params, mockOpenWhisk);

      expect(result.statusCode).toBe(400);
      expect(result.body.message).toBe('No event type provided');
    });

    it('should handle unhandled event types', async () => {
      const params = {
        type: 'unknown.event.type',
        LOG_LEVEL: 'debug'
      };

      const result = await main(params, mockOpenWhisk);

      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe('Adobe product event processed - unhandled type');
      expect(result.body.eventType).toBe('unknown.event.type');
      expect(result.body.note).toBe('Event type not configured for routing');
    });

    it('should handle AEM asset created events as unhandled', async () => {
      const params = {
        type: 'aem.assets.asset.created',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: { assetId: 'test-asset-123' }
      };

      const result = await main(params, mockOpenWhisk);

      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe('Adobe product event processed - unhandled type');
      expect(result.body.eventType).toBe('aem.assets.asset.created');
      expect(result.body.note).toBe('Event type not configured for routing');
    });

    it('should handle AEM asset updated events as unhandled', async () => {
      const params = {
        type: 'aem.assets.asset.updated',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: { assetId: 'test-asset-456' }
      };

      const result = await main(params, mockOpenWhisk);

      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe('Adobe product event processed - unhandled type');
      expect(result.body.eventType).toBe('aem.assets.asset.updated');
      expect(result.body.note).toBe('Event type not configured for routing');
    });

    it('should handle AEM asset deleted events as unhandled', async () => {
      const params = {
        type: 'aem.assets.asset.deleted',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: { assetId: 'test-asset-789' }
      };

      const result = await main(params, mockOpenWhisk);

      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe('Adobe product event processed - unhandled type');
      expect(result.body.eventType).toBe('aem.assets.asset.deleted');
      expect(result.body.note).toBe('Event type not configured for routing');
    });

    it('should handle AEM asset metadata updated events', async () => {
      const params = {
        type: 'aem.assets.asset.metadata_updated',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: { assetId: 'test-asset-101' }
      };

      const result = await main(params, mockOpenWhisk);

      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe('Adobe product event processed successfully');
      expect(result.body.eventType).toBe('aem.assets.asset.metadata_updated');
      expect(result.body.handler).toBe('a2b-agency/agency-assetsync-internal-handler-metadata-updated');
      expect(result.body.result).toBeDefined();
    });

    it('should handle AEM asset processing completed events', async () => {
      const params = {
        type: 'aem.assets.asset.processing_completed',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: { assetId: 'test-asset-202' }
      };

      const result = await main(params, mockOpenWhisk);

      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe('Adobe product event processed successfully');
      expect(result.body.eventType).toBe('aem.assets.asset.processing_completed');
      expect(result.body.handler).toBe('a2b-agency/agency-assetsync-internal-handler-process-complete');
      expect(result.body.result).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      const params = {
        type: 'aem.assets.asset.metadata_updated',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: { assetId: 'test-asset-error' }
      };

      // Mock an error in the OpenWhisk client by making it throw an exception
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated', async () => {
        throw new Error('Mock error response');
      });

      const result = await main(params, mockOpenWhisk);

      // When handler throws, the action should catch and return 500
      expect(result.statusCode).toBe(500);
      expect(result.body.message).toBe('Error processing Adobe product event');
      expect(result.body.error).toBeDefined();
    });
  });

  describe('OpenWhisk action invocation', () => {
    it('should invoke agency-assetsync-internal-handler-metadata-updated-metadata-updated for metadata updated events', async () => {
      const params = {
        type: 'aem.assets.asset.metadata_updated',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: { assetId: 'test-asset-123' },
        APPLICATION_RUNTIME_INFO: '{"namespace":"test-namespace","app_name":"test-app"}'
      };

      await main(params, mockOpenWhisk);

      // Verify that the action was invoked
      expect(mockOpenWhiskClient.wasActionInvoked('a2b-agency/agency-assetsync-internal-handler-metadata-updated')).toBe(true);
      expect(mockOpenWhiskClient.getInvocationCount('a2b-agency/agency-assetsync-internal-handler-metadata-updated')).toBe(1);

      // Get the invocation details
      const invocation = mockOpenWhiskClient.getLastInvocation();
      expect(invocation).toBeDefined();
      expect(invocation!.name).toBe('a2b-agency/agency-assetsync-internal-handler-metadata-updated');
      expect(invocation!.blocking).toBe(true);
      expect(invocation!.result).toBe(true);
      expect(invocation!.params.routerParams).toBeDefined();
      expect(invocation!.params.routerParams.type).toBe('aem.assets.asset.metadata_updated');
    });

    it('should pass correct parameters to the internal handler', async () => {
      const params = {
        type: 'aem.assets.asset.metadata_updated',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: { 
          assetId: 'test-asset-456',
          metadata: { title: 'Test Asset' }
        },
        APPLICATION_RUNTIME_INFO: '{"namespace":"test-namespace","app_name":"test-app"}'
      };

      await main(params, mockOpenWhisk);

      const invocation = mockOpenWhiskClient.getLastInvocation();
      expect(invocation).toBeDefined();
      
      // Verify the routerParams structure
      expect(invocation!.params.routerParams).toEqual(params);
      expect(invocation!.params.routerParams.type).toBe('aem.assets.asset.metadata_updated');
      expect(invocation!.params.routerParams.data.assetId).toBe('test-asset-456');
      expect(invocation!.params.routerParams.data.metadata.title).toBe('Test Asset');
    });

    it('should handle multiple AEM asset events in sequence', async () => {
      const events = [
        { type: 'aem.assets.asset.metadata_updated', assetId: 'asset-1' },
        { type: 'aem.assets.asset.processing_completed', assetId: 'asset-2' },
        { type: 'aem.assets.asset.metadata_updated', assetId: 'asset-3' }
      ];

      for (const event of events) {
        const params = {
          type: event.type,
          LOG_LEVEL: 'debug',
          source: 'test-source',
          data: { assetId: event.assetId }
        };

        await main(params, mockOpenWhisk);
      }

      // Verify all invocations
      expect(mockOpenWhiskClient.getInvocationCount('a2b-agency/agency-assetsync-internal-handler-metadata-updated')).toBe(2);
      expect(mockOpenWhiskClient.getInvocationCount('a2b-agency/agency-assetsync-internal-handler-process-complete')).toBe(1);
      
      const metadataInvocations = mockOpenWhiskClient.getInvocationsForAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated');
      const processCompleteInvocations = mockOpenWhiskClient.getInvocationsForAction('a2b-agency/agency-assetsync-internal-handler-process-complete');
      
      expect(metadataInvocations).toHaveLength(2);
      expect(processCompleteInvocations).toHaveLength(1);
      
      // Verify each invocation has the correct event type
      expect(metadataInvocations[0].params.routerParams.type).toBe('aem.assets.asset.metadata_updated');
      expect(processCompleteInvocations[0].params.routerParams.type).toBe('aem.assets.asset.processing_completed');
      expect(metadataInvocations[1].params.routerParams.type).toBe('aem.assets.asset.metadata_updated');
    });

    it('should use custom mock results when provided', async () => {
      const customResult = {
        activationId: 'custom-activation-123',
        response: {
          status: 'success',
          result: {
            statusCode: 200,
            body: {
              message: 'Custom mock result',
              processed: true
            }
          }
        }
      };

      mockOpenWhiskClient.setMockResult('a2b-agency/agency-assetsync-internal-handler-metadata-updated', customResult);

      const params = {
        type: 'aem.assets.asset.metadata_updated',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: { assetId: 'test-asset-custom' }
      };

      const result = await main(params, mockOpenWhisk);

      expect(result.statusCode).toBe(200);
      expect(result.body.handler).toBe('a2b-agency/agency-assetsync-internal-handler-metadata-updated');
      expect(result.body.result).toEqual(customResult);
    });
  });

  describe('Error handling', () => {
    it('should handle OpenWhisk invocation errors', async () => {
      const params = {
        type: 'aem.assets.asset.metadata_updated',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: { assetId: 'test-asset-error' }
      };

      // Mock an error response by making it throw an exception
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler-metadata-updated', async () => {
        throw new Error('Action invocation failed');
      });

      const result = await main(params, mockOpenWhisk);

      // When handler throws, the action should catch and return 500
      expect(result.statusCode).toBe(500);
      expect(result.body.message).toBe('Error processing Adobe product event');
      expect(result.body.error).toBeDefined();
    });

    it('should handle malformed event data', async () => {
      const params = {
        type: 'aem.assets.asset.metadata_updated',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: null // Malformed data
      };

      const result = await main(params, mockOpenWhisk);

      // Malformed data will still be passed to handler
      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe('Adobe product event processed successfully');
      expect(result.body.handler).toBe('a2b-agency/agency-assetsync-internal-handler-metadata-updated');
    });
  });

  describe('Integration with real event data', () => {
    it('should process AEM asset processing complete event', async () => {
      // This simulates the real event data from docs/events/product/aem/aem-assets-asset-processing-complete.json
      const params = {
        type: 'aem.assets.unknown',
        LOG_LEVEL: 'debug',
        source: 'acct:aem-p142461-e1463137@adobe.com',
        data: {
          assetId: 'urn:aaid:aem:20fec14a-b5b8-4c7d-85f4-e619d66281dc',
          assetMetadata: {
            'xcm:machineKeywords': [
              {
                confidence: 0.896,
                value: 'editorial photography'
              }
            ]
          }
        },
        APPLICATION_RUNTIME_INFO: '{"namespace":"27200-a2b-benge","app_name":"agency","action_package_name":"a2b-agency"}'
      };

      const result = await main(params, mockOpenWhisk);

      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe('Adobe product event processed - unhandled type');
      expect(result.body.eventType).toBe('aem.assets.unknown');
      
      // Since this event type is not handled, it should return unhandled message
      expect(result.body.note).toBe('Event type not configured for routing');
    });
  });
});
