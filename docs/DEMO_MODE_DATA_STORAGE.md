# Demo Mode Data Storage: How Test Brand Data Works Locally

## Overview

The Brand Manager demo mode uses **in-memory state management** to store and manipulate test brand data entirely within the browser's memory. This approach allows developers to test the full CRUD (Create, Read, Update, Delete) functionality without requiring a backend server or database connection.

## How It Currently Works

### 1. **Initial Data Loading**

```typescript
// Mock data defined as a constant array
const mockBrands: Brand[] = [
    new Brand({
        brandId: '1',
        secret: 'mock-secret-1',
        name: 'Test Brand 1',
        endPointUrl: 'https://example1.com/api',
        enabled: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        enabledAt: new Date('2024-01-01')
    }),
    // ... more mock brands
];

// State initialization with mock data when demo mode is enabled
const [brands, setBrands] = useState<Brand[]>(ENABLE_DEMO_MODE ? mockBrands : []);
```

### 2. **Data Storage Location**

- **Storage Type**: React component state (useState hook)
- **Location**: Browser memory (RAM)
- **Persistence**: **None** - data is lost on page refresh
- **Scope**: Component-level state

### 3. **CRUD Operations in Demo Mode**

#### **Create (Add New Brand)**
```typescript
if (viewMode === 'add') {
    const newBrand = new Brand({
        ...brandData,
        brandId: uuidv4(), // Generate unique ID
        secret: 'mock-secret-' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
        enabledAt: brandData.enabled ? new Date() : null
    });
    
    setBrands([...brands, newBrand]); // Add to state array
}
```

#### **Read (Display Brands)**
```typescript
// Direct access to brands state
const filteredAndSortedBrands = getFilteredAndSortedBrands();
// Returns filtered/sorted copy of brands array
```

#### **Update (Edit Brand)**
```typescript
if (viewMode === 'edit' && selectedBrand) {
    const updatedBrand = new Brand({
        ...selectedBrand.toJSON(),
        ...brandData,
        brandId: selectedBrand.brandId, // Preserve original ID
        updatedAt: new Date(),
        enabledAt: brandData.enabled ? (selectedBrand.enabledAt || new Date()) : null
    });
    
    setBrands(brands.map(brand => 
        brand.brandId === selectedBrand.brandId ? updatedBrand : brand
    ));
}
```

#### **Delete (Remove Brand)**
```typescript
if (ENABLE_DEMO_MODE) {
    setBrands(brands.filter(brand => brand.brandId !== brandId));
}
```

## Current Limitations

### 1. **No Data Persistence**
- **Problem**: All changes are lost when the page is refreshed
- **Impact**: Users must recreate test data after each browser refresh
- **Workaround**: None currently implemented

### 2. **Memory-Only Storage**
- **Problem**: Data exists only in browser memory
- **Impact**: No backup or recovery of test data
- **Workaround**: None currently implemented

### 3. **No Cross-Tab Synchronization**
- **Problem**: Changes in one browser tab don't appear in other tabs
- **Impact**: Limited testing scenarios
- **Workaround**: None currently implemented

### 4. **No Data Export/Import**
- **Problem**: Cannot save or load custom test datasets
- **Impact**: Limited flexibility for different testing scenarios
- **Workaround**: None currently implemented

## Data Flow Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mock Data     │───▶│  React State     │───▶│   UI Display    │
│   (Constants)   │    │  (useState)      │    │   (Components)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  User Actions    │
                       │  (CRUD Ops)      │
                       └──────────────────┘
                              │
                              ▼
                       ┌──────────────────┘
                       │  State Updates   │
                       │  (setBrands)     │
                       └──────────────────┘
```

## Potential Improvements

### 1. **Add localStorage Persistence**

```typescript
// Save to localStorage
const saveBrandsToStorage = (brands: Brand[]) => {
    localStorage.setItem('demo-brands', JSON.stringify(brands));
};

// Load from localStorage
const loadBrandsFromStorage = (): Brand[] => {
    const stored = localStorage.getItem('demo-brands');
    return stored ? JSON.parse(stored) : mockBrands;
};

// Initialize state with stored data
const [brands, setBrands] = useState<Brand[]>(() => 
    ENABLE_DEMO_MODE ? loadBrandsFromStorage() : []
);

// Update storage when brands change
useEffect(() => {
    if (ENABLE_DEMO_MODE) {
        saveBrandsToStorage(brands);
    }
}, [brands, ENABLE_DEMO_MODE]);
```

### 2. **Add Data Export/Import**

```typescript
// Export current data
const exportBrands = () => {
    const dataStr = JSON.stringify(brands, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'demo-brands.json';
    link.click();
};

// Import data
const importBrands = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedBrands = JSON.parse(e.target?.result as string);
            setBrands(importedBrands);
        } catch (error) {
            console.error('Invalid import file:', error);
        }
    };
    reader.readAsText(file);
};
```

### 3. **Add Reset Functionality**

```typescript
const resetToDefaultData = () => {
    if (confirm('Reset to default demo data? This will clear all changes.')) {
        setBrands(mockBrands);
        localStorage.removeItem('demo-brands');
    }
};
```

## Demo Mode Detection

The demo mode is automatically enabled based on environment variables:

```typescript
const ENABLE_DEMO_MODE = process.env.REACT_APP_ENABLE_DEMO_MODE === 'true' || 
                        process.env.NODE_ENV === 'development' ||
                        process.env.NODE_ENV !== 'production';
```

This means:
- **Development**: Demo mode is ON by default
- **Production**: Demo mode is OFF by default
- **Override**: Can be forced ON with `REACT_APP_ENABLE_DEMO_MODE=true`

## Best Practices for Demo Mode

### 1. **Clear Indicators**
- Always show "Demo Mode" in the UI
- Display warning messages about data persistence
- Use different styling for demo vs production

### 2. **Safe Operations**
- Never allow demo mode in production
- Validate all data operations
- Provide clear error messages

### 3. **Data Management**
- Keep mock data realistic but clearly identifiable
- Use consistent naming conventions
- Include various data states (enabled/disabled, different dates, etc.)

### 4. **User Experience**
- Provide clear instructions about demo limitations
- Offer easy ways to reset or refresh data
- Include export/import capabilities when possible

## Summary

The current demo mode implementation provides a fully functional brand management interface using in-memory state storage. While it lacks persistence, it enables complete testing of the UI and business logic without backend dependencies. The modular design makes it easy to add persistence features like localStorage or sessionStorage in the future.

**Key Benefits:**
- ✅ No backend required
- ✅ Full CRUD functionality
- ✅ Real-time UI updates
- ✅ Easy to test and develop

**Key Limitations:**
- ❌ No data persistence
- ❌ Data lost on refresh
- ❌ No cross-tab sync
- ❌ Limited data management

This approach strikes a good balance between functionality and simplicity for development and testing purposes. 