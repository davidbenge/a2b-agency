# Business Rules Manager

## Overview

The Business Rules Manager is a comprehensive component for managing validation rules, templates, and dependencies in the Adobe Experience Cloud Shell application. It provides a demo mode interface for agencies to configure business rules for their client brands.

**Integration with Brand Manager**: Business Rules are now integrated with the Brand Manager, allowing users to access and manage rules specific to each brand directly from the brand management interface.

## Features

### 1. Brand-Specific Rules Management
- **Per-brand configuration**: Each brand has its own set of business rules
- **Brand context**: Rules are contextualized to the specific brand
- **Integrated access**: Access business rules directly from the brand list
- **Brand-specific templates**: Templates tailored to each brand's requirements

### 2. Field Validation Rules
- **String validation**: Text field validation with length constraints
- **Email validation**: Email format validation
- **URL validation**: Website URL format validation
- **Phone validation**: Phone number format validation
- **Required field management**: Toggle required/optional fields
- **Custom validation messages**: Configurable error messages

### 3. Asset Validation Rules
- **File size limits**: Maximum file size validation (e.g., 5MB for logos)
- **File type restrictions**: Allowed file types (JPG, PNG, SVG)
- **Dimension requirements**: Minimum image dimensions
- **Asset property validation**: Custom property validation rules

### 4. Rule Templates
- **Predefined rule sets**: Common validation rule combinations
- **Template management**: Create, edit, and delete templates
- **Rule inheritance**: Apply multiple rules from templates
- **Version tracking**: Last modified and creator information

### 5. Rule Dependencies
- **Dependency management**: Define rule execution order
- **Conditional validation**: Rules that depend on other rules
- **Required dependencies**: Mandatory rule prerequisites
- **Validation flow control**: Manage complex validation scenarios

## Integration with Brand Manager

### Accessing Business Rules
1. **From Brand List**: Click the "Rules" button in the Actions column for any brand
2. **Brand Context**: Rules are automatically contextualized to the selected brand
3. **Navigation**: Use the "Back to Brands" button to return to the brand list

### Brand-Specific Features
- **Brand name integration**: Rules and templates include the brand name
- **Brand-specific validation**: Validation messages reference the specific brand
- **Brand context preservation**: All operations maintain brand context

## Demo Mode Features

### Mock Data
The component includes realistic sample data for demonstration:

**Field Rules:**
- Brand name validation (2-50 characters)
- Contact email validation
- Website URL validation
- Phone number validation

**Asset Rules:**
- Logo file size limit (5MB)
- Image file type restrictions
- Minimum image dimensions (1920x1080)

**Templates:**
- Basic Brand Template
- Premium Brand Template
- Asset Validation Template

**Dependencies:**
- Website requires brand name
- Logo requires brand name and website
- Contact info requires email validation

### Interactive Features
- **Search functionality**: Filter rules by type, description, or property
- **Sorting**: Sort tables by various columns
- **Multi-select**: Select multiple rules for bulk operations
- **Dialog forms**: Add/edit rules through modal dialogs
- **Loading states**: Simulated API loading with progress indicators

## Component Structure

### Main Component: `BrandBusinessRulesManager.jsx`
- **Location**: `src/components/BrandBusinessRulesManager.jsx`
- **Dependencies**: React Spectrum UI components
- **Props**: `brand` (Brand object), `onBack` (callback function)
- **Icons**: Custom icon set from `@spectrum-icons/workflow`

### Integration Components
- **BrandManagerView**: Updated to include business rules access
- **Navigation**: Breadcrumb navigation with back functionality
- **Brand Context**: Rules contextualized to specific brands

## Usage

### Accessing Business Rules for a Brand
1. Navigate to the Brand Manager
2. Find the brand in the list
3. Click the "Rules" button in the Actions column
4. Manage business rules specific to that brand
5. Use "Back to Brands" to return to the brand list

### Managing Rules
1. **View Rules**: Browse existing rules in the data tables
2. **Search Rules**: Use the search field to filter rules
3. **Add Rules**: Click "Add Rule" button to create new rules
4. **Edit Rules**: Click the edit icon on any rule row
5. **Delete Rules**: Click the delete icon to remove rules

### Working with Templates
1. **Browse Templates**: View existing rule templates for the brand
2. **Create Templates**: Add new templates with rule combinations
3. **Apply Templates**: Use templates to quickly apply rule sets

### Managing Dependencies
1. **View Dependencies**: See rule dependency relationships
2. **Add Dependencies**: Create new dependency rules
3. **Validate Flow**: Ensure proper rule execution order

## Technical Implementation

### State Management
- **Local State**: Uses React useState for demo mode
- **Brand Context**: Rules are contextualized to the selected brand
- **Mock Data**: Pre-populated with brand-specific sample data
- **Loading Simulation**: Simulates API calls with setTimeout

### UI Components
- **React Spectrum**: Adobe's design system components
- **TableView**: Data display with sorting and filtering
- **Dialog**: Modal forms for data entry
- **ButtonGroup**: Tab navigation
- **Form Components**: Input fields, pickers, switches
- **Breadcrumb Navigation**: Back navigation to brand list

### Responsive Design
- **Grid Layout**: Responsive grid system
- **Flex Components**: Flexible layout containers
- **Mobile Friendly**: Adapts to different screen sizes

## Future Enhancements

### API Integration
- **Real API endpoints**: Replace mock data with actual API calls
- **CRUD operations**: Full create, read, update, delete functionality
- **Error handling**: Proper error states and user feedback
- **Brand-specific APIs**: API endpoints for brand-specific rules

### Advanced Features
- **Rule testing**: Test validation rules with sample data
- **Rule import/export**: Import/export rule configurations
- **Rule versioning**: Version control for rule changes
- **Audit logging**: Track rule modifications and usage
- **Rule inheritance**: Inherit rules from parent brands

### Performance Optimizations
- **Pagination**: Handle large rule sets efficiently
- **Caching**: Cache frequently accessed rules
- **Lazy loading**: Load rule data on demand
- **Brand-specific caching**: Cache rules per brand

## Testing

### Manual Testing
1. **Navigation**: Verify "Rules" button works from brand list
2. **Brand Context**: Test that rules are brand-specific
3. **Back Navigation**: Test "Back to Brands" functionality
4. **Tab Switching**: Test all four tabs (Field, Asset, Templates, Dependencies)
5. **Search**: Test search functionality across all tabs
6. **Sorting**: Verify table sorting works properly
7. **Dialogs**: Test add/edit dialog forms
8. **Responsive**: Test on different screen sizes

### Automated Testing
- **Unit Tests**: Component rendering and state management
- **Integration Tests**: Navigation and routing
- **E2E Tests**: Complete user workflows
- **Brand Integration Tests**: Test brand-specific functionality

## Dependencies

### Required Packages
- `@adobe/react-spectrum`: UI component library
- `@spectrum-icons/workflow`: Icon set
- `react`: Core React library
- `react-router-dom`: Navigation and routing

### Development Dependencies
- `@types/react`: TypeScript definitions
- `eslint`: Code linting
- `jest`: Testing framework

## Troubleshooting

### Common Issues
1. **Icons not displaying**: Ensure `@spectrum-icons/workflow` is installed
2. **Component not loading**: Check import paths and dependencies
3. **Styling issues**: Verify React Spectrum theme is properly configured
4. **Navigation problems**: Check route configuration in App.js
5. **Brand context missing**: Ensure brand prop is passed correctly

### Debug Mode
- **Console logging**: Check browser console for errors
- **React DevTools**: Inspect component state and props
- **Network tab**: Monitor API calls (when implemented)
- **Brand context**: Verify brand object is properly passed

## Contributing

### Code Style
- **React Spectrum**: Follow Adobe's design system guidelines
- **Component structure**: Use functional components with hooks
- **State management**: Use local state for demo mode
- **Error handling**: Implement proper error boundaries
- **Brand context**: Always maintain brand context in rules

### Documentation
- **Component comments**: Document complex logic
- **API documentation**: Document future API integration points
- **User guides**: Provide clear usage instructions
- **Brand integration**: Document brand-specific features 