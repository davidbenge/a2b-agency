import { ApplicationRuntimeInfo } from '../classes/ApplicationRuntimeInfo';
import { IApplicationRuntimeInfo } from '../types';

describe('ApplicationRuntimeInfo', () => {
  describe('getApplicationRuntimeInfo', () => {
    it('should return undefined when params do not contain APPLICATION_RUNTIME_INFO', () => {
      // Test with empty params
      const result1 = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams({});
      expect(result1).toBeUndefined();

      // Test with params that don't have APPLICATION_RUNTIME_INFO
      const result2 = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams({ 
        someOtherParam: 'value' 
      });
      expect(result2).toBeUndefined();

      // Test with null params
      const result3 = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(null);
      expect(result3).toBeUndefined();
    });

    it('should return undefined when APPLICATION_RUNTIME_INFO is null or undefined', () => {
      const result1 = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams({ 
        APPLICATION_RUNTIME_INFO: null 
      });
      expect(result1).toBeUndefined();

      const result2 = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams({ 
        APPLICATION_RUNTIME_INFO: undefined 
      });
      expect(result2).toBeUndefined();
    });

    it('should return undefined when APPLICATION_RUNTIME_INFO is invalid JSON', () => {
      const result = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams({ 
        APPLICATION_RUNTIME_INFO: 'invalid json string' 
      });
      expect(result).toBeUndefined();
    });

    it('should return undefined when APPLICATION_RUNTIME_INFO is missing required fields', () => {
      // Missing namespace
      const result1 = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams({ 
        APPLICATION_RUNTIME_INFO: JSON.stringify({
          app_name: 'test-app'
        })
      });
      expect(result1).toBeUndefined();

      // Missing app_name
      const result2 = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams({ 
        APPLICATION_RUNTIME_INFO: JSON.stringify({
          namespace: 'console-project-workspace'
        })
      });
      expect(result2).toBeUndefined();

      // Both missing
      const result3 = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams({ 
        APPLICATION_RUNTIME_INFO: JSON.stringify({})
      });
      expect(result3).toBeUndefined();
    });

    it('should return undefined when namespace does not have enough parts', () => {
      // Only 2 parts instead of required 3
      const result1 = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams({ 
        APPLICATION_RUNTIME_INFO: JSON.stringify({
          namespace: 'console-project',
          workspace: 'test-workspace',
          app_name: 'test-app'
        })
      });
      expect(result1).toBeUndefined();

      // Only 1 part
      const result2 = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams({ 
        APPLICATION_RUNTIME_INFO: JSON.stringify({
          namespace: 'console',
          app_name: 'test-app'
        })
      });
      expect(result2).toBeUndefined();

      // Empty string
      const result3 = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams({ 
        APPLICATION_RUNTIME_INFO: JSON.stringify({
          namespace: '',
          app_name: 'test-app'
        })
      });
      expect(result3).toBeUndefined();
    });

    it('should return undefined when using AEM asset metadata structure (no runtime info)', () => {
      // Using the AEM asset metadata structure from the test data
      const aemAssetMetadata = {
        "jcr:created": "Fri Oct 25 2024 18:11:41 GMT+0000",
        "jcr:createdBy": "DBENGE@ADOBE.COM",
        "jcr:uuid": "e8cc4fc5-ea72-49ed-9cd2-c71d6f2fa9b1",
        "jcr:content": {
          "dam:assetState": "processed",
          "cq:name": "sad_elmo.webp",
          "metadata": {
            "a2b__sync_on_change": true
          }
        }
      };

      const result = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(aemAssetMetadata);
      expect(result).toBeUndefined();
    });

    it('should return valid ApplicationRuntimeInfo when using AEM asset processing complete event', () => {
      // Using the AEM asset processing complete event from the test data
      const aemAssetProcessingEvent = {
        "source": "acct:aem-p142461-e1463137@adobe.com",
        "data": {
          "assetId": "urn:aaid:aem:20fec14a-b5b8-4c7d-85f4-e619d66281dc",
          "assetMetadata": {
            "xcm:machineKeywords": [
              {
                "confidence": 0.896,
                "value": "editorial photography"
              }
            ]
          }
        },
        "APPLICATION_RUNTIME_INFO": "{\"namespace\":\"27200-a2b-benge\",\"app_name\":\"agency\",\"action_package_name\":\"a2b-agency\"}"
      };

      const result = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(aemAssetProcessingEvent);
      
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(ApplicationRuntimeInfo);
      expect(result!.consoleId).toBe('27200');
      expect(result!.projectName).toBe('a2b');
      expect(result!.workspace).toBe('benge');
      expect(result!.actionPackageName).toBe('a2b-agency');
      expect(result!.appName).toBe('agency');
    });

    it('should pass when using agency asset sync event (namespace has 3 parts)', () => {
      // Using the agency asset sync event from the test data
      const agencyAssetSyncEvent = {
        "source": "urn:uuid:af5c4d93-e1e0-4985-ad33-80fde3837aaa",
        "data": {
          "app_runtime_info": {
            "actionPackageName": "a2b-agency",
            "appName": "agency",
            "consoleId": "27200",
            "projectName": "a2b",
            "workspace": "benge"
          },
          "asset_id": "8327388d-d9e3-47c5-9280-a426c5dcb3b1"
        },
        "APPLICATION_RUNTIME_INFO": "{\"namespace\":\"27200-brand2agency-benge\",\"app_name\":\"brand\",\"action_package_name\":\"a2b-brand\"}"
      };

      const result = ApplicationRuntimeInfo.getApplicationRuntimeInfoFromActionParams(agencyAssetSyncEvent);
      
      // Should pass because namespace "27200-brand2agency-benge" has 3 parts: 27200-brand2agency-benge
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(ApplicationRuntimeInfo);
      expect(result!.consoleId).toBe('27200');
      expect(result!.projectName).toBe('brand2agency');
      expect(result!.workspace).toBe('benge');
      expect(result!.actionPackageName).toBe('a2b-brand');
      expect(result!.appName).toBe('brand');
    });
  });

  describe('getAppRuntimeInfoFromEventData', () => {
    it('should return undefined when params do not contain data', () => {
      // Test with empty params
      const result1 = ApplicationRuntimeInfo.getAppRuntimeInfoFromEventData({});
      expect(result1).toBeUndefined();

      // Test with params that don't have data
      const result2 = ApplicationRuntimeInfo.getAppRuntimeInfoFromEventData({ 
        someOtherParam: 'value' 
      });
      expect(result2).toBeUndefined();

      // Test with null params
      const result3 = ApplicationRuntimeInfo.getAppRuntimeInfoFromEventData(null);
      expect(result3).toBeUndefined();
    });

    it('should return undefined when data does not contain app_runtime_info', () => {
      const result1 = ApplicationRuntimeInfo.getAppRuntimeInfoFromEventData({ 
        data: {} 
      });
      expect(result1).toBeUndefined();

      const result2 = ApplicationRuntimeInfo.getAppRuntimeInfoFromEventData({ 
        data: { someOtherField: 'value' } 
      });
      expect(result2).toBeUndefined();
    });

    it('should return undefined when using AEM asset metadata structure (no runtime info)', () => {
      // Using the AEM asset metadata structure from the test data
      const aemAssetMetadata = {
        "jcr:created": "Fri Oct 25 2024 18:11:41 GMT+0000",
        "jcr:createdBy": "DBENGE@ADOBE.COM",
        "jcr:uuid": "e8cc4fc5-ea72-49ed-9cd2-c71d6f2fa9b1",
        "jcr:content": {
          "dam:assetState": "processed",
          "cq:name": "sad_elmo.webp",
          "metadata": {
            "a2b__sync_on_change": true
          }
        }
      };

      const result = ApplicationRuntimeInfo.getAppRuntimeInfoFromEventData(aemAssetMetadata);
      expect(result).toBeUndefined();
    });

    it('should fail when using AEM asset processing complete event (no app_runtime_info in data)', () => {
      // Using the AEM asset processing complete event from the test data
      const aemAssetProcessingEvent = {
        "source": "acct:aem-p142461-e1463137@adobe.com",
        "data": {
          "assetId": "urn:aaid:aem:20fec14a-b5b8-4c7d-85f4-e619d66281dc",
          "assetMetadata": {
            "xcm:machineKeywords": [
              {
                "confidence": 0.896,
                "value": "editorial photography"
              }
            ]
          }
        },
        "APPLICATION_RUNTIME_INFO": "{\"namespace\":\"27200-a2b-benge\",\"app_name\":\"agency\",\"action_package_name\":\"a2b-agency\"}"
      };

      const result = ApplicationRuntimeInfo.getAppRuntimeInfoFromEventData(aemAssetProcessingEvent);
      expect(result).toBeUndefined();
    });

    it('should pass when using agency asset sync event (has app_runtime_info in data)', () => {
      // Using the agency asset sync event from the test data
      const agencyAssetSyncEvent = {
        "source": "urn:uuid:af5c4d93-e1e0-4985-ad33-80fde3837aaa",
        "data": {
          "app_runtime_info": {
            "actionPackageName": "a2b-agency",
            "appName": "agency",
            "consoleId": "27200",
            "projectName": "a2b",
            "workspace": "benge"
          },
          "asset_id": "8327388d-d9e3-47c5-9280-a426c5dcb3b1",
          "asset_path": "/content/dam/agency_work_for_BRAND_A/Screenshot 2025-05-28 at 5.38.13 PM.png"
        },
        "APPLICATION_RUNTIME_INFO": "{\"namespace\":\"27200-brand2agency-benge\",\"app_name\":\"brand\",\"action_package_name\":\"a2b-brand\"}"
      };

      const result = ApplicationRuntimeInfo.getAppRuntimeInfoFromEventData(agencyAssetSyncEvent);
      
      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(ApplicationRuntimeInfo);
      expect(result!.consoleId).toBe('27200');
      expect(result!.projectName).toBe('a2b');
      expect(result!.workspace).toBe('benge');
      expect(result!.actionPackageName).toBe('a2b-agency');
      expect(result!.appName).toBe('agency');
    });
  });

  describe('constructor and instance methods', () => {
    it('should create instance with valid runtime info', () => {
      const runtimeInfo: IApplicationRuntimeInfo = {
        consoleId: 'test-console',
        projectName: 'test-project',
        workspace: 'test-workspace',
        actionPackageName: 'test-package',
        appName: 'test-app'
      };

      const instance = new ApplicationRuntimeInfo(runtimeInfo);
      
      expect(instance.consoleId).toBe('test-console');
      expect(instance.projectName).toBe('test-project');
      expect(instance.workspace).toBe('test-workspace');
      expect(instance.actionPackageName).toBe('test-package');
      expect(instance.appName).toBe('test-app');
    });

    it('should serialize correctly', () => {
      const runtimeInfo: IApplicationRuntimeInfo = {
        consoleId: 'test-console',
        projectName: 'test-project',
        workspace: 'test-workspace',
        actionPackageName: 'test-package',
        appName: 'test-app'
      };

      const instance = new ApplicationRuntimeInfo(runtimeInfo);
      const serialized = instance.serialize();
      
      expect(serialized).toEqual({
        consoleId: 'test-console',
        projectName: 'test-project',
        workspace: 'test-workspace',
        appName: 'test-app',
        actionPackageName: 'test-package'
      });
    });
  });
});

