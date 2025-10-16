/**
 * Demo Mode Component Template
 * 
 * Use this template when creating new demo mode enabled components.
 * Copy this file and customize it for your specific component needs.
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

// Define your data interface
interface YourDataType {
    id: string;
    name: string;
    description: string;
    category: 'category1' | 'category2' | 'category3';
    status: 'active' | 'inactive' | 'pending';
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}

// Mock data for demo mode - customize with realistic examples
const mockData: YourDataType[] = [
    {
        id: 'item-1',
        name: 'Example Item 1',
        description: 'This is an example item for demo purposes',
        category: 'category1',
        status: 'active',
        priority: 10,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15')
    },
    {
        id: 'item-2',
        name: 'Example Item 2',
        description: 'Another example item with different properties',
        category: 'category2',
        status: 'inactive',
        priority: 5,
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16')
    },
    {
        id: 'item-3',
        name: 'Example Item 3',
        description: 'Third example item showing variety',
        category: 'category3',
        status: 'pending',
        priority: 15,
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-17')
    }
];

const YourComponentName: React.FC<{ viewProps: ViewPropsBase }> = ({ viewProps }) => {
    // Demo mode detection
    const isDemoMode = viewProps.aioEnableDemoMode;
    
    // State management
    const [data, setData] = useState<YourDataType[]>(isDemoMode ? mockData : []);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingItem, setEditingItem] = useState<YourDataType | null>(null);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    
    // Form state
    const [formData, setFormData] = useState<Partial<YourDataType>>({
        name: '',
        description: '',
        category: 'category1',
        status: 'active',
        priority: 10
    });

    // Safe access to viewProps
    const safeViewProps = viewProps || {} as any;

    // Filter data based on search and category
    const filteredData = data.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Helper functions
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'positive';
            case 'inactive': return 'negative';
            case 'pending': return 'notice';
            default: return 'neutral';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'category1': return 'positive';
            case 'category2': return 'notice';
            case 'category3': return 'info';
            default: return 'neutral';
        }
    };

    // CRUD operations
    const handleCreateItem = () => {
        if (!formData.name) {
            alert('Please fill in required fields');
            return;
        }

        const newItem: YourDataType = {
            id: `item-${Date.now()}`,
            name: formData.name!,
            description: formData.description || '',
            category: formData.category || 'category1',
            status: formData.status || 'active',
            priority: formData.priority || 10,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        setData(prev => [...prev, newItem]);
        setShowCreateForm(false);
        resetForm();
    };

    const handleEditItem = () => {
        if (!editingItem || !formData.name) {
            alert('Please fill in required fields');
            return;
        }

        const updatedItem: YourDataType = {
            ...editingItem,
            name: formData.name!,
            description: formData.description || '',
            category: formData.category || 'category1',
            status: formData.status || 'active',
            priority: formData.priority || 10,
            updatedAt: new Date()
        };

        setData(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item));
        setEditingItem(null);
        resetForm();
    };

    const handleDeleteItem = (itemId: string) => {
        if (confirm('Are you sure you want to delete this item?')) {
            setData(prev => prev.filter(item => item.id !== itemId));
        }
    };

    const openEditForm = (item: YourDataType) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            description: item.description,
            category: item.category,
            status: item.status,
            priority: item.priority
        });
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            category: 'category1',
            status: 'active',
            priority: 10
        });
    };

    // Demo mode fallback UI
    if (!isDemoMode) {
        return (
            <View padding="size-400">
                <Heading level={1}>Your Component Name</Heading>
                <Text>This component is only available in demo mode.</Text>
            </View>
        );
    }

    return (
        <View padding="size-400">
            <Heading level={1}>Your Component Name</Heading>
            <Text>Manage your data items in demo mode</Text>

            <Divider marginY="size-300" />

            {/* Controls */}
            <Flex direction="column" gap="size-200" marginBottom="size-300">
                <Flex direction="row" gap="size-200" alignItems="center" wrap>
                    <ButtonGroup>
                        <Button variant="primary" onPress={() => setShowCreateForm(true)}>
                            Create Item
                        </Button>
                    </ButtonGroup>
                    
                    <Flex direction="row" gap="size-200" alignItems="center">
                        <SearchField
                            label="Search"
                            placeholder="Search items..."
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
                            <Item key="category1">Category 1</Item>
                            <Item key="category2">Category 2</Item>
                            <Item key="category3">Category 3</Item>
                        </ComboBox>
                    </Flex>
                </Flex>
            </Flex>

            {/* Create/Edit Form */}
            {(showCreateForm || editingItem) && (
                <View 
                    backgroundColor="gray-100" 
                    padding="size-300" 
                    borderRadius="medium" 
                    marginBottom="size-300"
                >
                    <Heading level={3}>
                        {editingItem ? 'Edit Item' : 'Create New Item'}
                    </Heading>
                    
                    <Flex direction="column" gap="size-200" marginTop="size-200">
                        <TextField
                            label="Name"
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
                            selectedKey={formData.category || 'category1'}
                            onSelectionChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}
                            width="size-2000"
                        >
                            <Item key="category1">Category 1</Item>
                            <Item key="category2">Category 2</Item>
                            <Item key="category3">Category 3</Item>
                        </ComboBox>
                        
                        <ComboBox
                            label="Status"
                            selectedKey={formData.status || 'active'}
                            onSelectionChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                            width="size-2000"
                        >
                            <Item key="active">Active</Item>
                            <Item key="inactive">Inactive</Item>
                            <Item key="pending">Pending</Item>
                        </ComboBox>
                        
                        <NumberField
                            label="Priority"
                            value={formData.priority || 10}
                            onChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                            minValue={1}
                            maxValue={100}
                            width="size-1000"
                        />
                        
                        <ButtonGroup>
                            <Button 
                                variant="primary" 
                                onPress={editingItem ? handleEditItem : handleCreateItem}
                            >
                                {editingItem ? 'Save Changes' : 'Create Item'}
                            </Button>
                            <Button 
                                variant="secondary" 
                                onPress={() => {
                                    setShowCreateForm(false);
                                    setEditingItem(null);
                                    resetForm();
                                }}
                            >
                                Cancel
                            </Button>
                        </ButtonGroup>
                    </Flex>
                </View>
            )}

            {/* Data Table */}
            <View backgroundColor="gray-50" padding="size-300" borderRadius="medium">
                <Heading level={3}>Items ({filteredData.length})</Heading>
                
                <TableView
                    aria-label="Items table"
                    selectionMode="single"
                    onSelectionChange={(keys) => {
                        const selectedKey = Array.from(keys)[0] as string;
                        const item = data.find(i => i.id === selectedKey);
                        if (item) {
                            openEditForm(item);
                        }
                    }}
                >
                    <TableHeader>
                        <Column>Name</Column>
                        <Column>Category</Column>
                        <Column>Status</Column>
                        <Column>Priority</Column>
                        <Column>Actions</Column>
                    </TableHeader>
                    <TableBody>
                        {filteredData.map(item => (
                            <Row key={item.id}>
                                <Cell>
                                    <Flex direction="column">
                                        <Text>{item.name}</Text>
                                        <Text>{item.description}</Text>
                                    </Flex>
                                </Cell>
                                <Cell>
                                    <StatusLight variant={getCategoryColor(item.category)}>
                                        {item.category}
                                    </StatusLight>
                                </Cell>
                                <Cell>
                                    <StatusLight variant={getStatusColor(item.status)}>
                                        {item.status}
                                    </StatusLight>
                                </Cell>
                                <Cell>
                                    <Text>{item.priority}</Text>
                                </Cell>
                                <Cell>
                                    <ButtonGroup>
                                        <Button variant="secondary" onPress={() => openEditForm(item)}>
                                            Edit
                                        </Button>
                                        <Button variant="negative" onPress={() => handleDeleteItem(item.id)}>
                                            Delete
                                        </Button>
                                    </ButtonGroup>
                                </Cell>
                            </Row>
                        ))}
                    </TableBody>
                </TableView>
            </View>
        </View>
    );
};

export default YourComponentName;

