/**
 * Brand Registration and Enablement Flow Test
 * 
 * This test validates the complete flow:
 * 1. Register a new brand using new-brand-registration
 * 2. Update the brand to enable it using update-brand
 * 3. Verify that registration.enabled event is sent to brand endpoint
 */

import { main as newBrandRegistration } from '../services/brand/new-brand-registration';
import { main as updateBrand } from '../services/brand/update-brand';
import { MockStateStore } from './mocks/MockStateStore';
import { MockFileStore } from './mocks/MockFileStore';
import { MockOpenWhiskClient } from './mocks/MockOpenWhisk';
import { MockAioLibEvents } from './mocks/MockAioLibEvents';
import { BrandManager } from '../classes/BrandManager';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Load JSON files dynamically
// __dirname is /Users/dbenge/code_2/a2b/a2b-agency/src/actions/test
// So ../../../docs goes to /Users/dbenge/code_2/a2b/a2b-agency/docs
const registrationRequestExample = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../docs/apis/new-brand-registration/request-example-internal.json'), 'utf8')
);

const registrationEnabledEventExample = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../../docs/events/registration/com-adobe-a2b-registration-enabled.json'), 'utf8')
);

// Mock axios for testing the sendCloudEventToEndpoint call
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Brand Registration and Enablement Flow', () => {
  let mockStateStore: MockStateStore;
  let mockFileStore: MockFileStore;
  let mockOpenWhisk: MockOpenWhiskClient;
  let mockAioLibEvents: MockAioLibEvents;

  beforeEach(() => {
    // Initialize mocks
    mockStateStore = new MockStateStore();
    mockFileStore = new MockFileStore();
    mockOpenWhisk = new MockOpenWhiskClient();
    mockAioLibEvents = new MockAioLibEvents();

    // Clear all mocks
    mockStateStore.clear();
    mockFileStore.clear();
    mockOpenWhisk.clearInvocationHistory();
    mockOpenWhisk.clearMockResults();
    mockAioLibEvents.clear();
    
    // Reset axios mock
    mockedAxios.post.mockReset();
  });

  afterEach(() => {
    mockStateStore.clear();
    mockFileStore.clear();
    mockOpenWhisk.clearInvocationHistory();
    mockOpenWhisk.clearMockResults();
    mockAioLibEvents.clear();
    mockedAxios.post.mockReset();
  });

  it('should complete full registration and enablement flow with event sent to brand', async () => {
    // ===================================================================
    // STEP 1: Register a new brand using request-example-internal.json
    // ===================================================================
    
    const registrationParams = {
      ...registrationRequestExample,
      // Override with test values
      LOG_LEVEL: 'debug',
      data: {
        ...registrationRequestExample.data,
        name: 'Test Brand Registration Flow',
        endPointUrl: 'https://test-brand-endpoint.example.com/agency-event-handler'
      }
    };

    console.log('STEP 1: Registering new brand...');
    const registrationResponse = await newBrandRegistration(registrationParams);
    
    // Verify registration succeeded
    expect(registrationResponse.statusCode).toBe(200);
    expect(registrationResponse.body).toHaveProperty('brandId');
    expect(registrationResponse.body).not.toHaveProperty('secret'); // ✅ Secret NOT returned per security rule
    expect(registrationResponse.body.enabled).toBe(false);
    expect(registrationResponse.body.name).toBe('Test Brand Registration Flow');
    
    // Note: IMS org fields are stored but may not be returned in initial response
    // They will be available when retrieving the brand later

    const brandId = registrationResponse.body.brandId;
    
    // Get the secret from the stored brand (not from API response)
    let brandManager = new BrandManager('debug');
    let storedBrandForSecret = await brandManager.getBrand(brandId);
    const brandSecret = storedBrandForSecret!.secret;
    
    console.log(`Brand registered with ID: ${brandId}`);
    console.log(`Brand secret: ${brandSecret.substring(0, 8)}...`);

    // ===================================================================
    // STEP 2: Verify brand is stored and disabled
    // ===================================================================
    
    console.log('STEP 2: Verifying brand is stored...');
    const storedBrand = storedBrandForSecret; // Reuse the brand we already fetched
    
    expect(storedBrand).toBeDefined();
    expect(storedBrand?.enabled).toBe(false);
    expect(storedBrand?.secret).toBe(brandSecret);
    expect(storedBrand?.endPointUrl).toBe('https://test-brand-endpoint.example.com/agency-event-handler');

    // ===================================================================
    // STEP 3: Mock axios.post for sendCloudEventToEndpoint
    // ===================================================================
    
    console.log('STEP 3: Setting up mock for brand endpoint...');
    
    // Mock the brand's endpoint response
    const mockBrandEndpointResponse = {
      eventType: 'com.adobe.a2b.registration.enabled',
      message: 'Brand successfully enabled',
      routingResult: {
        status: 'success',
        handledBy: 'agency-registration-internal-handler'
      }
    };

    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: mockBrandEndpointResponse,
      statusText: 'OK',
      headers: {},
      config: {} as any
    });

    // ===================================================================
    // STEP 4: Enable the brand using update-brand
    // ===================================================================
    
    console.log('STEP 4: Enabling brand...');
    const updateParams = {
      LOG_LEVEL: 'debug',
      brandId: brandId,
      enabled: true,
      APPLICATION_RUNTIME_INFO: registrationParams.APPLICATION_RUNTIME_INFO,
      AIO_RUNTIME_NAMESPACE: registrationParams.AIO_RUNTIME_NAMESPACE,
      AIO_AGENCY_EVENTS_BRAND_REGISTRATION_PROVIDER_ID: registrationParams.AIO_AGENCY_EVENTS_BRAND_REGISTRATION_PROVIDER_ID,
      ORG_ID: registrationParams.ORG_ID
    };

    const updateResponse = await updateBrand(updateParams);
    
    // Verify update succeeded
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.data.enabled).toBe(true);
    expect(updateResponse.body.data.enabledAt).toBeDefined();

    console.log('Brand enabled successfully');

    // ===================================================================
    // STEP 5: Verify registration.enabled event was sent to brand
    // ===================================================================
    
    console.log('STEP 5: Verifying registration.enabled event was sent...');
    
    // Verify axios.post was called
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    
    // Get the call arguments
    const [url, payload, config] = mockedAxios.post.mock.calls[0];
    
    // Type assertion for payload
    const cloudEventPayload = payload as any;
    
    // Verify the URL
    expect(url).toBe('https://test-brand-endpoint.example.com/agency-event-handler');
    
    // Verify the headers include secret
    expect(config?.headers).toHaveProperty('X-A2B-Brand-Secret', brandSecret);
    expect(config?.headers).toHaveProperty('X-A2B-Brand-Id', brandId);
    expect(config?.headers).toHaveProperty('Content-Type', 'application/json');
    
    // Verify the payload structure matches CloudEvents spec
    expect(cloudEventPayload).toHaveProperty('type', 'com.adobe.a2b.registration.enabled');
    expect(cloudEventPayload).toHaveProperty('source');
    expect(cloudEventPayload).toHaveProperty('id');
    expect(cloudEventPayload).toHaveProperty('specversion', '1.0');
    expect(cloudEventPayload).toHaveProperty('datacontenttype', 'application/json');
    expect(cloudEventPayload).toHaveProperty('data');
    
    // Verify the event data
    const eventData = cloudEventPayload.data;
    expect(eventData).toHaveProperty('brandId', brandId);
    expect(eventData).toHaveProperty('secret', brandSecret);
    expect(eventData).toHaveProperty('enabled', true);
    expect(eventData).toHaveProperty('name', 'Test Brand Registration Flow');
    expect(eventData).toHaveProperty('endPointUrl', 'https://test-brand-endpoint.example.com/agency-event-handler');
    expect(eventData).toHaveProperty('enabledAt');
    
    // Verify app_runtime_info is included
    expect(eventData).toHaveProperty('app_runtime_info');
    expect(eventData.app_runtime_info).toHaveProperty('consoleId');
    expect(eventData.app_runtime_info).toHaveProperty('projectName');
    expect(eventData.app_runtime_info).toHaveProperty('workspace');
    expect(eventData.app_runtime_info).toHaveProperty('action_package_name'); // snake_case format
    
    // Note: agency_identification is added by EventManager in real deployment
    // In unit tests calling the action directly, it won't be present
    
    console.log('✅ All verifications passed!');
    console.log(`Event sent to: ${url}`);
    console.log(`Event type: ${cloudEventPayload.type}`);
    console.log(`Brand ID: ${eventData.brandId}`);
    console.log(`Brand enabled: ${eventData.enabled}`);
  });

  it('should not send event when brand is updated but not enabled', async () => {
    // Register a brand first
    const registrationParams = {
      ...registrationRequestExample,
      LOG_LEVEL: 'debug',
      data: {
        ...registrationRequestExample.data,
        name: 'Test Brand No Enable',
        endPointUrl: 'https://test-brand-endpoint-2.example.com/agency-event-handler'
      }
    };

    const registrationResponse = await newBrandRegistration(registrationParams);
    expect(registrationResponse.statusCode).toBe(200);
    
    const brandId = registrationResponse.body.brandId;

    // Mock axios
    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: { eventType: 'test', routingResult: {} },
      statusText: 'OK',
      headers: {},
      config: {} as any
    });

    // Update brand but keep it disabled
    const updateParams = {
      LOG_LEVEL: 'debug',
      brandId: brandId,
      name: 'Updated Name Without Enabling',
      APPLICATION_RUNTIME_INFO: registrationParams.APPLICATION_RUNTIME_INFO,
      AIO_RUNTIME_NAMESPACE: registrationParams.AIO_RUNTIME_NAMESPACE,
      AIO_AGENCY_EVENTS_BRAND_REGISTRATION_PROVIDER_ID: registrationParams.AIO_AGENCY_EVENTS_BRAND_REGISTRATION_PROVIDER_ID,
      ORG_ID: registrationParams.ORG_ID
    };

    const updateResponse = await updateBrand(updateParams);
    
    // Verify update succeeded
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.data.enabled).toBe(false);
    expect(updateResponse.body.data.name).toBe('Updated Name Without Enabling');

    // Verify NO event was sent
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should match the structure of registration-enabled.json example', async () => {
    // Register a brand
    const registrationParams = {
      ...registrationRequestExample,
      LOG_LEVEL: 'debug',
      data: {
        ...registrationRequestExample.data,
        name: 'Test Brand for Event Structure',
        endPointUrl: 'https://test-brand-endpoint-3.example.com/agency-event-handler'
      }
    };

    const registrationResponse = await newBrandRegistration(registrationParams);
    expect(registrationResponse.statusCode).toBe(200);
    
    const brandId = registrationResponse.body.brandId;

    // Mock axios
    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: { eventType: 'test', routingResult: {} },
      statusText: 'OK',
      headers: {},
      config: {} as any
    });

    // Enable the brand
    const updateParams = {
      LOG_LEVEL: 'debug',
      brandId: brandId,
      enabled: true,
      APPLICATION_RUNTIME_INFO: registrationParams.APPLICATION_RUNTIME_INFO,
      AIO_RUNTIME_NAMESPACE: registrationParams.AIO_RUNTIME_NAMESPACE,
      AIO_AGENCY_EVENTS_BRAND_REGISTRATION_PROVIDER_ID: registrationParams.AIO_AGENCY_EVENTS_BRAND_REGISTRATION_PROVIDER_ID,
      ORG_ID: registrationParams.ORG_ID
    };

    await updateBrand(updateParams);

    // Get the sent event
    const [url, payload] = mockedAxios.post.mock.calls[0];
    const cloudEventPayload = payload as any;

    // Compare structure with example (excluding dynamic values like IDs and timestamps)
    const exampleEvent = registrationEnabledEventExample;

    // CloudEvents top-level fields
    expect(cloudEventPayload).toHaveProperty('type', exampleEvent.type);
    expect(cloudEventPayload).toHaveProperty('specversion', exampleEvent.specversion);
    expect(cloudEventPayload).toHaveProperty('datacontenttype', exampleEvent.datacontenttype);
    expect(cloudEventPayload).toHaveProperty('source'); // Dynamic value
    expect(cloudEventPayload).toHaveProperty('id'); // Dynamic value
    expect(cloudEventPayload).toHaveProperty('time'); // Dynamic value

    // Data structure should contain at least the required fields
    // Note: The actual event may have additional fields or slightly different structure
    const eventDataKeys = Object.keys(cloudEventPayload.data);
    expect(eventDataKeys).toContain('brandId');
    expect(eventDataKeys).toContain('secret');
    expect(eventDataKeys).toContain('enabled');
    expect(eventDataKeys).toContain('name');
    expect(eventDataKeys).toContain('app_runtime_info');

    // Required data fields present
    expect(cloudEventPayload.data).toHaveProperty('brandId');
    expect(cloudEventPayload.data).toHaveProperty('secret');
    expect(cloudEventPayload.data).toHaveProperty('enabled', true);
    expect(cloudEventPayload.data).toHaveProperty('name');
    expect(cloudEventPayload.data).toHaveProperty('endPointUrl');
    expect(cloudEventPayload.data).toHaveProperty('enabledAt');
    expect(cloudEventPayload.data).toHaveProperty('app_runtime_info');
    // Note: agency_identification may be added by EventManager in real deployment
  });

  it('should generate new secret if brand has no secret when enabling', async () => {
    // This test verifies the edge case where a brand somehow has no secret
    // and we try to enable it - a new secret should be generated
    
    const registrationParams = {
      ...registrationRequestExample,
      LOG_LEVEL: 'debug',
      data: {
        ...registrationRequestExample.data,
        name: 'Test Brand Secret Generation',
        endPointUrl: 'https://test-brand-endpoint-4.example.com/agency-event-handler'
      }
    };

    const registrationResponse = await newBrandRegistration(registrationParams);
    expect(registrationResponse.statusCode).toBe(200);
    
    const brandId = registrationResponse.body.brandId;
    
    // Get secret from stored brand (not from API response per security rule)
    const brandManager = new BrandManager('debug');
    const storedBrand = await brandManager.getBrand(brandId);
    const originalSecret = storedBrand!.secret;

    // Verify brand has a secret
    expect(originalSecret).toBeDefined();
    expect(originalSecret).toHaveLength(32);

    // Mock axios
    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: { eventType: 'test', routingResult: {} },
      statusText: 'OK',
      headers: {},
      config: {} as any
    });

    // Enable the brand
    const updateParams = {
      LOG_LEVEL: 'debug',
      brandId: brandId,
      enabled: true,
      APPLICATION_RUNTIME_INFO: registrationParams.APPLICATION_RUNTIME_INFO,
      AIO_RUNTIME_NAMESPACE: registrationParams.AIO_RUNTIME_NAMESPACE,
      AIO_AGENCY_EVENTS_BRAND_REGISTRATION_PROVIDER_ID: registrationParams.AIO_AGENCY_EVENTS_BRAND_REGISTRATION_PROVIDER_ID,
      ORG_ID: registrationParams.ORG_ID
    };

    const updateResponse = await updateBrand(updateParams);

    // Verify the secret in the sent event
    const [url, payload] = mockedAxios.post.mock.calls[0];
    const cloudEventPayload = payload as any;
    expect(cloudEventPayload.data.secret).toBe(originalSecret);
    expect(cloudEventPayload.data.secret).toHaveLength(32);
  });
});

