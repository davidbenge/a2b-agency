import { BrandManager } from '../classes/BrandManager';
import { Brand } from '../classes/Brand';
import { MockFactory } from './mocks/MockFactory';
import { BRAND_STATE_PREFIX, BRAND_FILE_STORE_DIR } from '../constants';

// Import the Jest setup to ensure mocks are loaded
import './mocks/jest.setup';

describe('BrandManager', () => {
  let brandManager: BrandManager;
  let mockFileStore: any;
  let mockStateStore: any;

  beforeEach(() => {
    // Reset mocks before each test
    MockFactory.reset();
    
    brandManager = new BrandManager('debug');
    mockFileStore = MockFactory.getFileStore();
    mockStateStore = MockFactory.getStateStore();
  });

  afterEach(() => {
    MockFactory.clearAll();
  });

  describe('constructor', () => {
    it('should create a BrandManager instance with logger', () => {
      expect(brandManager).toBeInstanceOf(BrandManager);
    });
  });

  describe('getStateStore', () => {
    it('should initialize and return state store', async () => {
      const stateStore = await brandManager.getStateStore();
      expect(stateStore).toBeDefined();
    });

    it('should return cached state store on subsequent calls', async () => {
      const stateStore1 = await brandManager.getStateStore();
      const stateStore2 = await brandManager.getStateStore();
      expect(stateStore1).toBe(stateStore2);
    });
  });

  describe('getFileStore', () => {
    it('should initialize and return file store', async () => {
      const fileStore = await brandManager.getFileStore();
      expect(fileStore).toBeDefined();
    });

    it('should return cached file store on subsequent calls', async () => {
      const fileStore1 = await brandManager.getFileStore();
      const fileStore2 = await brandManager.getFileStore();
      expect(fileStore1).toBe(fileStore2);
    });
  });

  describe('saveBrand', () => {
    it('should save brand to both state store and file store', async () => {
      const testBrand = new Brand({
        brandId: 'test-brand-1',
        secret: 'test-secret-123',
        name: 'Test Brand One',
        endPointUrl: 'https://test.com/api',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        enabledAt: new Date()
      });

      await brandManager.saveBrand(testBrand);

      // Check state store
      const stateKey = `${BRAND_STATE_PREFIX}${testBrand.brandId}`;
      const stateData = await mockStateStore.get(stateKey);
      expect(stateData).toBeDefined();
      expect(stateData.value).toBe(testBrand.toJSONString());

      // Check file store
      const filePath = `${BRAND_FILE_STORE_DIR}/${testBrand.brandId}.json`;
      const fileExists = mockFileStore.fileExists(filePath);
      expect(fileExists).toBe(true);
    });
  });

  describe('getBrand', () => {
    it('should retrieve brand from state store when available', async () => {
      const testBrand = new Brand({
        brandId: 'test-brand-2',
        secret: 'test-secret-456',
        name: 'Test Brand Two',
        endPointUrl: 'https://test2.com/api',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        enabledAt: new Date()
      });

      // Seed state store
      const stateKey = `${BRAND_STATE_PREFIX}${testBrand.brandId}`;
      await mockStateStore.put(stateKey, testBrand.toJSONString());

      const retrievedBrand = await brandManager.getBrand(testBrand.brandId);
      expect(retrievedBrand).toBeDefined();
      expect(retrievedBrand?.brandId).toBe(testBrand.brandId);
    });

    it('should retrieve brand from file store when not in state store', async () => {
      const testBrand = new Brand({
        brandId: 'test-brand-3',
        secret: 'test-secret-789',
        name: 'Test Brand Three',
        endPointUrl: 'https://test3.com/api',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        enabledAt: new Date()
      });

      // Seed file store
      const filePath = `${BRAND_FILE_STORE_DIR}/${testBrand.brandId}.json`;
      await mockFileStore.write(filePath, testBrand.toJSONString());

      const retrievedBrand = await brandManager.getBrand(testBrand.brandId);
      expect(retrievedBrand).toBeDefined();
      expect(retrievedBrand?.brandId).toBe(testBrand.brandId);
    });

    it('should return undefined when brand not found in either store', async () => {
      const retrievedBrand = await brandManager.getBrand('non-existent-brand');
      expect(retrievedBrand).toBeUndefined();
    });
  });

  describe('deleteBrand', () => {
    it('should delete brand from both state store and file store', async () => {
      const testBrand = new Brand({
        brandId: 'test-brand-4',
        secret: 'test-secret-101',
        name: 'Test Brand Four',
        endPointUrl: 'https://test4.com/api',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        enabledAt: new Date()
      });

      // Seed both stores
      const stateKey = `${BRAND_STATE_PREFIX}${testBrand.brandId}`;
      await mockStateStore.put(stateKey, testBrand.toJSONString());
      
      const filePath = `${BRAND_FILE_STORE_DIR}/${testBrand.brandId}.json`;
      await mockFileStore.write(filePath, testBrand.toJSONString());

      // Verify initial state
      expect(mockStateStore.keyExists(stateKey)).toBe(true);
      expect(mockFileStore.fileExists(filePath)).toBe(true);

      // Delete brand
      await brandManager.deleteBrand(testBrand.brandId);

      // Verify deletion
      expect(mockStateStore.keyExists(stateKey)).toBe(false);
      expect(mockFileStore.fileExists(filePath)).toBe(false);
    });
  });

  describe('getAllBrands', () => {
    it('should return all brands from file store', async () => {
      const testBrands = [
        new Brand({
          brandId: 'test-brand-5',
          secret: 'test-secret-202',
          name: 'Test Brand Five',
          endPointUrl: 'https://test5.com/api',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          enabledAt: new Date()
        }),
        new Brand({
          brandId: 'test-brand-6',
          secret: 'test-secret-303',
          name: 'Test Brand Six',
          endPointUrl: 'https://test6.com/api',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          enabledAt: new Date()
        })
      ];

      // Seed file store
      for (const brand of testBrands) {
        const filePath = `${BRAND_FILE_STORE_DIR}/${brand.brandId}.json`;
        await mockFileStore.write(filePath, brand.toJSONString());
      }

      const retrievedBrands = await brandManager.getAllBrands();
      expect(retrievedBrands).toHaveLength(2);
      expect(retrievedBrands.map(b => b.brandId)).toContain('test-brand-5');
      expect(retrievedBrands.map(b => b.brandId)).toContain('test-brand-6');
    });

    it('should return empty array when no brands exist', async () => {
      const retrievedBrands = await brandManager.getAllBrands();
      expect(retrievedBrands).toHaveLength(0);
    });
  });

  describe('extractBrandIdFromFileDataName', () => {
    it('should extract brand ID from standard file path', () => {
      const filePath = `${BRAND_FILE_STORE_DIR}/test-brand-7.json`;
      const brandId = brandManager.extractBrandIdFromFileDataName(filePath);
      expect(brandId).toBe('test-brand-7');
    });

    it('should extract brand ID from nested file path', () => {
      const filePath = `some/nested/path/${BRAND_FILE_STORE_DIR}/test-brand-8.json`;
      const brandId = brandManager.extractBrandIdFromFileDataName(filePath);
      expect(brandId).toBe('test-brand-8');
    });

    it('should return undefined for invalid file path', () => {
      const filePath = 'invalid/path.txt';
      const brandId = brandManager.extractBrandIdFromFileDataName(filePath);
      expect(brandId).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle file store read errors gracefully', async () => {
      // Try to read a non-existent file
      const brand = await brandManager.getBrandFromFileStoreByFileName('non-existent.json');
      expect(brand).toBeUndefined();
    });

    it('should handle JSON parsing errors gracefully', async () => {
      // Create a file with invalid JSON
      const filePath = `${BRAND_FILE_STORE_DIR}/invalid-json.json`;
      await mockFileStore.write(filePath, 'invalid json content');

      const brand = await brandManager.getBrandFromFileStoreByFileName(filePath);
      expect(brand).toBeUndefined();
    });
  });
});
