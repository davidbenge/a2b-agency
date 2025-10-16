
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
import Add from '@spectrum-icons/workflow/Add';
import Edit from '@spectrum-icons/workflow/Edit';
import Delete from '@spectrum-icons/workflow/Delete';
import ViewDetail from '@spectrum-icons/workflow/ViewDetail';
import Settings from '@spectrum-icons/workflow/Settings';
import Play from '@spectrum-icons/workflow/Play';
import Pause from '@spectrum-icons/workflow/Pause';

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
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showConditionModal, setShowConditionModal] = useState(false);
    const [editingCondition, setEditingCondition] = useState<RuleCondition | null>(null);
    const [conditionFormData, setConditionFormData] = useState<Partial<RuleCondition>>({
        field: '',
        operator: 'equals',
        value: '',
        logicalOperator: 'AND'
    });
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterDirection, setFilterDirection] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Form state for creating rules
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



    const handleDeleteRule = (ruleId: string) => {
        if (confirm('Are you sure you want to delete this rule?')) {
            setRules(prev => prev.filter(rule => rule.id !== ruleId));
        }
    };

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
    };

    const resetForm = () => {
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
        setShowCreateForm(false);
    };

    const openConditionModal = (condition?: RuleCondition) => {
        console.log('Opening condition modal:', condition);
        console.log('Current showConditionModal state:', showConditionModal);
        if (condition && condition.field) {
            setEditingCondition(condition);
            setConditionFormData(condition);
        } else {
            setEditingCondition(null);
            setConditionFormData({
                field: '',
                operator: 'equals',
                value: '',
                logicalOperator: 'AND'
            });
        }
        console.log('Setting showConditionModal to true');
        setShowConditionModal(true);
        console.log('Modal should be visible now');
    };

    const saveCondition = () => {
        if (!conditionFormData.field || !conditionFormData.value) {
            alert('Please fill in required fields');
            return;
        }

        const newCondition: RuleCondition = {
            field: conditionFormData.field!,
            operator: conditionFormData.operator || 'equals',
            value: conditionFormData.value!,
            logicalOperator: conditionFormData.logicalOperator || 'AND'
        };

        if (editingCondition) {
            // Update existing condition
            setFormData(prev => ({
                ...prev,
                conditions: prev.conditions?.map(cond => 
                    cond === editingCondition ? newCondition : cond
                ) || []
            }));
        } else {
            // Add new condition
            setFormData(prev => ({
                ...prev,
                conditions: [...(prev.conditions || []), newCondition]
            }));
        }

        setShowConditionModal(false);
        setEditingCondition(null);
        setConditionFormData({
            field: '',
            operator: 'equals',
            value: '',
            logicalOperator: 'AND'
        });
    };

    const deleteCondition = (condition: RuleCondition) => {
        setFormData(prev => ({
            ...prev,
            conditions: prev.conditions?.filter(cond => cond !== condition) || []
        }));
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
            <Flex justifyContent="space-between" alignItems="center" marginBottom="size-300">
                <Flex direction="column">
            <Heading level={1}>Rules Configuration</Heading>
            <Text>Configure event routing rules for your application</Text>
                </Flex>
                <Flex gap="size-200">
                    <Button variant="primary" onPress={() => setShowCreateForm(true)}>
                        <Add />
                        <Text>Create Rule</Text>
                    </Button>
                    <Button variant="secondary" onPress={() => {/* Browse templates */}}>
                        <Text>From Template</Text>
                    </Button>
                    <Button variant="secondary" onPress={() => {
                        console.log('Test Modal button clicked');
                        console.log('Current state before:', showConditionModal);
                        setShowConditionModal(false);
                        setTimeout(() => setShowConditionModal(true), 100);
                        console.log('State should be true now');
                    }}>
                        <Text>Test Modal</Text>
                    </Button>
                </Flex>
            </Flex>

            <Divider marginY="size-300" />

            {/* Debug Info */}
            {showConditionModal && (
                <View backgroundColor="red-400" padding="size-200" marginBottom="size-200">
                    <Text>MODAL SHOULD BE VISIBLE - showConditionModal: {showConditionModal.toString()}</Text>
                </View>
            )}

            {/* Controls */}
            <Flex direction="column" gap="size-200" marginBottom="size-300">
                <Flex direction="row" gap="size-200" alignItems="center" wrap>
                    
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

            {/* Create Rule Form */}
            {showCreateForm && (
                <View backgroundColor="gray-50" padding="size-300" borderRadius="medium" marginBottom="size-300">
                    <Heading level={3}>Create New Rule</Heading>
                    <Text marginBottom="size-200">
                        Fill in the details below to create a new event routing rule
                    </Text>
                    
                    <Flex direction="column" gap="size-200" marginTop="size-200">
                        <TextField
                            label="Rule Name"
                            value={formData.name || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                            isRequired
                            width="size-4000"
                            placeholder="Enter a descriptive name for this rule"
                        />
                        
                        <TextArea
                            label="Description"
                            value={formData.description || ''}
                            onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                            width="size-4000"
                            placeholder="Describe what this rule does"
                        />
                        
                            <ComboBox
                                label="Event Type"
                                selectedKey={formData.eventType || ''}
                                onSelectionChange={(value) => setFormData(prev => ({ ...prev, eventType: value as string }))}
                                isRequired
                                width="size-4000"
                            placeholder="Select the event type this rule will handle"
                            >
                            {eventTypes.map(eventType => (
                                    <Item key={eventType.type}>
                                        {eventType.displayName}
                                    </Item>
                                ))}
                            </ComboBox>
                        
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
                            <Text marginBottom="size-100">
                                Select which brands this rule applies to. Leave all unchecked for a global rule.
                            </Text>
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
                            </Flex>
                        </View>
                        
                        <NumberField
                            label="Priority"
                            value={formData.priority || 10}
                            onChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                            minValue={1}
                            maxValue={100}
                            width="size-1000"
                            description="Lower numbers have higher priority"
                        />
                        
                        <Switch
                            isSelected={formData.enabled || true}
                            onChange={(value) => setFormData(prev => ({ ...prev, enabled: value }))}
                        >
                            Enabled
                        </Switch>
                        
                        {/* Visual Rule Builder Canvas */}
                        <Divider marginY="size-300" />
                        <Heading level={4}>Visual Rule Builder</Heading>
                        <View backgroundColor="blue-400" padding="size-200" borderRadius="small" marginBottom="size-200">
                            <Text>
                                <strong>How to build your rule:</strong>
                            </Text>
                            <Text>
                                1. <strong>Add Conditions (IF)</strong> - Define when this rule should trigger (e.g., "if asset type equals image")
                            </Text>
                            <Text>
                                2. <strong>Add Actions (THEN)</strong> - Define what should happen when conditions are met (e.g., "route to brand handler")
                            </Text>
                            <Text>
                                3. <strong>Test Your Rule</strong> - Use the preview below to see how your rule will work
                            </Text>
                        </View>
                        
                        {/* Canvas Area */}
                        <View 
                            backgroundColor="gray-50" 
                            borderWidth="thick" 
                            borderColor="gray-300"
                            borderRadius="medium"
                            height="size-4000"
                            position="relative"
                            overflow="hidden"
                            marginBottom="size-300"
                        >
                            {/* Canvas Grid Background */}
                            <View 
                                position="absolute" 
                                top="0" 
                                left="0" 
                                right="0" 
                                bottom="0"
                                UNSAFE_style={{
                                    backgroundImage: 'radial-gradient(circle, #e0e0e0 1px, transparent 1px)',
                                    backgroundSize: '20px 20px'
                                }}
                            />
                            
                            {/* Rule Canvas Content */}
                            <View padding="size-400" height="100%">
                                <VisualRuleCanvas 
                                    rule={{
                                        id: 'temp-rule',
                                        name: formData.name || 'New Rule',
                                        description: formData.description || '',
                                        eventType: formData.eventType || '',
                                        direction: formData.direction || 'both',
                                        targetBrands: formData.targetBrands || [],
                                        conditions: formData.conditions || [],
                                        actions: formData.actions || [],
                                        enabled: formData.enabled || true,
                                        priority: formData.priority || 10,
                                        createdAt: new Date(),
                                        updatedAt: new Date()
                                    }}
                                    onUpdate={(updatedRule) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            conditions: updatedRule.conditions,
                                            actions: updatedRule.actions
                                        }));
                                    }}
                                    onAddCondition={(condition) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            conditions: [...(prev.conditions || []), condition]
                                        }));
                                    }}
                                    onAddAction={(action) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            actions: [...(prev.actions || []), action]
                                        }));
                                    }}
                                    onEditCondition={openConditionModal}
                                    onDeleteCondition={deleteCondition}
                                />
                            </View>
                        </View>
                        
                        {/* Rule Preview */}
                        {(formData.conditions && formData.conditions.length > 0) || (formData.actions && formData.actions.length > 0) ? (
                            <View backgroundColor="green-400" padding="size-200" borderRadius="small" marginBottom="size-200">
                                <Heading level={5}>Rule Preview</Heading>
                                <View backgroundColor="gray-50" padding="size-200" borderRadius="small">
                                    <Text>
                                        <strong>IF</strong> {' '}
                                        {formData.conditions && formData.conditions.length > 0 ? (
                                            formData.conditions.map((condition, index) => (
                                                <span key={index}>
                                                    {index > 0 && ` ${condition.logicalOperator || 'AND'} `}
                                                    <strong>{condition.field || '[field]'}</strong> {condition.operator || '[operator]'} "{condition.value || '[value]'}"
                                                </span>
                                            ))
                                        ) : (
                                            <em>no conditions</em>
                                        )}
                                        {' '}<strong>THEN</strong>{' '}
                                        {formData.actions && formData.actions.length > 0 ? (
                                            formData.actions.map((action, index) => (
                                                <span key={index}>
                                                    {index > 0 && ', '}
                                                    <strong>{action.type || '[action]'}</strong>
                                                    {action.target && ` to ${action.target}`}
                                                </span>
                                            ))
                                        ) : (
                                            <em>no actions</em>
                                        )}
                                    </Text>
                                </View>
                            </View>
                        ) : (
                            <View backgroundColor="gray-200" padding="size-200" borderRadius="small" marginBottom="size-200">
                                <Text>
                                    <strong>Rule Preview:</strong> Add conditions and actions above to see your rule logic here
                                </Text>
                            </View>
                        )}
                        
                        <ButtonGroup>
                            <Button variant="primary" onPress={handleCreateRule}>
                                Create Rule
                            </Button>
                            <Button variant="secondary" onPress={resetForm}>
                                Cancel
                            </Button>
                        </ButtonGroup>
                    </Flex>
                </View>
            )}

            {/* Condition Configuration Modal */}
            {showConditionModal && (
                <View 
                    position="fixed"
                    top="0"
                    left="0"
                    right="0"
                    bottom="0"
                    backgroundColor="red-500"
                    zIndex={9999}
                    UNSAFE_style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <View 
                        backgroundColor="gray-50" 
                        padding="size-400" 
                        borderRadius="medium"
                        maxWidth="size-5000"
                        width="90%"
                        maxHeight="80%"
                        overflow="auto"
                        borderWidth="thick"
                        borderColor="blue-500"
                    >
                        <Heading level={3}>
                            {editingCondition ? 'Edit Condition' : 'Add New Condition'}
                        </Heading>
                        <Text marginBottom="size-200">
                            Configure the condition that will trigger this rule
                        </Text>
                        
                        <Flex direction="column" gap="size-200" marginTop="size-200">
                            <ComboBox
                                label="Field"
                                selectedKey={conditionFormData.field || ''}
                                onSelectionChange={(key) => setConditionFormData(prev => ({ ...prev, field: key as string }))}
                                isRequired
                                width="size-4000"
                                placeholder="Select the field to check"
                            >
                                <Item key="metadata.a2b__sync_on_change">Sync on Change</Item>
                                <Item key="metadata.a2d__customers">Customer List</Item>
                                <Item key="metadata.campaign">Campaign</Item>
                                <Item key="metadata.priority">Priority</Item>
                                <Item key="metadata.status">Status</Item>
                                <Item key="assetPath">Asset Path</Item>
                                <Item key="assetName">Asset Name</Item>
                                <Item key="taskId">Task ID</Item>
                                <Item key="taskName">Task Name</Item>
                                <Item key="projectId">Project ID</Item>
                                <Item key="assignee">Assignee</Item>
                                <Item key="dueDate">Due Date</Item>
                            </ComboBox>
                            
                            <ComboBox
                                label="Operator"
                                selectedKey={conditionFormData.operator || 'equals'}
                                onSelectionChange={(key) => setConditionFormData(prev => ({ ...prev, operator: key as any }))}
                                isRequired
                                width="size-3000"
                            >
                                <Item key="equals">Equals</Item>
                                <Item key="contains">Contains</Item>
                                <Item key="startsWith">Starts With</Item>
                                <Item key="endsWith">Ends With</Item>
                                <Item key="regex">Regex Match</Item>
                                <Item key="exists">Exists</Item>
                                <Item key="notExists">Not Exists</Item>
                                <Item key="greaterThan">Greater Than</Item>
                                <Item key="lessThan">Less Than</Item>
                            </ComboBox>
                            
                            <TextField
                                label="Value"
                                value={conditionFormData.value || ''}
                                onChange={(value) => setConditionFormData(prev => ({ ...prev, value }))}
                                isRequired
                                width="size-4000"
                                placeholder="Enter the value to compare against"
                            />
                            
                            <ComboBox
                                label="Logical Operator"
                                selectedKey={conditionFormData.logicalOperator || 'AND'}
                                onSelectionChange={(key) => setConditionFormData(prev => ({ ...prev, logicalOperator: key as 'AND' | 'OR' }))}
                                width="size-2000"
                            >
                                <Item key="AND">AND</Item>
                                <Item key="OR">OR</Item>
                            </ComboBox>
                            
                            <ButtonGroup>
                                <Button variant="primary" onPress={saveCondition}>
                                    {editingCondition ? 'Update Condition' : 'Add Condition'}
                                </Button>
                                <Button variant="secondary" onPress={() => setShowConditionModal(false)}>
                                Cancel
                            </Button>
                        </ButtonGroup>
                    </Flex>
                </View>
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
                            setEditingRule(rule);
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
                                            <Button variant="secondary" onPress={() => setEditingRule(rule)}>
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

// Visual Rule Canvas Component
const VisualRuleCanvas: React.FC<{ 
    rule: Rule; 
    onUpdate: (rule: Rule) => void;
    onAddCondition: (condition: RuleCondition) => void;
    onAddAction: (action: RuleAction) => void;
    onEditCondition: (condition?: RuleCondition) => void;
    onDeleteCondition: (condition: RuleCondition) => void;
}> = ({ rule, onUpdate, onAddCondition, onAddAction, onEditCondition, onDeleteCondition }) => {
    const [selectedBlock, setSelectedBlock] = useState<string | null>(null);

    return (
        <View height="100%" position="relative">
            {/* Rule Flow Visualization */}
            <Flex direction="column" gap="size-400" alignItems="center">
                {/* Event Trigger Block */}
                <View 
                    backgroundColor="blue-400" 
                    padding="size-300" 
                    borderRadius="medium"
                    borderWidth="thick"
                    borderColor="blue-600"
                    minWidth="size-4000"
                >
                    <Heading level={4}>Event Trigger</Heading>
                    <Text>{rule.eventType}</Text>
                    <Text>Direction: {rule.direction}</Text>
                </View>

                {/* Conditions Block */}
                {rule.conditions && rule.conditions.length > 0 ? (
                    <View 
                        backgroundColor="orange-400" 
                        padding="size-300" 
                        borderRadius="medium"
                        borderWidth="thick"
                        borderColor="orange-600"
                        minWidth="size-4000"
                    >
                        <Heading level={4}>Conditions (IF)</Heading>
                        {rule.conditions.map((condition, index) => (
                            <View key={index} marginBottom="size-100" backgroundColor="gray-50" padding="size-200" borderRadius="small">
                                <Flex direction="row" gap="size-200" alignItems="center">
                                    <Text>
                                        {index > 0 && `${condition.logicalOperator} `}
                                        <strong>{condition.field}</strong> {condition.operator} "{condition.value}"
                                    </Text>
                                    <Button variant="negative" onPress={() => onDeleteCondition(condition)}>
                                        <Delete />
                                    </Button>
                                    <Button variant="secondary" onPress={() => onEditCondition(condition)}>
                                        <Edit />
                                    </Button>
                                </Flex>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View 
                        backgroundColor="gray-200" 
                        padding="size-300" 
                        borderRadius="medium"
                        borderWidth="thick"
                        borderColor="gray-400"
                        minWidth="size-4000"
                    >
                        <Heading level={4}>Conditions (IF)</Heading>
                        <Text>No conditions defined</Text>
                        <Text>Click "Add Condition" to define when this rule should trigger</Text>
                    </View>
                )}

                {/* Actions Block */}
                {rule.actions && rule.actions.length > 0 ? (
                    <View 
                        backgroundColor="green-400" 
                        padding="size-300" 
                        borderRadius="medium"
                        borderWidth="thick"
                        borderColor="green-600"
                        minWidth="size-4000"
                    >
                        <Heading level={4}>Actions (THEN)</Heading>
                        {rule.actions.map((action, index) => (
                            <View key={index} marginBottom="size-100" backgroundColor="gray-50" padding="size-200" borderRadius="small">
                                <Flex direction="row" gap="size-200" alignItems="center">
                                    <Text>
                                        <strong>{action.type}</strong>
                                        {action.target && ` → ${action.target}`}
                                    </Text>
                                    <Button variant="negative" onPress={() => {/* Remove action */}}>
                                        <Delete />
                                    </Button>
                                </Flex>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View 
                        backgroundColor="gray-200" 
                        padding="size-300" 
                        borderRadius="medium"
                        borderWidth="thick"
                        borderColor="gray-400"
                        minWidth="size-4000"
                    >
                        <Heading level={4}>Actions (THEN)</Heading>
                        <Text>No actions defined</Text>
                        <Text>Click "Add Action" to define what should happen when conditions are met</Text>
                    </View>
                )}

                {/* Add New Blocks */}
                <Flex direction="row" gap="size-200" marginTop="size-400">
                    <Button variant="primary" onPress={() => {
                        console.log('Add Condition button clicked');
                        alert('Add Condition button clicked');
                        onEditCondition();
                    }}>
                        <Add />
                        <Text>Add Condition</Text>
                    </Button>
                    <Button variant="primary" onPress={() => {
                        const newAction: RuleAction = {
                            type: 'route',
                            target: '',
                            parameters: {}
                        };
                        onAddAction(newAction);
                    }}>
                        <Add />
                        <Text>Add Action</Text>
                    </Button>
                </Flex>
            </Flex>
        </View>
    );
};

// Empty Canvas Component
const EmptyCanvas: React.FC<{ 
    onStartBuilding: () => void 
}> = ({ onStartBuilding }) => {
    return (
        <View 
            height="100%"
        >
            <Flex direction="column" gap="size-300" alignItems="center">
                <View backgroundColor="gray-200" padding="size-400" borderRadius="large">
                    <Settings size="XL" />
                </View>
                <Heading level={3}>Start Building Your Rule</Heading>
                <Text>
                    Drag and drop components from the palette to build your rule logic visually.
                    <br />
                    Or start with a template for common rule patterns.
                </Text>
                <ButtonGroup>
                    <Button variant="primary" onPress={onStartBuilding}>
                        <Add />
                        <Text>Start Building</Text>
                    </Button>
                    <Button variant="secondary">
                        <Text>Browse Templates</Text>
                    </Button>
                </ButtonGroup>
            </Flex>
        </View>
    );
};

export default RulesConfigurationView;