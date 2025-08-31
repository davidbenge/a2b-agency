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

    it('should handle AEM asset created events', async () => {
      const params = {
        type: 'aem.assets.asset.created',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: { assetId: 'test-asset-123' }
      };

      const result = await main(params, mockOpenWhisk);

      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe('Adobe product event processed successfully');
      expect(result.body.eventType).toBe('aem.assets.asset.created');
      expect(result.body.routingResult).toBeDefined();
      expect(result.body.routingResult.success).toBe(true);
    });

    it('should handle AEM asset updated events', async () => {
      const params = {
        type: 'aem.assets.asset.updated',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: { assetId: 'test-asset-456' }
      };

      const result = await main(params, mockOpenWhisk);

      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe('Adobe product event processed successfully');
      expect(result.body.eventType).toBe('aem.assets.asset.updated');
      expect(result.body.routingResult).toBeDefined();
      expect(result.body.routingResult.success).toBe(true);
    });

    it('should handle AEM asset deleted events', async () => {
      const params = {
        type: 'aem.assets.asset.deleted',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: { assetId: 'test-asset-789' }
      };

      const result = await main(params, mockOpenWhisk);

      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe('Adobe product event processed successfully');
      expect(result.body.eventType).toBe('aem.assets.asset.deleted');
      expect(result.body.routingResult).toBeDefined();
      expect(result.body.routingResult.success).toBe(true);
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
      expect(result.body.routingResult).toBeDefined();
      expect(result.body.routingResult.success).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const params = {
        type: 'aem.assets.asset.created',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: { assetId: 'test-asset-error' }
      };

      // Mock an error in the OpenWhisk client by making it throw an exception
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler', async () => {
        throw new Error('Mock error response');
      });

      const result = await main(params, mockOpenWhisk);

      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe('Adobe product event processed successfully');
      expect(result.body.routingResult.success).toBe(false);
      expect(result.body.routingResult.error).toBeDefined();
    });
  });

  describe('OpenWhisk action invocation', () => {
    it('should invoke agency-assetsync-internal-handler for AEM asset events', async () => {
      const params = {
        type: 'aem.assets.asset.created',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: { assetId: 'test-asset-123' },
        APPLICATION_RUNTIME_INFO: '{"namespace":"test-namespace","app_name":"test-app"}'
      };

      await main(params, mockOpenWhisk);

      // Verify that the action was invoked
      expect(mockOpenWhiskClient.wasActionInvoked('a2b-agency/agency-assetsync-internal-handler')).toBe(true);
      expect(mockOpenWhiskClient.getInvocationCount('a2b-agency/agency-assetsync-internal-handler')).toBe(1);

      // Get the invocation details
      const invocation = mockOpenWhiskClient.getLastInvocation();
      expect(invocation).toBeDefined();
      expect(invocation!.name).toBe('a2b-agency/agency-assetsync-internal-handler');
      expect(invocation!.blocking).toBe(true);
      expect(invocation!.result).toBe(true);
      expect(invocation!.params.routerParams).toBeDefined();
      expect(invocation!.params.routerParams.type).toBe('aem.assets.asset.created');
    });

    it('should pass correct parameters to the internal handler', async () => {
      const params = {
        type: 'aem.assets.asset.updated',
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
      expect(invocation!.params.routerParams.type).toBe('aem.assets.asset.updated');
      expect(invocation!.params.routerParams.data.assetId).toBe('test-asset-456');
      expect(invocation!.params.routerParams.data.metadata.title).toBe('Test Asset');
    });

    it('should handle multiple AEM asset events in sequence', async () => {
      const events = [
        { type: 'aem.assets.asset.created', assetId: 'asset-1' },
        { type: 'aem.assets.asset.updated', assetId: 'asset-2' },
        { type: 'aem.assets.asset.deleted', assetId: 'asset-3' }
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
      expect(mockOpenWhiskClient.getInvocationCount('a2b-agency/agency-assetsync-internal-handler')).toBe(3);
      
      const invocations = mockOpenWhiskClient.getInvocationsForAction('a2b-agency/agency-assetsync-internal-handler');
      expect(invocations).toHaveLength(3);
      
      // Verify each invocation has the correct event type
      invocations.forEach((inv, index) => {
        expect(inv.params.routerParams.type).toBe(events[index].type);
        expect(inv.params.routerParams.data.assetId).toBe(events[index].assetId);
      });
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

      mockOpenWhiskClient.setMockResult('a2b-agency/agency-assetsync-internal-handler', customResult);

      const params = {
        type: 'aem.assets.asset.created',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: { assetId: 'test-asset-custom' }
      };

      const result = await main(params, mockOpenWhisk);

      expect(result.statusCode).toBe(200);
      expect(result.body.routingResult.success).toBe(true);
      expect(result.body.routingResult.result).toEqual(customResult);
    });
  });

  describe('Error handling', () => {
    it('should handle OpenWhisk invocation errors', async () => {
      const params = {
        type: 'aem.assets.asset.created',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: { assetId: 'test-asset-error' }
      };

      // Mock an error response by making it throw an exception
      mockOpenWhiskClient.registerAction('a2b-agency/agency-assetsync-internal-handler', async () => {
        throw new Error('Action invocation failed');
      });

      const result = await main(params, mockOpenWhisk);

      expect(result.statusCode).toBe(200);
      expect(result.body.routingResult.success).toBe(false);
      expect(result.body.routingResult.error).toBeDefined();
    });

    it('should handle malformed event data', async () => {
      const params = {
        type: 'aem.assets.asset.created',
        LOG_LEVEL: 'debug',
        source: 'test-source',
        data: null // Malformed data
      };

      const result = await main(params);

      expect(result.statusCode).toBe(200);
      expect(result.body.message).toBe('Adobe product event processed successfully');
      expect(result.body.routingResult).toBeDefined();
    });
  });

  describe('Integration with real event data', () => {
    it('should process AEM asset processing complete event', async () => {
      // This simulates the real event data from docs/events/aem/aem_asset_processing_complete.json
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
