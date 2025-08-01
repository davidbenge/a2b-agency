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
  Link
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

const BrandBusinessRulesManager = ({ brand, onBack }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isDependencyDialogOpen, setIsDependencyDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRules, setSelectedRules] = useState(new Set());
  const [sortConfig, setSortConfig] = useState({ key: 'type', direction: 'asc' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Demo mode state for different types of rules - brand-specific
  const [fieldRules, setFieldRules] = useState([
    {
      id: '1',
      type: 'string',
      description: `${brand?.name || 'Brand'} name validation`,
      isRequired: true,
      validationMessage: 'Brand name must be between 2-50 characters'
    },
    {
      id: '2',
      type: 'email',
      description: `${brand?.name || 'Brand'} contact email validation`,
      isRequired: true,
      validationMessage: 'Must be a valid email address'
    },
    {
      id: '3',
      type: 'url',
      description: `${brand?.name || 'Brand'} website URL validation`,
      isRequired: false,
      validationMessage: 'Must be a valid URL starting with http:// or https://'
    },
    {
      id: '4',
      type: 'phone',
      description: `${brand?.name || 'Brand'} phone number validation`,
      isRequired: false,
      validationMessage: 'Must be a valid phone number format'
    }
  ]);

  const [assetRules, setAssetRules] = useState([
    {
      id: '1',
      property: 'fileSize',
      value: '5MB',
      description: `Maximum file size for ${brand?.name || 'brand'} logos`,
      isRequired: true,
      validationMessage: 'Logo file size must not exceed 5MB'
    },
    {
      id: '2',
      property: 'fileType',
      value: 'image/*',
      description: `Allowed file types for ${brand?.name || 'brand'} assets`,
      isRequired: true,
      validationMessage: 'Only image files are allowed (JPG, PNG, SVG)'
    },
    {
      id: '3',
      property: 'dimensions',
      value: '1920x1080',
      description: `Minimum image dimensions for ${brand?.name || 'brand'}`,
      isRequired: false,
      validationMessage: 'Images should be at least 1920x1080 pixels'
    }
  ]);

  const [templates, setTemplates] = useState([
    {
      id: '1',
      name: `${brand?.name || 'Brand'} Basic Template`,
      description: `Standard validation rules for ${brand?.name || 'brand'} creation`,
      rules: ['string', 'email', 'url'],
      lastModified: '2024-01-15',
      createdBy: 'admin@agency.com'
    },
    {
      id: '2',
      name: `${brand?.name || 'Brand'} Premium Template`,
      description: `Enhanced validation with additional requirements for ${brand?.name || 'brand'}`,
      rules: ['string', 'email', 'url', 'phone', 'color'],
      lastModified: '2024-01-10',
      createdBy: 'admin@agency.com'
    },
    {
      id: '3',
      name: `${brand?.name || 'Brand'} Asset Template`,
      description: `Rules for ${brand?.name || 'brand'} asset upload validation`,
      rules: ['fileSize', 'fileType', 'dimensions'],
      lastModified: '2024-01-05',
      createdBy: 'admin@agency.com'
    }
  ]);

  const [dependencies, setDependencies] = useState([
    {
      id: '1',
      rule: 'website',
      deps: ['brandName'],
      description: `${brand?.name || 'Brand'} website URL requires brand name to be set first`,
      isRequired: true,
      validationMessage: 'Brand name must be set before adding website'
    },
    {
      id: '2',
      rule: 'logo',
      deps: ['brandName', 'website'],
      description: `${brand?.name || 'Brand'} logo upload requires brand name and website`,
      isRequired: false,
      validationMessage: 'Brand name and website must be set before uploading logo'
    },
    {
      id: '3',
      rule: 'contactInfo',
      deps: ['email'],
      description: `${brand?.name || 'Brand'} contact information requires email validation`,
      isRequired: true,
      validationMessage: 'Valid email is required for contact information'
    }
  ]);

  // Demo mode - simulate loading
  useEffect(() => {
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [brand]);

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  const handleSelectRule = (ruleId) => {
    const newSelected = new Set(selectedRules);
    if (newSelected.has(ruleId)) {
      newSelected.delete(ruleId);
    } else {
      newSelected.add(ruleId);
    }
    setSelectedRules(newSelected);
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
              onPress={() => setIsDialogOpen(true)}
            >
              <Icon>
                <AddIcon />
              </Icon>
              <Text>Add Rule</Text>
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
            <Column key="type" width="size-1200" allowsSorting>Type</Column>
            <Column key="description" width="size-3000">Description</Column>
            <Column key="required" width="size-1000">Required</Column>
            <Column key="validation" width="size-3000">Validation Message</Column>
            <Column key="actions" width="size-1000" align="center">Actions</Column>
          </TableHeader>
          <TableBody>
            {fieldRules
              .filter(rule => 
                rule.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                rule.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .sort((a, b) => {
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
                    <Text>{rule.type}</Text>
                  </Cell>
                  <Cell>
                    <Text>{rule.description}</Text>
                  </Cell>
                  <Cell>
                    <StatusLight variant={rule.isRequired ? 'positive' : 'neutral'}>
                      {rule.isRequired ? 'Yes' : 'No'}
                    </StatusLight>
                  </Cell>
                  <Cell>
                    <Text>{rule.validationMessage}</Text>
                  </Cell>
                  <Cell>
                    <Flex gap="size-100" justifyContent="center">
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
              onPress={() => setIsDialogOpen(true)}
            >
              <Icon>
                <AddIcon />
              </Icon>
              <Text>Add Rule</Text>
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
            <Column key="property" width="size-1200" allowsSorting>Property</Column>
            <Column key="value" width="size-1000">Value</Column>
            <Column key="description" width="size-3000">Description</Column>
            <Column key="required" width="size-1000">Required</Column>
            <Column key="validation" width="size-3000">Validation Message</Column>
            <Column key="actions" width="size-1000" align="center">Actions</Column>
          </TableHeader>
          <TableBody>
            {assetRules
              .filter(rule => 
                rule.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
                rule.description.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .sort((a, b) => {
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
                    <Text>{rule.property}</Text>
                  </Cell>
                  <Cell>
                    <Text>{rule.value}</Text>
                  </Cell>
                  <Cell>
                    <Text>{rule.description}</Text>
                  </Cell>
                  <Cell>
                    <StatusLight variant={rule.isRequired ? 'positive' : 'neutral'}>
                      {rule.isRequired ? 'Yes' : 'No'}
                    </StatusLight>
                  </Cell>
                  <Cell>
                    <Text>{rule.validationMessage}</Text>
                  </Cell>
                  <Cell>
                    <Flex gap="size-100" justifyContent="center">
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
              <Text>Add Template</Text>
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
            <Column key="name" width="size-2000" allowsSorting>Name</Column>
            <Column key="description" width="size-3000">Description</Column>
            <Column key="rules" width="size-2000">Rules</Column>
            <Column key="modified" width="size-1200">Last Modified</Column>
            <Column key="createdBy" width="size-1500">Created By</Column>
            <Column key="actions" width="size-1000" align="center">Actions</Column>
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
                    <Text>{template.lastModified}</Text>
                  </Cell>
                  <Cell>
                    <Text>{template.createdBy}</Text>
                  </Cell>
                  <Cell>
                    <Flex gap="size-100" justifyContent="center">
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
              <Text>Add Dependency</Text>
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
            <Column key="rule" width="size-1200" allowsSorting>Rule</Column>
            <Column key="dependencies" width="size-2000">Dependencies</Column>
            <Column key="description" width="size-3000">Description</Column>
            <Column key="required" width="size-1000">Required</Column>
            <Column key="validation" width="size-3000">Validation Message</Column>
            <Column key="actions" width="size-1000" align="center">Actions</Column>
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
                    <Text>{dep.deps.join(', ')}</Text>
                  </Cell>
                  <Cell>
                    <Text>{dep.description}</Text>
                  </Cell>
                  <Cell>
                    <StatusLight variant={dep.isRequired ? 'positive' : 'neutral'}>
                      {dep.isRequired ? 'Yes' : 'No'}
                    </StatusLight>
                  </Cell>
                  <Cell>
                    <Text>{dep.validationMessage}</Text>
                  </Cell>
                  <Cell>
                    <Flex gap="size-100" justifyContent="center">
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
        <Text>Business Rules for {brand?.name || 'Brand'}</Text>
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

      {/* Add/Edit Rule Dialog */}
      <DialogTrigger isOpen={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Button variant="primary" style={{ display: 'none' }}>
          Add Rule
        </Button>
        <Dialog>
          <Heading>Add New Rule</Heading>
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
            </Form>
          </Content>
          <Footer>
            <ButtonGroup>
              <Button variant="secondary" onPress={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary">
                Save
              </Button>
            </ButtonGroup>
          </Footer>
        </Dialog>
      </DialogTrigger>

      {/* Add Template Dialog */}
      <DialogTrigger isOpen={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <Button variant="primary" style={{ display: 'none' }}>
          Add Template
        </Button>
        <Dialog>
          <Heading>Add Template</Heading>
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
                  <PickerItem key={rule.type}>{rule.type}</PickerItem>
                ))}
              </Picker>
            </Form>
          </Content>
          <Footer>
            <ButtonGroup>
              <Button variant="secondary" onPress={() => setIsTemplateDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary">
                Add
              </Button>
            </ButtonGroup>
          </Footer>
        </Dialog>
      </DialogTrigger>

      {/* Add Dependency Dialog */}
      <DialogTrigger isOpen={isDependencyDialogOpen} onOpenChange={setIsDependencyDialogOpen}>
        <Button variant="primary" style={{ display: 'none' }}>
          Add Dependency
        </Button>
        <Dialog>
          <Heading>Add Dependency</Heading>
          <Content>
            <Form>
              <Picker 
                label="Rule with Dependencies" 
                isRequired
                description="Select the rule that requires other rules to be satisfied first"
              >
                {fieldRules.map(rule => (
                  <PickerItem key={rule.type}>{rule.type}</PickerItem>
                ))}
              </Picker>
              <Picker 
                label="Prerequisite Rules" 
                selectionMode="multiple"
                description="Select the rules that must be satisfied before the main rule can be applied"
              >
                {fieldRules.map(rule => (
                  <PickerItem key={rule.type}>{rule.type}</PickerItem>
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
            </Form>
          </Content>
          <Footer>
            <ButtonGroup>
              <Button variant="secondary" onPress={() => setIsDependencyDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary">
                Add
              </Button>
            </ButtonGroup>
          </Footer>
        </Dialog>
      </DialogTrigger>
    </View>
  );
};

export default BrandBusinessRulesManager; 