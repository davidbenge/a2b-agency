/**
 * Demonstration of how to use the OpenWhisk Mock for testing actions
 * 
 * This file shows practical examples of how to test actions that invoke
 * other OpenWhisk actions using the MockOpenWhiskClient.
 */

import { MockOpenWhiskClient, createMockOpenWhisk } from './MockOpenWhisk';

/**
 * Example: Testing an action that routes events to other handlers
 */
export async function demonstrateOpenWhiskMocking() {
  console.log('=== OpenWhisk Mock Demonstration ===\n');

  // Create a mock OpenWhisk client
  const mockOpenWhisk = createMockOpenWhisk();

  // Example 1: Basic action invocation tracking
  console.log('1. Basic Action Invocation Tracking:');
  
  await mockOpenWhisk.actions.invoke({
    name: 'a2b-agency/agency-assetsync-internal-handler',
    params: {
      routerParams: {
        type: 'aem.assets.asset.created',
        data: { assetId: 'test-asset-123' }
      }
    },
    blocking: true,
    result: true
  });

  console.log(`   - Action invoked: ${mockOpenWhisk.wasActionInvoked('a2b-agency/agency-assetsync-internal-handler')}`);
  console.log(`   - Invocation count: ${mockOpenWhisk.getInvocationCount('a2b-agency/agency-assetsync-internal-handler')}`);
  
  const invocation = mockOpenWhisk.getLastInvocation();
  console.log(`   - Last invocation params:`, JSON.stringify(invocation!.params, null, 2));

  // Example 2: Custom mock results
  console.log('\n2. Custom Mock Results:');
  
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

  mockOpenWhisk.setMockResult('a2b-agency/agency-assetsync-internal-handler', customResult);
  
  const result = await mockOpenWhisk.actions.invoke({
    name: 'a2b-agency/agency-assetsync-internal-handler',
    params: { test: 'data' },
    blocking: true,
    result: true
  });

  console.log(`   - Custom result returned: ${JSON.stringify(result, null, 2)}`);

  // Example 3: Multiple invocations
  console.log('\n3. Multiple Invocations:');
  
  const eventTypes = [
    'aem.assets.asset.created',
    'aem.assets.asset.updated',
    'aem.assets.asset.deleted'
  ];

  for (const eventType of eventTypes) {
    await mockOpenWhisk.actions.invoke({
      name: 'a2b-agency/agency-assetsync-internal-handler',
      params: {
        routerParams: {
          type: eventType,
          data: { assetId: `asset-${eventType.split('.').pop()}` }
        }
      },
      blocking: true,
      result: true
    });
  }

  console.log(`   - Total invocations: ${mockOpenWhisk.getInvocationHistory().length}`);
  console.log(`   - Invocations for handler: ${mockOpenWhisk.getInvocationCount('a2b-agency/agency-assetsync-internal-handler')}`);

  // Example 4: Parameter verification
  console.log('\n4. Parameter Verification:');
  
  const expectedParams = {
    routerParams: {
      type: 'aem.assets.asset.created',
      data: { assetId: 'test-asset-123' }
    }
  };

  const isVerified = mockOpenWhisk.verifyInvocation('a2b-agency/agency-assetsync-internal-handler', expectedParams);
  console.log(`   - Parameters verified: ${isVerified}`);

  // Example 5: Invocation history inspection
  console.log('\n5. Invocation History Inspection:');
  
  const allInvocations = mockOpenWhisk.getInvocationHistory();
  allInvocations.forEach((inv, index) => {
    console.log(`   - Invocation ${index + 1}: ${inv.name} with type ${inv.params.routerParams?.type}`);
  });

  // Example 6: Clearing and resetting
  console.log('\n6. Clearing and Resetting:');
  
  console.log(`   - Before clear: ${mockOpenWhisk.getInvocationHistory().length} invocations`);
  mockOpenWhisk.clearInvocationHistory();
  console.log(`   - After clear: ${mockOpenWhisk.getInvocationHistory().length} invocations`);
  
  mockOpenWhisk.reset();
  console.log(`   - After reset: ${mockOpenWhisk.getInvocationHistory().length} invocations`);

  console.log('\n=== Demonstration Complete ===');
}

/**
 * Example: How to use in a real test
 */
export function demonstrateTestUsage() {
  console.log('\n=== Test Usage Example ===\n');

  console.log(`
// In your test file:
import { MockOpenWhiskClient, createMockOpenWhisk } from './mocks/MockOpenWhisk';

describe('My Action Tests', () => {
  let mockOpenWhisk: MockOpenWhiskClient;

  beforeEach(() => {
    mockOpenWhisk = createMockOpenWhisk();
  });

  afterEach(() => {
    mockOpenWhisk.reset();
  });

  it('should invoke the correct handler', async () => {
    // Set up custom mock result
    mockOpenWhisk.setMockResult('a2b-agency/agency-assetsync-internal-handler', {
      success: true,
      processed: true
    });

    // Call your action
    const result = await myAction(eventData);

    // Verify the handler was invoked
    expect(mockOpenWhisk.wasActionInvoked('a2b-agency/agency-assetsync-internal-handler')).toBe(true);
    
    // Verify invocation details
    const invocation = mockOpenWhisk.getLastInvocation();
    expect(invocation!.params.routerParams.type).toBe('aem.assets.asset.created');
    
    // Verify the result
    expect(result.success).toBe(true);
  });
});
  `);
}

// Run the demonstration if this file is executed directly
if (require.main === module) {
  demonstrateOpenWhiskMocking().then(() => {
    demonstrateTestUsage();
  }).catch(console.error);
}
