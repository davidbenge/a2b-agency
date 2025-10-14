
/**
 * Rules Configuration View
 * 
 * A demo mode enabled component for testing rules configuration UI.
 * Provides a simple interface for creating, editing, and managing event routing rules.
 */

import React, { useState } from 'react';
import {
    View,
    Heading,
    Text,
    Button,
    ButtonGroup,
    Flex,
    TableView,
    TableHeader,
    TableBody,
    Column,
    Row,
    Cell,
    TextField,
    ComboBox,
    Switch,
    NumberField,
    TextArea,
    ActionGroup,
    Item,
    Divider,
    StatusLight,
    SearchField
} from '@adobe/react-spectrum';
import { ViewPropsBase } from '../../types/ViewPropsBase';

interface Rule {
    id: string;
    name: string;
    description: string;
    eventType: string;
    direction: 'inbound' | 'outbound' | 'both';
    targetBrands: string[];
    conditions: RuleCondition[];
    actions: RuleAction[];
    enabled: boolean;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}

interface RuleCondition {
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'exists' | 'notExists';
    value: string;
    logicalOperator?: 'AND' | 'OR';
}

interface RuleAction {
    type: 'route' | 'transform' | 'filter' | 'log';
    target?: string;
    parameters?: Record<string, any>;
}

interface EventType {
    type: string;
    displayName: string;
    category: 'aem' | 'workfront' | 'brand' | 'custom';
    description: string;
    handler: string;
    requiredFields: string[];
    optionalFields: string[];
}

interface Brand {
    id: string;
    name: string;
    description: string;
}

// Mock data for demo mode
const mockEventTypes: EventType[] = [
    {
        type: 'aem.assets.asset.created',
        displayName: 'AEM Asset Created',
        category: 'aem',
        description: 'Triggered when a new asset is created in AEM',
        handler: 'agency-assetsync-internal-handler',
        requiredFields: ['assetId', 'assetPath', 'assetName'],
        optionalFields: ['metadata', 'renditions']
    },
    {
        type: 'aem.assets.asset.updated',
        displayName: 'AEM Asset Updated',
        category: 'aem',
        description: 'Triggered when an existing asset is modified in AEM',
        handler: 'agency-assetsync-internal-handler',
        requiredFields: ['assetId', 'assetPath', 'assetName'],
        optionalFields: ['metadata', 'renditions', 'changes']
    },
    {
        type: 'aem.assets.asset.deleted',
        displayName: 'AEM Asset Deleted',
        category: 'aem',
        description: 'Triggered when an asset is deleted from AEM',
        handler: 'agency-assetsync-internal-handler',
        requiredFields: ['assetId', 'assetPath'],
        optionalFields: ['metadata']
    },
    {
        type: 'workfront.task.created',
        displayName: 'Workfront Task Created',
        category: 'workfront',
        description: 'Triggered when a new task is created in Workfront',
        handler: 'workfront-event-handler',
        requiredFields: ['taskId', 'taskName', 'projectId'],
        optionalFields: ['assignee', 'dueDate', 'priority']
    },
    {
        type: 'workfront.task.updated',
        displayName: 'Workfront Task Updated',
        category: 'workfront',
        description: 'Triggered when a task is updated in Workfront',
        handler: 'workfront-event-handler',
        requiredFields: ['taskId', 'taskName', 'projectId'],
        optionalFields: ['assignee', 'dueDate', 'priority', 'status']
    },
    {
        type: 'workfront.task.completed',
        displayName: 'Workfront Task Completed',
        category: 'workfront',
        description: 'Triggered when a task is marked as completed in Workfront',
        handler: 'workfront-event-handler',
        requiredFields: ['taskId', 'taskName', 'projectId'],
        optionalFields: ['assignee', 'completionDate', 'notes']
    },
    {
        type: 'com.adobe.b2a.brand.registered',
        displayName: 'Brand Registration',
        category: 'brand',
        description: 'Triggered when a new brand is registered in the system',
        handler: 'new-brand-registration',
        requiredFields: ['brandId', 'brandName', 'endpointUrl'],
        optionalFields: ['secret', 'logo', 'metadata']
    },
    {
        type: 'com.adobe.b2a.assetsync.new',
        displayName: 'Asset Sync - New',
        category: 'custom',
        description: 'Triggered when a new asset sync event is processed',
        handler: 'brand-event-handler',
        requiredFields: ['assetId', 'brandId', 'syncType'],
        optionalFields: ['metadata', 'timestamp']
    },
    {
        type: 'com.adobe.b2a.assetsync.updated',
        displayName: 'Asset Sync - Updated',
        category: 'custom',
        description: 'Triggered when an asset sync event is updated',
        handler: 'brand-event-handler',
        requiredFields: ['assetId', 'brandId', 'syncType'],
        optionalFields: ['metadata', 'timestamp', 'changes']
    },
    {
        type: 'com.adobe.b2a.assetsync.deleted',
        displayName: 'Asset Sync - Deleted',
        category: 'custom',
        description: 'Triggered when an asset sync event is deleted',
        handler: 'brand-event-handler',
        requiredFields: ['assetId', 'brandId'],
        optionalFields: ['metadata', 'timestamp']
    }
];

// Mock brands for demo mode
const mockBrands: Brand[] = [
    {
        id: 'brand-1',
        name: 'Acme Corporation',
        description: 'Leading technology company'
    },
    {
        id: 'brand-2',
        name: 'Global Marketing Co',
        description: 'International marketing agency'
    },
    {
        id: 'brand-3',
        name: 'Creative Studio',
        description: 'Design and creative services'
    },
    {
        id: 'brand-4',
        name: 'Enterprise Solutions',
        description: 'Enterprise software solutions'
    }
];

const mockRules: Rule[] = [
    {
        id: 'rule-1',
        name: 'AEM Asset Sync Rule',
        description: 'Route AEM asset creation events to brand sync handler',
        eventType: 'aem.assets.asset.created',
        direction: 'inbound',
        targetBrands: ['brand-1', 'brand-2'],
        conditions: [
            {
                field: 'metadata.a2b__sync_on_change',
                operator: 'equals',
                value: 'true'
            }
        ],
        actions: [
            {
                type: 'route',
                target: 'agency-assetsync-internal-handler'
            }
        ],
        enabled: true,
        priority: 10,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
    },
    {
        id: 'rule-2',
        name: 'Workfront Task Priority Rule',
        description: 'Route high priority Workfront tasks to special handler',
        eventType: 'workfront.task.created',
        direction: 'outbound',
        targetBrands: ['brand-3'],
        conditions: [
            {
                field: 'priority',
                operator: 'equals',
                value: 'high'
            }
        ],
        actions: [
            {
                type: 'route',
                target: 'workfront-priority-handler'
            }
        ],
        enabled: false,
        priority: 5,
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16')
    },
    {
        id: 'rule-3',
        name: 'Brand Registration Global Rule',
        description: 'Handle brand registration events for all brands',
        eventType: 'com.adobe.b2a.brand.registered',
        direction: 'both',
        targetBrands: [], // Empty means applies to all brands
        conditions: [],
        actions: [
            {
                type: 'route',
                target: 'new-brand-registration'
            }
        ],
        enabled: true,
        priority: 1,
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-17')
    },
    {
        id: 'rule-4',
        name: 'Asset Sync New Events',
        description: 'Route new asset sync events to brand handlers',
        eventType: 'com.adobe.b2a.assetsync.new',
        direction: 'outbound',
        targetBrands: ['brand-1', 'brand-4'],
        conditions: [
            {
                field: 'syncType',
                operator: 'equals',
                value: 'immediate'
            }
        ],
        actions: [
            {
                type: 'route',
                target: 'brand-event-handler'
            }
        ],
        enabled: true,
        priority: 15,
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18')
    },
    {
        id: 'rule-5',
        name: 'Workfront Task Completion',
        description: 'Handle completed Workfront tasks',
        eventType: 'workfront.task.completed',
        direction: 'inbound',
        targetBrands: ['brand-2', 'brand-3'],
        conditions: [
            {
                field: 'priority',
                operator: 'equals',
                value: 'high'
            }
        ],
        actions: [
            {
                type: 'route',
                target: 'workfront-event-handler'
            },
            {
                type: 'log',
                parameters: {
                    message: 'High priority task completed'
                }
            }
        ],
        enabled: true,
        priority: 20,
        createdAt: new Date('2024-01-19'),
        updatedAt: new Date('2024-01-19')
    }
];

const RulesConfigurationView: React.FC<{ viewProps: ViewPropsBase }> = ({ viewProps }) => {
    const [rules, setRules] = useState<Rule[]>(viewProps.aioEnableDemoMode ? mockRules : []);
    const [eventTypes] = useState<EventType[]>(viewProps.aioEnableDemoMode ? mockEventTypes : []);
    const [brands] = useState<Brand[]>(viewProps.aioEnableDemoMode ? mockBrands : []);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterDirection, setFilterDirection] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Form state for creating/editing rules
    const [formData, setFormData] = useState<Partial<Rule>>({
        name: '',
        description: '',
        eventType: '',
        direction: 'both',
        targetBrands: [],
        conditions: [],
        actions: [],
        enabled: true,
        priority: 10
    });
    
    // Category filter for event types in form
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Safe access to viewProps
    const safeViewProps = viewProps || {} as any;
    const isDemoMode = safeViewProps.aioEnableDemoMode;

    // Filter rules based on search, category, and direction
    const filteredRules = rules.filter(rule => {
        const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            rule.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || 
                               eventTypes.find(et => et.type === rule.eventType)?.category === filterCategory;
        const matchesDirection = filterDirection === 'all' || rule.direction === filterDirection;
        return matchesSearch && matchesCategory && matchesDirection;
    });

    const handleCreateRule = () => {
        if (!formData.name || !formData.eventType) {
            alert('Please fill in required fields');
            return;
        }

        const newRule: Rule = {
            id: `rule-${Date.now()}`,
            name: formData.name!,
            description: formData.description || '',
            eventType: formData.eventType!,
            direction: formData.direction || 'both',
            targetBrands: formData.targetBrands || [],
            conditions: formData.conditions || [],
            actions: formData.actions || [],
            enabled: formData.enabled || true,
            priority: formData.priority || 10,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        setRules(prev => [...prev, newRule]);
        setShowCreateForm(false);
        setFormData({
            name: '',
            description: '',
            eventType: '',
            direction: 'both',
            targetBrands: [],
            conditions: [],
            actions: [],
            enabled: true,
            priority: 10
        });
        setSelectedCategory('all');
    };

    const handleEditRule = () => {
        if (!editingRule || !formData.name || !formData.eventType) {
            alert('Please fill in required fields');
            return;
        }

        const updatedRule: Rule = {
            ...editingRule,
            name: formData.name!,
            description: formData.description || '',
            eventType: formData.eventType!,
            direction: formData.direction || 'both',
            targetBrands: formData.targetBrands || [],
            conditions: formData.conditions || [],
            actions: formData.actions || [],
            enabled: formData.enabled || true,
            priority: formData.priority || 10,
            updatedAt: new Date()
        };

        setRules(prev => prev.map(rule => rule.id === editingRule.id ? updatedRule : rule));
        setEditingRule(null);
    };

    const handleDeleteRule = (ruleId: string) => {
        if (confirm('Are you sure you want to delete this rule?')) {
            setRules(prev => prev.filter(rule => rule.id !== ruleId));
        }
    };

    const openEditForm = (rule: Rule) => {
        setEditingRule(rule);
        setFormData({
            name: rule.name,
            description: rule.description,
            eventType: rule.eventType,
            direction: rule.direction,
            targetBrands: rule.targetBrands,
            conditions: rule.conditions,
            actions: rule.actions,
            enabled: rule.enabled,
            priority: rule.priority
        });
        
        // Set category filter based on the rule's event type
        const eventTypeObj = eventTypes.find(et => et.type === rule.eventType);
        setSelectedCategory(eventTypeObj?.category || 'all');
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'aem': return 'positive';
            case 'workfront': return 'notice';
            case 'brand': return 'info';
            default: return 'neutral';
        }
    };

    const getEventTypeDisplayName = (eventType: string) => {
        const eventTypeObj = eventTypes.find(et => et.type === eventType);
        return eventTypeObj?.displayName || eventType;
    };

    // Filter event types by selected category
    const getFilteredEventTypes = () => {
        if (selectedCategory === 'all') {
            return eventTypes;
        }
        return eventTypes.filter(et => et.category === selectedCategory);
    };

    // Handle category change - clear event type if it's not in the new category
    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        
        // If current event type is not in the new category, clear it
        if (formData.eventType) {
            const currentEventType = eventTypes.find(et => et.type === formData.eventType);
            if (currentEventType && currentEventType.category !== category && category !== 'all') {
                setFormData(prev => ({ ...prev, eventType: '' }));
            }
        }
    };

    if (!isDemoMode) {
        return (
            <View padding="size-400">
                <Heading level={1}>Rules Configuration</Heading>
                <Text>Rules configuration is only available in demo mode.</Text>
            </View>
        );
    }

    return (
        <View padding="size-400">
            <Heading level={1}>Rules Configuration</Heading>
            <Text>Configure event routing rules for your application</Text>

            <Divider marginY="size-300" />

            {/* Controls */}
            <Flex direction="column" gap="size-200" marginBottom="size-300">
                <Flex direction="row" gap="size-200" alignItems="center" wrap>
                    <ButtonGroup>
                        <Button variant="primary" onPress={() => setShowCreateForm(true)}>
                            Create Rule
                        </Button>
                    </ButtonGroup>
                    
                    <Flex direction="row" gap="size-200" alignItems="center">
                        <SearchField
                            label="Search"
                            placeholder="Search rules..."
                            value={searchQuery}
                            onChange={setSearchQuery}
                            width="size-3000"
                        />
                        
                        <ComboBox
                            label="Category"
                            selectedKey={filterCategory}
                            onSelectionChange={(key) => setFilterCategory(key as string)}
                            width="size-2000"
                        >
                            <Item key="all">All Categories</Item>
                            <Item key="aem">AEM</Item>
                            <Item key="workfront">Workfront</Item>
                            <Item key="brand">Brand</Item>
                        </ComboBox>
                        
                        <ComboBox
                            label="Direction"
                            selectedKey={filterDirection}
                            onSelectionChange={(key) => setFilterDirection(key as string)}
                            width="size-2000"
                        >
                            <Item key="all">All Directions</Item>
                            <Item key="inbound">Inbound</Item>
                            <Item key="outbound">Outbound</Item>
                            <Item key="both">Both</Item>
                        </ComboBox>
                    </Flex>
                </Flex>
            </Flex>

            {/* Create/Edit Form */}
            {(showCreateForm || editingRule) && (
                <View 
                    backgroundColor="gray-100" 
                    padding="size-300" 
                    borderRadius="medium" 
                    marginBottom="size-300"
                >
                    <Heading level={3}>
                        {editingRule ? 'Edit Rule' : 'Create New Rule'}
                    </Heading>
                    
                    <Flex direction="column" gap="size-200" marginTop="size-200">
                        <TextField
                            label="Rule Name"
                            value={formData.name || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                            isRequired
                            width="size-4000"
                        />
                        
                        <TextArea
                            label="Description"
                            value={formData.description || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                            width="size-4000"
                        />
                        
                        <ComboBox
                            label="Category"
                            selectedKey={selectedCategory}
                            onSelectionChange={(key) => handleCategoryChange(key as string)}
                            width="size-2000"
                        >
                            <Item key="all">All Categories</Item>
                            <Item key="aem">AEM</Item>
                            <Item key="workfront">Workfront</Item>
                            <Item key="brand">Brand</Item>
                            <Item key="custom">Custom</Item>
                        </ComboBox>
                        
                        <View>
                            <ComboBox
                                label="Event Type"
                                selectedKey={formData.eventType || ''}
                                onSelectionChange={(value) => setFormData(prev => ({ ...prev, eventType: value as string }))}
                                isRequired
                                width="size-4000"
                            >
                                {getFilteredEventTypes().map(eventType => (
                                    <Item key={eventType.type}>
                                        {eventType.displayName}
                                    </Item>
                                ))}
                            </ComboBox>
                            <Text>
                                {getFilteredEventTypes().length} event type{getFilteredEventTypes().length !== 1 ? 's' : ''} available
                                {selectedCategory !== 'all' && ` in ${selectedCategory.toUpperCase()} category`}
                            </Text>
                        </View>
                        
                        <ComboBox
                            label="Direction"
                            selectedKey={formData.direction || 'both'}
                            onSelectionChange={(value) => setFormData(prev => ({ ...prev, direction: value as 'inbound' | 'outbound' | 'both' }))}
                            isRequired
                            width="size-2000"
                        >
                            <Item key="inbound">Inbound</Item>
                            <Item key="outbound">Outbound</Item>
                            <Item key="both">Both</Item>
                        </ComboBox>
                        
                        <View>
                            <Text>Target Brands:</Text>
                            <Flex direction="column" gap="size-100" marginTop="size-100">
                                {brands.map(brand => (
                                    <Switch
                                        key={brand.id}
                                        isSelected={formData.targetBrands?.includes(brand.id) || false}
                                        onChange={(isSelected) => {
                                            const currentBrands = formData.targetBrands || [];
                                            if (isSelected) {
                                                setFormData(prev => ({ 
                                                    ...prev, 
                                                    targetBrands: [...currentBrands, brand.id] 
                                                }));
                                            } else {
                                                setFormData(prev => ({ 
                                                    ...prev, 
                                                    targetBrands: currentBrands.filter(id => id !== brand.id) 
                                                }));
                                            }
                                        }}
                                    >
                                        {brand.name} - {brand.description}
                                    </Switch>
                                ))}
                                <Text>Leave all unchecked for global rule (applies to all brands)</Text>
                            </Flex>
                        </View>
                        
                        <NumberField
                            label="Priority"
                            value={formData.priority || 10}
                            onChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                            minValue={1}
                            maxValue={100}
                            width="size-1000"
                        />
                        
                        <Switch
                            isSelected={formData.enabled || true}
                            onChange={(value) => setFormData(prev => ({ ...prev, enabled: value }))}
                        >
                            Enabled
                        </Switch>
                        
                        <ButtonGroup>
                            <Button 
                                variant="primary" 
                                onPress={editingRule ? handleEditRule : handleCreateRule}
                            >
                                {editingRule ? 'Save Changes' : 'Create Rule'}
                            </Button>
                            <Button 
                                variant="secondary" 
                                onPress={() => {
                                    setShowCreateForm(false);
                                    setEditingRule(null);
                                    setFormData({
                                        name: '',
                                        description: '',
                                        eventType: '',
                                        direction: 'both',
                                        targetBrands: [],
                                        conditions: [],
                                        actions: [],
                                        enabled: true,
                                        priority: 10
                                    });
                                    setSelectedCategory('all');
                                }}
                            >
                                Cancel
                            </Button>
                        </ButtonGroup>
                    </Flex>
                </View>
            )}

            {/* Rules Table */}
            <View backgroundColor="gray-50" padding="size-300" borderRadius="medium">
                <Heading level={3}>Event Routing Rules ({filteredRules.length})</Heading>
                
                <TableView
                    aria-label="Rules table"
                    selectionMode="single"
                    onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;
                        const rule = rules.find(r => r.id === selectedKey);
                        if (rule) {
                            openEditForm(rule);
                        }
                    }}
                >
                    <TableHeader>
                        <Column>Name</Column>
                        <Column>Event Type</Column>
                        <Column>Direction</Column>
                        <Column>Target Brands</Column>
                        <Column>Category</Column>
                        <Column>Priority</Column>
                        <Column>Status</Column>
                        <Column>Actions</Column>
                    </TableHeader>
                    <TableBody>
                        {filteredRules.map(rule => {
                            const eventType = eventTypes.find(et => et.type === rule.eventType);
                            return (
                                <Row key={rule.id}>
                                    <Cell>
                                        <Flex direction="column">
                                            <Text>{rule.name}</Text>
                                            <Text>{rule.description}</Text>
                                        </Flex>
                                    </Cell>
                                    <Cell>
                                        <Flex direction="column">
                                            <Text>{getEventTypeDisplayName(rule.eventType)}</Text>
                                            <Text>{rule.eventType}</Text>
                                        </Flex>
                                    </Cell>
                                    <Cell>
                                        <StatusLight variant={rule.direction === 'both' ? 'positive' : rule.direction === 'inbound' ? 'notice' : 'info'}>
                                            {rule.direction}
                                        </StatusLight>
                                    </Cell>
                                    <Cell>
                                        <Text>
                                            {rule.targetBrands.length === 0 
                                                ? 'All Brands' 
                                                : rule.targetBrands.map(brandId => {
                                                    const brand = brands.find(b => b.id === brandId);
                                                    return brand ? brand.name : brandId;
                                                }).join(', ')
                                            }
                                        </Text>
                                    </Cell>
                                    <Cell>
                                        <StatusLight variant={getCategoryColor(eventType?.category || 'custom')}>
                                            {eventType?.category || 'custom'}
                                        </StatusLight>
                                    </Cell>
                                    <Cell>
                                        <Text>{rule.priority}</Text>
                                    </Cell>
                                    <Cell>
                                        <StatusLight variant={rule.enabled ? 'positive' : 'negative'}>
                                            {rule.enabled ? 'Enabled' : 'Disabled'}
                                        </StatusLight>
                                    </Cell>
                                    <Cell>
                                        <ButtonGroup>
                                            <Button variant="secondary" onPress={() => openEditForm(rule)}>
                                                Edit
                                            </Button>
                                            <Button variant="negative" onPress={() => handleDeleteRule(rule.id)}>
                                                Delete
                                            </Button>
                                        </ButtonGroup>
                                    </Cell>
                                </Row>
                            );
                        })}
                    </TableBody>
                </TableView>
            </View>
        </View>
    );
};

export default RulesConfigurationView;