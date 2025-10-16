# Demo Mode Quick Reference

## Essential Patterns

### 1. Demo Mode Check
```typescript
const isDemoMode = viewProps.aioEnableDemoMode;

if (!isDemoMode) {
  return (
    <View padding="size-400">
      <Heading level={1}>Component Name</Heading>
      <Text>This component is only available in demo mode.</Text>
    </View>
  );
}
```

### 2. Mock Data Setup
```typescript
const mockData: YourType[] = [
  {
    id: 'item-1',
    name: 'Example Item',
    // ... other properties
  }
];

const [data, setData] = useState<YourType[]>(isDemoMode ? mockData : []);
```

### 3. Status Light Colors
- `positive`: Success, enabled, active
- `notice`: Warning, pending, inbound
- `info`: Information, outbound, brand
- `negative`: Error, disabled, inactive
- `neutral`: Default, custom

### 4. Form Reset Pattern
```typescript
const resetForm = () => {
  setFormData({
    // default values
  });
  setSelectedCategory('all');
};
```

### 5. Category Filtering
```typescript
const [selectedCategory, setSelectedCategory] = useState<string>('all');

const getFilteredData = () => {
  if (selectedCategory === 'all') return data;
  return data.filter(item => item.category === selectedCategory);
};
```

### 6. Available React Spectrum Components
- View, Heading, Text, Button, ButtonGroup
- Flex, TableView, TableHeader, TableBody, Column, Row, Cell
- TextField, ComboBox, Switch, NumberField, TextArea
- ActionGroup, Item, Divider, StatusLight, SearchField

### 7. Environment Setup
```bash
# Add to .env file
AIO_ENABLE_DEMO_MODE=true

# Fix null byte issues
copy _dot.env .env
```

### 8. Navigation Integration
```javascript
// App.js
import YourComponent from './layout/YourComponent';

<Route path='/your_route' element={<YourComponent viewProps={safeViewProps} />} />

// SideBar.js
<NavLink to="/your_route">Your Component</NavLink>
```

## Common Issues & Solutions

### Issue: "Rules configuration is only available in demo mode"
**Solution**: Check .env file for null bytes and recreate it

### Issue: React Spectrum component not found
**Solution**: Use only available components from the list above

### Issue: Form not resetting properly
**Solution**: Include all state variables in resetForm function

### Issue: Category filtering not working
**Solution**: Ensure getFilteredData() is called in render

## Best Practices

1. **Always include demo mode check** at component start
2. **Use realistic mock data** with varied examples
3. **Provide helpful fallback UI** when demo mode disabled
4. **Include comprehensive filtering** (search, category, status)
5. **Use consistent color coding** for status indicators
6. **Test both demo enabled/disabled states**
7. **Include proper TypeScript interfaces** for all data
8. **Use consistent naming conventions** (kebab-case routes, Title Case display)

## File Structure
```
src/dx-excshell-1/web-src/src/components/layout/
├── YourComponent.tsx          # Main component
├── App.js                     # Add route here
└── common/SideBar.js          # Add navigation here
```

## Quick Start Checklist
- [ ] Create component with demo mode check
- [ ] Add mock data with realistic examples
- [ ] Implement CRUD operations
- [ ] Add filtering and search
- [ ] Include form with proper validation
- [ ] Add to App.js routing
- [ ] Add to SideBar.js navigation
- [ ] Test in both demo modes
- [ ] Verify all React Spectrum components are available

