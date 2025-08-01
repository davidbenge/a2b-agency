# Rules Manager Feature

## Overview

The Rules Manager is a standalone feature that allows agencies to create and manage business rules, templates, and dependencies independently of brands. This enables agencies to build reusable rule sets that can be applied to multiple client brands.

## Key Features

### 1. Field Validation Rules
- **Email Format Validation**: Ensures proper email format using regex patterns
- **Phone Number Format**: Validates phone numbers according to international standards
- **Custom Patterns**: Support for any regex-based validation rules
- **Error Messages**: Customizable error messages for each validation rule
- **Brand Application**: Rules can be applied to multiple brands

### 2. Asset Validation Rules
- **File Size Limits**: Validate maximum file sizes for uploads
- **Format Restrictions**: Ensure files meet specific format requirements
- **Dimension Checks**: Validate image dimensions and aspect ratios

### 3. Rule Templates
- **Predefined Sets**: Create templates that combine multiple rules
- **Reusable Configurations**: Apply the same rule set to multiple brands
- **Template Management**: Add, edit, and delete rule templates

### 4. Rule Dependencies
- **Execution Order**: Control the sequence in which rules are applied
- **Prerequisite Rules**: Define rules that must pass before others execute
- **Logical Flows**: Create complex validation chains

## User Interface

### Navigation
- Accessible from the main sidebar navigation
- Separate from Brand Manager for independent rule management
- Clean, intuitive interface following Adobe React Spectrum design patterns

### Table Views
- **Responsive Design**: All tables support horizontal scrolling on smaller screens
- **Sorting**: Click column headers to sort data
- **Filtering**: Search and filter capabilities for large rule sets
- **Actions**: Edit, delete, and manage rules directly from tables

### Forms and Dialogs
- **Add/Edit Dialogs**: Modal dialogs for creating and modifying rules
- **Help Text**: Contextual help for all form fields
- **Validation**: Real-time form validation with clear error messages
- **Brand Selection**: Multi-select dropdowns for applying rules to brands

## Technical Implementation

### Component Structure
```
RulesManagerView.jsx
├── Field Validation Rules Table
├── Asset Validation Rules Table
├── Rule Templates Table
└── Rule Dependencies Table
```

### State Management
- **Local State**: Demo mode uses React useState for data management
- **Mock Data**: Pre-populated with sample rules and templates
- **CRUD Operations**: Full create, read, update, delete functionality

### Data Models

#### Rule Object
```javascript
{
  id: number,
  name: string,
  type: 'field_validation' | 'asset_validation',
  pattern: string, // regex or rule pattern
  message: string, // error message
  isActive: boolean,
  appliedToBrands: string[]
}
```

#### Template Object
```javascript
{
  id: number,
  name: string,
  description: string,
  rules: string[], // array of rule names
  appliedToBrands: string[]
}
```

#### Dependency Object
```javascript
{
  id: number,
  ruleWithDependencies: string,
  prerequisiteRules: string[],
  description: string
}
```

## Usage Scenarios

### Agency Workflow
1. **Create Base Rules**: Agency creates standard validation rules
2. **Build Templates**: Combine rules into reusable templates
3. **Apply to Brands**: Assign rules and templates to client brands
4. **Manage Dependencies**: Set up rule execution order
5. **Monitor and Update**: Maintain and update rules as needed

### Example Use Cases
- **Contact Form Validation**: Email, phone, and required field validation
- **File Upload Rules**: Image size, format, and dimension restrictions
- **E-commerce Validation**: Product data validation and format checking
- **Multi-brand Consistency**: Ensure consistent validation across client brands

## Benefits

### For Agencies
- **Reusability**: Create rules once, apply to multiple brands
- **Consistency**: Maintain uniform validation across all client brands
- **Efficiency**: Reduce time spent on repetitive rule creation
- **Scalability**: Easily add new brands with existing rule sets

### For Clients
- **Quality Assurance**: Consistent validation across all touchpoints
- **User Experience**: Clear, helpful error messages
- **Data Integrity**: Ensures high-quality data collection
- **Compliance**: Meet industry standards and regulations

## Future Enhancements

### Planned Features
- **Rule Versioning**: Track changes and rollback capabilities
- **Rule Testing**: Test rules against sample data
- **Analytics**: Track rule performance and usage
- **Import/Export**: Bulk rule management capabilities
- **API Integration**: Connect with external validation services

### Advanced Capabilities
- **Conditional Rules**: Rules that apply based on specific conditions
- **Custom Functions**: JavaScript-based custom validation logic
- **Rule Scheduling**: Time-based rule activation/deactivation
- **Multi-language Support**: Localized error messages

## Demo Mode

The Rules Manager includes a comprehensive demo mode with:
- **Sample Rules**: Pre-populated validation rules
- **Mock Templates**: Example rule templates
- **Dependency Examples**: Sample rule dependencies
- **Full CRUD**: Complete create, read, update, delete functionality

This allows users to explore and test the feature without requiring backend integration.

## Integration with Brand Manager

While the Rules Manager is independent, it integrates with the Brand Manager through:
- **Brand References**: Rules and templates reference brand names
- **Shared Data**: Consistent brand naming across both features
- **Unified Experience**: Seamless navigation between features

The separation allows for independent rule management while maintaining the connection to brand-specific applications. 