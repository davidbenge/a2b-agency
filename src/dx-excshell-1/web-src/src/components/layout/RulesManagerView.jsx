import React, { useState } from 'react';
import {
  View,
  Flex,
  Heading,
  Button,
  TableView,
  TableHeader,
  Column,
  TableBody,
  Row,
  Cell,
  DialogTrigger,
  Dialog,
  ButtonGroup,
  TextField,
  TextArea,
  ComboBox,
  Item,
  Switch,
  Divider,
  Text,
  ActionButton,
  Content,
  StatusLight,
  SearchField
} from '@adobe/react-spectrum';
import Add from '@spectrum-icons/workflow/Add';
import Edit from '@spectrum-icons/workflow/Edit';
import Delete from '@spectrum-icons/workflow/Delete';

const RulesManagerView = ({ viewProps }) => {
  // Demo mode state for business rules only
  const [rules, setRules] = useState([
    {
      id: 1,
      name: 'Email Format Validation',
      type: 'field_validation',
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      message: 'Please enter a valid email address',
      isActive: true,
      appliedToBrands: ['Brand A', 'Brand C']
    },
    {
      id: 2,
      name: 'Phone Number Format',
      type: 'field_validation',
      pattern: '^\\+?[1-9]\\d{1,14}$',
      message: 'Please enter a valid phone number',
      isActive: true,
      appliedToBrands: ['Brand A', 'Brand B']
    },
    {
      id: 3,
      name: 'Image Size Check',
      type: 'asset_validation',
      pattern: 'max_size:5MB',
      message: 'Image must be under 5MB',
      isActive: false,
      appliedToBrands: ['Brand B']
    },
    {
      id: 4,
      name: 'Required Field Check',
      type: 'field_validation',
      pattern: 'required',
      message: 'This field is required',
      isActive: true,
      appliedToBrands: ['Brand A', 'Brand B', 'Brand C']
    }
  ]);

  const [brands] = useState(['Brand A', 'Brand B', 'Brand C', 'Brand D']);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state for Add Rule dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    type: '',
    pattern: '',
    message: '',
    appliedToBrands: [],
    isActive: true
  });

  // CRUD operations for rules
  const addRule = (rule) => {
    const newRuleWithId = { ...rule, id: Date.now() };
    setRules([...rules, newRuleWithId]);
  };

  const updateRule = (id, updatedRule) => {
    setRules(rules.map(rule => rule.id === id ? { ...rule, ...updatedRule } : rule));
  };

  const deleteRule = (id) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  // Form handlers
  const handleAddRule = () => {
    if (newRule.name && newRule.type && newRule.pattern && newRule.message) {
      addRule(newRule);
      setNewRule({
        name: '',
        type: '',
        pattern: '',
        message: '',
        appliedToBrands: [],
        isActive: true
      });
      setIsAddDialogOpen(false);
    }
  };

  const handleCancelAdd = () => {
    setNewRule({
      name: '',
      type: '',
      pattern: '',
      message: '',
      appliedToBrands: [],
      isActive: true
    });
    setIsAddDialogOpen(false);
  };

  const handleInputChange = (field, value) => {
    setNewRule(prev => ({ ...prev, [field]: value }));
  };

  // Filter rules based on search query
  const getFilteredRules = () => {
    if (!searchQuery.trim()) return rules;
    
    const query = searchQuery.toLowerCase();
    return rules.filter(rule =>
      rule.name.toLowerCase().includes(query) ||
      rule.type.toLowerCase().includes(query) ||
      rule.message.toLowerCase().includes(query)
    );
  };

  const handleDeleteRule = (ruleId) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      deleteRule(ruleId);
    }
  };

  return (
    <View padding="size-200" width="100%" overflow="hidden">
      <Flex direction="column" gap="size-300" width="100%">
        <Flex direction="column" gap="size-100">
          <Heading level={1}>Business Rules Manager</Heading>
          <Text>Create and manage reusable business rules for your client brands</Text>
        </Flex>

        {/* Search and Add Controls */}
        <Flex justifyContent="space-between" alignItems="end" gap="size-200" width="100%">
          <SearchField
            label="Search rules"
            placeholder="Search by name, type, or message..."
            value={searchQuery}
            onChange={setSearchQuery}
            width="size-3000"
          />
          <DialogTrigger isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <ActionButton>
              <Add />
              <Text>Add Rule</Text>
            </ActionButton>
            <Dialog>
              <Heading>Add Business Rule</Heading>
              <Divider />
              <Content>
                <Flex direction="column" gap="size-200">
                  <TextField
                    label="Rule Name"
                    placeholder="Enter rule name"
                    value={newRule.name}
                    onChange={(value) => handleInputChange('name', value)}
                    isRequired
                  />
                  <ComboBox 
                    label="Rule Type" 
                    selectedKey={newRule.type}
                    onSelectionChange={(value) => handleInputChange('type', value)}
                    isRequired
                  >
                    <Item key="field_validation">Field Validation</Item>
                    <Item key="asset_validation">Asset Validation</Item>
                  </ComboBox>
                  <TextArea
                    label="Pattern"
                    placeholder="Enter validation pattern (regex or rule)"
                    value={newRule.pattern}
                    onChange={(value) => handleInputChange('pattern', value)}
                    isRequired
                    description="Regular expression or validation rule pattern"
                  />
                  <TextArea
                    label="Error Message"
                    placeholder="Message to display when validation fails"
                    value={newRule.message}
                    onChange={(value) => handleInputChange('message', value)}
                    isRequired
                  />
                  <ComboBox 
                    label="Applied to Brands" 
                    selectionMode="multiple"
                    selectedKeys={newRule.appliedToBrands}
                    onSelectionChange={(value) => handleInputChange('appliedToBrands', Array.from(value))}
                  >
                    {brands.map(brand => (
                      <Item key={brand}>{brand}</Item>
                    ))}
                  </ComboBox>
                  <Switch 
                    isSelected={newRule.isActive}
                    onChange={(value) => handleInputChange('isActive', value)}
                  >
                    Active
                  </Switch>
                </Flex>
              </Content>
              <ButtonGroup>
                <Button variant="secondary" onPress={handleCancelAdd}>Cancel</Button>
                <Button 
                  variant="cta" 
                  onPress={handleAddRule}
                  isDisabled={!newRule.name || !newRule.type || !newRule.pattern || !newRule.message}
                >
                  Add Rule
                </Button>
              </ButtonGroup>
            </Dialog>
          </DialogTrigger>
        </Flex>

        {/* Rules Table */}
        <View width="100%" overflow="auto" UNSAFE_style={{ maxWidth: '100%' }}>
          <TableView
            aria-label="Business rules table"
            selectionMode="single"
            width="100%"
            overflowMode="wrap"
            UNSAFE_style={{ minWidth: '800px', maxWidth: '100%' }}
          >
            <TableHeader>
              <Column key="name" width={200}>Name</Column>
              <Column key="type" width={120}>Type</Column>
              <Column key="pattern" width={200}>Pattern</Column>
              <Column key="message" width={200}>Message</Column>
              <Column key="status" width={80}>Active</Column>
              <Column key="actions" width={100}>Actions</Column>
            </TableHeader>
            <TableBody items={getFilteredRules()}>
              {(item) => (
                <Row key={item.id}>
                  <Cell>
                    <Text fontWeight="semibold" UNSAFE_style={{ fontSize: '12px' }}>{item.name}</Text>
                  </Cell>
                  <Cell>
                    <StatusLight variant="info" UNSAFE_style={{ fontSize: '10px' }}>
                      {item.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </StatusLight>
                  </Cell>
                  <Cell>
                    <Text UNSAFE_style={{ fontFamily: 'monospace', fontSize: '9px', wordBreak: 'break-all' }}>
                      {item.pattern.length > 20 ? item.pattern.substring(0, 20) + '...' : item.pattern}
                    </Text>
                  </Cell>
                  <Cell>
                    <Text UNSAFE_style={{ fontSize: '10px', wordBreak: 'break-word' }}>
                      {item.message.length > 25 ? item.message.substring(0, 25) + '...' : item.message}
                    </Text>
                  </Cell>
                  <Cell>
                    <Switch isSelected={item.isActive} isReadOnly size="S" />
                  </Cell>
                  <Cell>
                    <Flex gap="size-100">
                      <ActionButton size="S" onPress={() => console.log('Edit rule:', item.id)}>
                        <Edit />
                      </ActionButton>
                      <ActionButton 
                        size="S" 
                        onPress={() => handleDeleteRule(item.id)}
                        UNSAFE_style={{ color: 'var(--spectrum-semantic-negative-color)' }}
                      >
                        <Delete />
                      </ActionButton>
                    </Flex>
                  </Cell>
                </Row>
              )}
            </TableBody>
          </TableView>
        </View>

        {/* Summary */}
        <Flex justifyContent="space-between" alignItems="center" width="100%">
          <Text>
            Showing {getFilteredRules().length} of {rules.length} rules
          </Text>
          <Text>
            {rules.filter(rule => rule.isActive).length} active rules
          </Text>
        </Flex>
      </Flex>
    </View>
  );
};

export default RulesManagerView; 