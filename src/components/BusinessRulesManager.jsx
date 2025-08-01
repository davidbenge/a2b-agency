import React, { useState, useEffect } from 'react';
import {
  View,
  Flex,
  Heading,
  Text,
  Divider,
  ActionButton,
  TableView,
  TableHeader,
  TableBody,
  Column,
  Row,
  Cell,
  Button,
  ButtonGroup,
  TextField,
  Switch,
  Dialog,
  DialogTrigger,
  Content,
  Header,
  Footer,
  Form,
  Picker,
  Item as PickerItem,
  ProgressCircle,
  Checkbox,
  Tooltip,
  TooltipTrigger,
  StatusLight,
  Icon,
  Breadcrumbs,
  Link,
  ComboBox,
  Item as ComboBoxItem
} from '@adobe/react-spectrum';
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  MoreIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon
} from './icons';

const BusinessRulesManager = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isDependencyDialogOpen, setIsDependencyDialogOpen] = useState(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRules, setSelectedRules] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: 'type', direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Demo mode state for brand-independent rules
  const [fieldRules, setFieldRules] = useState([
    {
      id: '1',
      name: 'brand-name-validation',
      type: 'string',
      description: 'Brand name validation with length constraints',
      isRequired: true,
      maxLength: 50,
      pattern: '^[A-Za-z0-9\\s\\-&]+$',
      defaultValue: '',
      validationMessage: 'Brand name must be between 2-50 characters and contain only letters, numbers, spaces, hyphens, and ampersands',
      appliedToBrands: ['Test Brand 1', 'Test Brand 2'],
      createdAt: '2024-01-15',
      createdBy: 'admin@agency.com'
    },
    {
      id: '2',
      name: 'contact-email-validation',
      type: 'email',
      description: 'Standard email validation for contact information',
      isRequired: true,
      maxLength: 255,
      pattern: '',
      defaultValue: '',
      validationMessage: 'Must be a valid email address',
      appliedToBrands: ['Test Brand 1'],
      createdAt: '2024-01-10',
      createdBy: 'admin@agency.com'
    },
    {
      id: '3',
      name: 'website-url-validation',
      type: 'url',
      description: 'Website URL validation with protocol requirement',
      isRequired: false,
      maxLength: 500,
      pattern: '^https?://.+',
      defaultValue: '',
      validationMessage: 'Must be a valid URL starting with http:// or https://',
      appliedToBrands: ['Test Brand 2'],
      createdAt: '2024-01-05',
      createdBy: 'admin@agency.com'
    }
  ]);

  const [assetRules, setAssetRules] = useState([
    {
      id: '1',
      name: 'logo-file-size',
      property: 'fileSize',
      value: '5MB',
      description: 'Maximum file size for brand logos',
      isRequired: true,
      validationMessage: 'Logo file size must not exceed 5MB',
      appliedToBrands: ['Test Brand 1', 'Test Brand 2'],
      createdAt: '2024-01-12',
      createdBy: 'admin@agency.com'
    },
    {
      id: '2',
      name: 'image-file-types',
      property: 'fileType',
      value: 'image/*',
      description: 'Allowed file types for brand assets',
      isRequired: true,
      validationMessage: 'Only image files are allowed (JPG, PNG, SVG)',
      appliedToBrands: ['Test Brand 1'],
      createdAt: '2024-01-08',
      createdBy: 'admin@agency.com'
    }
  ]);

  const [templates, setTemplates] = useState([
    {
      id: '1',
      name: 'Basic Brand Template',
      description: 'Standard validation rules for basic brand setup',
      rules: ['brand-name-validation', 'contact-email-validation'],
      appliedToBrands: ['Test Brand 1'],
      lastModified: '2024-01-15',
      createdBy: 'admin@agency.com'
    },
    {
      id: '2',
      name: 'Premium Brand Template',
      description: 'Enhanced validation with additional requirements',
      rules: ['brand-name-validation', 'contact-email-validation', 'website-url-validation', 'logo-file-size'],
      appliedToBrands: ['Test Brand 2'],
      lastModified: '2024-01-10',
      createdBy: 'admin@agency.com'
    }
  ]);

  const [dependencies, setDependencies] = useState([
    {
      id: '1',
      rule: 'website-url-validation',
      prerequisites: ['brand-name-validation'],
      description: 'Website URL requires brand name to be set first',
      isRequired: true,
      validationMessage: 'Brand name must be set before adding website',
      appliedToBrands: ['Test Brand 2'],
      createdAt: '2024-01-10',
      createdBy: 'admin@agency.com'
    }
  ]);

  // Mock brands for demo
  const [availableBrands] = useState([
    'Test Brand 1',
    'Test Brand 2',
    'Client Brand A',
    'Client Brand B',
    'Client Brand C'
  ]);

  // Demo mode - simulate loading
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  const renderFieldValidation = () => (
    <View>
      <Flex direction="column" gap="size-200" marginBottom="size-300">
        <Flex justifyContent="space-between" alignItems="center" wrap>
          <Heading level={2}>Field Validation Rules</Heading>
          <Flex gap="size-100" wrap>
            <TextField
              placeholder="Search rules..."
              value={searchQuery}
              onChange={handleSearch}
              width="size-3000"
              maxWidth="100%"
            />
            <Button
              variant="primary"
              onPress={() => setIsRuleDialogOpen(true)}
            >
              <Icon>
                <AddIcon />
              </Icon>
              <Text>Create Rule</Text>
            </Button>
          </Flex>
        </Flex>
      </Flex>

      <View overflow="auto" maxWidth="100%">
        <TableView
          aria-label="Field validation rules"
          selectionMode="multiple"
          selectedKeys={selectedRules}
          onSelectionChange={setSelectedRules}
          width="100%"
          maxWidth="100%"
        >
          <TableHeader>
            <Column key="name" width="size-2000" allowsSorting>Rule Name</Column>
            <Column key="type" width="size-1000" allowsSorting>Type</Column>
            <Column key="description" width="size-3000">Description</Column>
            <Column key="brands" width="size-2000">Applied To</Column>
            <Column key="required" width="size-1000">Required</Column>
            <Column key="actions" width="size-1200" align="center">Actions</Column>
          </TableHeader>
          <TableBody>
            {fieldRules
              .filter(rule => 
                rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                rule.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .sort((a, b) => {
                if (sortConfig.key === 'name') {
                  return sortConfig.direction === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
                }
                if (sortConfig.key === 'type') {
                  return sortConfig.direction === 'asc'
                    ? a.type.localeCompare(b.type)
                    : b.type.localeCompare(a.type);
                }
                return 0;
              })
              .map((rule) => (
                <Row key={rule.id}>
                  <Cell>
                    <Text>{rule.name}</Text>
                  </Cell>
                  <Cell>
                    <Text>{rule.type}</Text>
                  </Cell>
                  <Cell>
                    <Text>{rule.description}</Text>
                  </Cell>
                  <Cell>
                    <Flex gap="size-100" wrap>
                      {rule.appliedToBrands.slice(0, 2).map(brand => (
                        <View
                          key={brand}
                          backgroundColor="blue-100"
                          borderRadius="small"
                          paddingX="size-100"
                          paddingY="size-50"
                        >
                          <Text size="caption">{brand}</Text>
                        </View>
                      ))}
                      {rule.appliedToBrands.length > 2 && (
                        <View
                          backgroundColor="gray-100"
                          borderRadius="small"
                          paddingX="size-100"
                          paddingY="size-50"
                        >
                          <Text size="caption">+{rule.appliedToBrands.length - 2} more</Text>
                        </View>
                      )}
                    </Flex>
                  </Cell>
                  <Cell>
                    <StatusLight variant={rule.isRequired ? 'positive' : 'neutral'}>
                      {rule.isRequired ? 'Yes' : 'No'}
                    </StatusLight>
                  </Cell>
                  <Cell>
                    <Flex gap="size-100" justifyContent="center">
                      <TooltipTrigger>
                        <ActionButton isQuiet onPress={() => setIsApplyDialogOpen(true)}>
                          <Icon>
                            <AddIcon />
                          </Icon>
                        </ActionButton>
                        <Tooltip>Apply to Brands</Tooltip>
                      </TooltipTrigger>
                      <TooltipTrigger>
                        <ActionButton isQuiet>
                          <Icon>
                            <EditIcon />
                          </Icon>
                        </ActionButton>
                        <Tooltip>Edit</Tooltip>
                      </TooltipTrigger>
                      <TooltipTrigger>
                        <ActionButton isQuiet>
                          <Icon>
                            <DeleteIcon />
                          </Icon>
                        </ActionButton>
                        <Tooltip>Delete</Tooltip>
                      </TooltipTrigger>
                    </Flex>
                  </Cell>
                </Row>
              ))}
          </TableBody>
        </TableView>
      </View>
    </View>
  );

  const renderAssetValidation = () => (
    <View>
      <Flex direction="column" gap="size-200" marginBottom="size-300">
        <Flex justifyContent="space-between" alignItems="center" wrap>
          <Heading level={2}>Asset Validation Rules</Heading>
          <Flex gap="size-100" wrap>
            <TextField
              placeholder="Search rules..."
              value={searchQuery}
              onChange={handleSearch}
              width="size-3000"
              maxWidth="100%"
            />
            <Button
              variant="primary"
              onPress={() => setIsRuleDialogOpen(true)}
            >
              <Icon>
                <AddIcon />
              </Icon>
              <Text>Create Rule</Text>
            </Button>
          </Flex>
        </Flex>
      </Flex>

      <View overflow="auto" maxWidth="100%">
        <TableView
          aria-label="Asset validation rules"
          selectionMode="multiple"
          selectedKeys={selectedRules}
          onSelectionChange={setSelectedRules}
          width="100%"
          maxWidth="100%"
        >
          <TableHeader>
            <Column key="name" width="size-2000" allowsSorting>Rule Name</Column>
            <Column key="property" width="size-1200" allowsSorting>Property</Column>
            <Column key="value" width="size-1000">Value</Column>
            <Column key="description" width="size-3000">Description</Column>
            <Column key="brands" width="size-2000">Applied To</Column>
            <Column key="actions" width="size-1200" align="center">Actions</Column>
          </TableHeader>
          <TableBody>
            {assetRules
              .filter(rule => 
                rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                rule.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .sort((a, b) => {
                if (sortConfig.key === 'name') {
                  return sortConfig.direction === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
                }
                if (sortConfig.key === 'property') {
                  return sortConfig.direction === 'asc'
                    ? a.property.localeCompare(b.property)
                    : b.property.localeCompare(a.property);
                }
                return 0;
              })
              .map((rule) => (
                <Row key={rule.id}>
                  <Cell>
                    <Text>{rule.name}</Text>
                  </Cell>
                  <Cell>
                    <Text>{rule.property}</Text>
                  </Cell>
                  <Cell>
                    <Text>{rule.value}</Text>
                  </Cell>
                  <Cell>
                    <Text>{rule.description}</Text>
                  </Cell>
                  <Cell>
                    <Flex gap="size-100" wrap>
                      {rule.appliedToBrands.slice(0, 2).map(brand => (
                        <View
                          key={brand}
                          backgroundColor="blue-100"
                          borderRadius="small"
                          paddingX="size-100"
                          paddingY="size-50"
                        >
                          <Text size="caption">{brand}</Text>
                        </View>
                      ))}
                      {rule.appliedToBrands.length > 2 && (
                        <View
                          backgroundColor="gray-100"
                          borderRadius="small"
                          paddingX="size-100"
                          paddingY="size-50"
                        >
                          <Text size="caption">+{rule.appliedToBrands.length - 2} more</Text>
                        </View>
                      )}
                    </Flex>
                  </Cell>
                  <Cell>
                    <Flex gap="size-100" justifyContent="center">
                      <TooltipTrigger>
                        <ActionButton isQuiet onPress={() => setIsApplyDialogOpen(true)}>
                          <Icon>
                            <AddIcon />
                          </Icon>
                        </ActionButton>
                        <Tooltip>Apply to Brands</Tooltip>
                      </TooltipTrigger>
                      <TooltipTrigger>
                        <ActionButton isQuiet>
                          <Icon>
                            <EditIcon />
                          </Icon>
                        </ActionButton>
                        <Tooltip>Edit</Tooltip>
                      </TooltipTrigger>
                      <TooltipTrigger>
                        <ActionButton isQuiet>
                          <Icon>
                            <DeleteIcon />
                          </Icon>
                        </ActionButton>
                        <Tooltip>Delete</Tooltip>
                      </TooltipTrigger>
                    </Flex>
                  </Cell>
                </Row>
              ))}
          </TableBody>
        </TableView>
      </View>
    </View>
  );

  const renderTemplates = () => (
    <View>
      <Flex direction="column" gap="size-200" marginBottom="size-300">
        <Flex justifyContent="space-between" alignItems="center" wrap>
          <Heading level={2}>Rule Templates</Heading>
          <Flex gap="size-100" wrap>
            <TextField
              placeholder="Search templates..."
              value={searchQuery}
              onChange={handleSearch}
              width="size-3000"
              maxWidth="100%"
            />
            <Button
              variant="primary"
              onPress={() => setIsTemplateDialogOpen(true)}
            >
              <Icon>
                <AddIcon />
              </Icon>
              <Text>Create Template</Text>
            </Button>
          </Flex>
        </Flex>
      </Flex>

      <View overflow="auto" maxWidth="100%">
        <TableView
          aria-label="Rule templates"
          selectionMode="multiple"
          selectedKeys={selectedRules}
          onSelectionChange={setSelectedRules}
          width="100%"
          maxWidth="100%"
        >
          <TableHeader>
            <Column key="name" width="size-2000" allowsSorting>Template Name</Column>
            <Column key="description" width="size-3000">Description</Column>
            <Column key="rules" width="size-2000">Rules</Column>
            <Column key="brands" width="size-2000">Applied To</Column>
            <Column key="modified" width="size-1200">Last Modified</Column>
            <Column key="actions" width="size-1200" align="center">Actions</Column>
          </TableHeader>
          <TableBody>
            {templates
              .filter(template => 
                template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                template.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .sort((a, b) => {
                if (sortConfig.key === 'name') {
                  return sortConfig.direction === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
                }
                return 0;
              })
              .map((template) => (
                <Row key={template.id}>
                  <Cell>
                    <Text>{template.name}</Text>
                  </Cell>
                  <Cell>
                    <Text>{template.description}</Text>
                  </Cell>
                  <Cell>
                    <Text>{template.rules.join(', ')}</Text>
                  </Cell>
                  <Cell>
                    <Flex gap="size-100" wrap>
                      {template.appliedToBrands.slice(0, 2).map(brand => (
                        <View
                          key={brand}
                          backgroundColor="blue-100"
                          borderRadius="small"
                          paddingX="size-100"
                          paddingY="size-50"
                        >
                          <Text size="caption">{brand}</Text>
                        </View>
                      ))}
                      {template.appliedToBrands.length > 2 && (
                        <View
                          backgroundColor="gray-100"
                          borderRadius="small"
                          paddingX="size-100"
                          paddingY="size-50"
                        >
                          <Text size="caption">+{template.appliedToBrands.length - 2} more</Text>
                        </View>
                      )}
                    </Flex>
                  </Cell>
                  <Cell>
                    <Text>{template.lastModified}</Text>
                  </Cell>
                  <Cell>
                    <Flex gap="size-100" justifyContent="center">
                      <TooltipTrigger>
                        <ActionButton isQuiet onPress={() => setIsApplyDialogOpen(true)}>
                          <Icon>
                            <AddIcon />
                          </Icon>
                        </ActionButton>
                        <Tooltip>Apply to Brands</Tooltip>
                      </TooltipTrigger>
                      <TooltipTrigger>
                        <ActionButton isQuiet>
                          <Icon>
                            <EditIcon />
                          </Icon>
                        </ActionButton>
                        <Tooltip>Edit</Tooltip>
                      </TooltipTrigger>
                      <TooltipTrigger>
                        <ActionButton isQuiet>
                          <Icon>
                            <DeleteIcon />
                          </Icon>
                        </ActionButton>
                        <Tooltip>Delete</Tooltip>
                      </TooltipTrigger>
                    </Flex>
                  </Cell>
                </Row>
              ))}
          </TableBody>
        </TableView>
      </View>
    </View>
  );

  const renderDependencies = () => (
    <View>
      <Flex direction="column" gap="size-200" marginBottom="size-300">
        <Flex justifyContent="space-between" alignItems="center" wrap>
          <Heading level={2}>Rule Dependencies</Heading>
          <Flex gap="size-100" wrap>
            <TextField
              placeholder="Search dependencies..."
              value={searchQuery}
              onChange={handleSearch}
              width="size-3000"
              maxWidth="100%"
            />
            <Button
              variant="primary"
              onPress={() => setIsDependencyDialogOpen(true)}
            >
              <Icon>
                <AddIcon />
              </Icon>
              <Text>Create Dependency</Text>
            </Button>
          </Flex>
        </Flex>
      </Flex>

      <View overflow="auto" maxWidth="100%">
        <TableView
          aria-label="Rule dependencies"
          selectionMode="multiple"
          selectedKeys={selectedRules}
          onSelectionChange={setSelectedRules}
          width="100%"
          maxWidth="100%"
        >
          <TableHeader>
            <Column key="rule" width="size-2000" allowsSorting>Rule</Column>
            <Column key="prerequisites" width="size-2000">Prerequisites</Column>
            <Column key="description" width="size-3000">Description</Column>
            <Column key="brands" width="size-2000">Applied To</Column>
            <Column key="required" width="size-1000">Required</Column>
            <Column key="actions" width="size-1200" align="center">Actions</Column>
          </TableHeader>
          <TableBody>
            {dependencies
              .filter(dep => 
                dep.rule.toLowerCase().includes(searchQuery.toLowerCase()) ||
                dep.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .sort((a, b) => {
                if (sortConfig.key === 'rule') {
                  return sortConfig.direction === 'asc'
                    ? a.rule.localeCompare(b.rule)
                    : b.rule.localeCompare(a.rule);
                }
                return 0;
              })
              .map((dep) => (
                <Row key={dep.id}>
                  <Cell>
                    <Text>{dep.rule}</Text>
                  </Cell>
                  <Cell>
                    <Text>{dep.prerequisites.join(', ')}</Text>
                  </Cell>
                  <Cell>
                    <Text>{dep.description}</Text>
                  </Cell>
                  <Cell>
                    <Flex gap="size-100" wrap>
                      {dep.appliedToBrands.slice(0, 2).map(brand => (
                        <View
                          key={brand}
                          backgroundColor="blue-100"
                          borderRadius="small"
                          paddingX="size-100"
                          paddingY="size-50"
                        >
                          <Text size="caption">{brand}</Text>
                        </View>
                      ))}
                      {dep.appliedToBrands.length > 2 && (
                        <View
                          backgroundColor="gray-100"
                          borderRadius="small"
                          paddingX="size-100"
                          paddingY="size-50"
                        >
                          <Text size="caption">+{dep.appliedToBrands.length - 2} more</Text>
                        </View>
                      )}
                    </Flex>
                  </Cell>
                  <Cell>
                    <StatusLight variant={dep.isRequired ? 'positive' : 'neutral'}>
                      {dep.isRequired ? 'Yes' : 'No'}
                    </StatusLight>
                  </Cell>
                  <Cell>
                    <Flex gap="size-100" justifyContent="center">
                      <TooltipTrigger>
                        <ActionButton isQuiet onPress={() => setIsApplyDialogOpen(true)}>
                          <Icon>
                            <AddIcon />
                          </Icon>
                        </ActionButton>
                        <Tooltip>Apply to Brands</Tooltip>
                      </TooltipTrigger>
                      <TooltipTrigger>
                        <ActionButton isQuiet>
                          <Icon>
                            <EditIcon />
                          </Icon>
                        </ActionButton>
                        <Tooltip>Edit</Tooltip>
                      </TooltipTrigger>
                      <TooltipTrigger>
                        <ActionButton isQuiet>
                          <Icon>
                            <DeleteIcon />
                          </Icon>
                        </ActionButton>
                        <Tooltip>Delete</Tooltip>
                      </TooltipTrigger>
                    </Flex>
                  </Cell>
                </Row>
              ))}
          </TableBody>
        </TableView>
      </View>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <Flex justifyContent="center" alignItems="center" minHeight="size-2000">
          <ProgressCircle isIndeterminate />
        </Flex>
      );
    }

    if (error) {
      return (
        <View padding="size-200">
          <StatusLight variant="negative">{error}</StatusLight>
        </View>
      );
    }

    switch (activeTab) {
      case 0:
        return renderFieldValidation();
      case 1:
        return renderAssetValidation();
      case 2:
        return renderTemplates();
      case 3:
        return renderDependencies();
      default:
        return null;
    }
  };

  return (
    <View width="100%">
      {/* Breadcrumb Navigation */}
      <Flex alignItems="center" marginBottom="size-200">
        <Button
          variant="secondary"
          onPress={onBack}
          marginEnd="size-100"
        >
          <Icon>
            <ChevronLeftIcon />
          </Icon>
          <Text>Back to Brands</Text>
        </Button>
        <Divider orientation="vertical" size="S" />
        <Text>Agency Business Rules Manager</Text>
      </Flex>

      <Flex direction="column" gap="size-200">
        <ButtonGroup>
          <Button
            variant={activeTab === 0 ? 'primary' : 'secondary'}
            onPress={() => setActiveTab(0)}
          >
            Field Validation
          </Button>
          <Button
            variant={activeTab === 1 ? 'primary' : 'secondary'}
            onPress={() => setActiveTab(1)}
          >
            Asset Validation
          </Button>
          <Button
            variant={activeTab === 2 ? 'primary' : 'secondary'}
            onPress={() => setActiveTab(2)}
          >
            Templates
          </Button>
          <Button
            variant={activeTab === 3 ? 'primary' : 'secondary'}
            onPress={() => setActiveTab(3)}
          >
            Dependencies
          </Button>
        </ButtonGroup>
        {renderContent()}
      </Flex>

      {/* Create/Edit Rule Dialog */}
      <DialogTrigger isOpen={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <Button variant="primary" style={{ display: 'none' }}>
          Create Rule
        </Button>
        <Dialog>
          <Heading>Create New Rule</Heading>
          <Content>
            <Form>
              <TextField 
                label="Rule Name" 
                isRequired 
                description="Unique identifier for this validation rule"
              />
              <Picker 
                label="Rule Type" 
                isRequired
                description="Data type for validation"
              >
                <PickerItem key="string">string</PickerItem>
                <PickerItem key="number">number</PickerItem>
                <PickerItem key="date">date</PickerItem>
                <PickerItem key="email">email</PickerItem>
                <PickerItem key="url">url</PickerItem>
                <PickerItem key="phone">phone</PickerItem>
                <PickerItem key="color">color</PickerItem>
                <PickerItem key="currency">currency</PickerItem>
                <PickerItem key="percentage">percentage</PickerItem>
                <PickerItem key="password">password</PickerItem>
                <PickerItem key="json">json</PickerItem>
              </Picker>
              <TextField 
                label="Description" 
                description="Brief description of what this rule validates"
              />
              <TextField 
                label="Max Length" 
                type="number" 
                description="Maximum number of characters allowed"
              />
              <TextField 
                label="Pattern" 
                description="Regular expression pattern for validation (e.g., ^[A-Za-z]+$ for letters only)"
              />
              <Switch description="Whether this field is required for form submission">Required</Switch>
              <TextField 
                label="Default Value" 
                description="Default value to use when field is empty"
              />
              <TextField 
                label="Validation Message" 
                description="Error message shown when validation fails"
              />
              <ComboBox
                label="Apply to Brands"
                selectionMode="multiple"
                description="Select which brands this rule should apply to"
              >
                {availableBrands.map(brand => (
                  <ComboBoxItem key={brand}>{brand}</ComboBoxItem>
                ))}
              </ComboBox>
            </Form>
          </Content>
          <Footer>
            <ButtonGroup>
              <Button variant="secondary" onPress={() => setIsRuleDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary">
                Create Rule
              </Button>
            </ButtonGroup>
          </Footer>
        </Dialog>
      </DialogTrigger>

      {/* Create Template Dialog */}
      <DialogTrigger isOpen={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <Button variant="primary" style={{ display: 'none' }}>
          Create Template
        </Button>
        <Dialog>
          <Heading>Create Template</Heading>
          <Content>
            <Form>
              <TextField 
                label="Template Name" 
                isRequired 
                description="Name for this rule template"
              />
              <TextField 
                label="Description" 
                description="Description of what this template is used for"
              />
              <Picker 
                label="Rules" 
                selectionMode="multiple"
                description="Select validation rules to include in this template"
              >
                {fieldRules.map(rule => (
                  <PickerItem key={rule.name}>{rule.name}</PickerItem>
                ))}
              </Picker>
              <ComboBox
                label="Apply to Brands"
                selectionMode="multiple"
                description="Select which brands this template should apply to"
              >
                {availableBrands.map(brand => (
                  <ComboBoxItem key={brand}>{brand}</ComboBoxItem>
                ))}
              </ComboBox>
            </Form>
          </Content>
          <Footer>
            <ButtonGroup>
              <Button variant="secondary" onPress={() => setIsTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary">
                Create Template
              </Button>
            </ButtonGroup>
          </Footer>
        </Dialog>
      </DialogTrigger>

      {/* Create Dependency Dialog */}
      <DialogTrigger isOpen={isDependencyDialogOpen} onOpenChange={setIsDependencyDialogOpen}>
        <Button variant="primary" style={{ display: 'none' }}>
          Create Dependency
        </Button>
        <Dialog>
          <Heading>Create Dependency</Heading>
          <Content>
            <Form>
              <Picker 
                label="Rule with Dependencies" 
                isRequired
                description="Select the rule that requires other rules to be satisfied first"
              >
                {fieldRules.map(rule => (
                  <PickerItem key={rule.name}>{rule.name}</PickerItem>
                ))}
              </Picker>
              <Picker 
                label="Prerequisite Rules" 
                selectionMode="multiple"
                description="Select the rules that must be satisfied before the main rule can be applied"
              >
                {fieldRules.map(rule => (
                  <PickerItem key={rule.name}>{rule.name}</PickerItem>
                ))}
              </Picker>
              <TextField 
                label="Description" 
                description="Description of why this dependency exists"
              />
              <Switch description="Whether all prerequisite rules must be satisfied">Required</Switch>
              <TextField 
                label="Validation Message" 
                description="Error message shown when prerequisite rules are not met"
              />
              <ComboBox
                label="Apply to Brands"
                selectionMode="multiple"
                description="Select which brands this dependency should apply to"
              >
                {availableBrands.map(brand => (
                  <ComboBoxItem key={brand}>{brand}</ComboBoxItem>
                ))}
              </ComboBox>
            </Form>
          </Content>
          <Footer>
            <ButtonGroup>
              <Button variant="secondary" onPress={() => setIsDependencyDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary">
                Create Dependency
              </Button>
            </ButtonGroup>
          </Footer>
        </Dialog>
      </DialogTrigger>

      {/* Apply to Brands Dialog */}
      <DialogTrigger isOpen={isApplyDialogOpen} onOpenChange={setIsApplyDialogOpen}>
        <Button variant="primary" style={{ display: 'none' }}>
          Apply to Brands
        </Button>
        <Dialog>
          <Heading>Apply to Brands</Heading>
          <Content>
            <Form>
              <ComboBox
                label="Select Brands"
                selectionMode="multiple"
                description="Choose which brands to apply this rule/template to"
              >
                {availableBrands.map(brand => (
                  <ComboBoxItem key={brand}>{brand}</ComboBoxItem>
                ))}
              </ComboBox>
            </Form>
          </Content>
          <Footer>
            <ButtonGroup>
              <Button variant="secondary" onPress={() => setIsApplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary">
                Apply
              </Button>
            </ButtonGroup>
          </Footer>
        </Dialog>
      </DialogTrigger>
    </View>
  );
};

export default BusinessRulesManager; 