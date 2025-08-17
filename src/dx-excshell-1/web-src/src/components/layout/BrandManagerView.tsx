import { useEffect, useState } from 'react';
import { ViewPropsBase } from '../../types/ViewPropsBase';
import { Brand } from '../../../../../actions/classes/Brand';
import BrandForm from './BrandForm';
import { 
    TableView, 
    TableHeader, 
    TableBody, 
    Column, 
    Row, 
    Cell, 
    View, 
    Text, 
    Heading, 
    Button, 
    Flex,
    StatusLight,
    ProgressCircle,
    SearchField,
    ComboBox,
    Item,
    Image
} from '@adobe/react-spectrum';
import Add from '@spectrum-icons/workflow/Add';
import Edit from '@spectrum-icons/workflow/Edit';
import ViewDetail from '@spectrum-icons/workflow/ViewDetail';
import Delete from '@spectrum-icons/workflow/Delete';
import { v4 as uuidv4 } from 'uuid';

type ViewMode = 'list' | 'add' | 'edit' | 'view';

// Feature flag for demo mode - can be controlled via environment variable
const ENABLE_DEMO_MODE = process.env.REACT_APP_ENABLE_DEMO_MODE === 'true' || 
                        process.env.NODE_ENV === 'development' ||
                        process.env.NODE_ENV !== 'production';

// Mock data for testing (only used in demo mode)
const mockBrands: Brand[] = [
    new Brand({
        bid: '1',
        secret: 'mock-secret-1',
        name: 'Test Brand 1',
        endPointUrl: 'https://example1.com/api',
        enabled: true,
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMDA3Q0ZGIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QnJhbmQgMTwvdGV4dD4KPC9zdmc+',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        enabledAt: new Date('2024-01-01')
    }),
    new Brand({
        bid: '2',
        secret: 'mock-secret-2',
        name: 'Test Brand 2',
        endPointUrl: 'https://example2.com/api',
        enabled: false,
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRkY2QjAwIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QnJhbmQgMjwvdGV4dD4KPC9zdmc+',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
        enabledAt: null
    })
];

const BrandManagerView: React.FC<{ viewProps: ViewPropsBase }> = ({ viewProps }) => {
    const [brands, setBrands] = useState<Brand[]>(ENABLE_DEMO_MODE ? mockBrands : []);
    const [loading, setLoading] = useState(!ENABLE_DEMO_MODE);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Sorting and filtering state
    const [sortDescriptor, setSortDescriptor] = useState<any>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Safe access to viewProps and imsProfile with fallbacks
    const safeViewProps = viewProps || {} as any;
    const userEmail = safeViewProps.imsProfile?.email || 'Demo User';


    // Load brands from API when not in demo mode
    useEffect(() => {
        if (!ENABLE_DEMO_MODE) {
            // TODO: Implement real API call here
            // For now, just set loading to false
            setLoading(false);
        }
    }, [ENABLE_DEMO_MODE]);

    // Filter and sort brands
    const getFilteredAndSortedBrands = () => {
        let filteredBrands = [...brands];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredBrands = filteredBrands.filter(brand =>
                brand.name.toLowerCase().includes(query) ||
                brand.endPointUrl.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            const isEnabled = statusFilter === 'enabled';
            filteredBrands = filteredBrands.filter(brand => brand.enabled === isEnabled);
        }

        // Apply sorting
        if (sortDescriptor) {
            filteredBrands.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                switch (sortDescriptor.column) {
                    case 'name':
                        aValue = a.name.toLowerCase();
                        bValue = b.name.toLowerCase();
                        break;
                    case 'endPointUrl':
                        aValue = a.endPointUrl.toLowerCase();
                        bValue = b.endPointUrl.toLowerCase();
                        break;
                    case 'enabled':
                        aValue = a.enabled;
                        bValue = b.enabled;
                        break;
                    case 'createdAt':
                        aValue = a.createdAt.getTime();
                        bValue = b.createdAt.getTime();
                        break;
                    default:
                        return 0;
                }

                if (aValue < bValue) {
                    return sortDescriptor.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortDescriptor.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }

        return filteredBrands;
    };

    const handleAddBrand = () => {
        setSelectedBrand(null);
        setViewMode('add');
        setError(null);
        setSuccess(null);
    };

    const handleEditBrand = (brand: Brand) => {
        setSelectedBrand(brand);
        setViewMode('edit');
        setError(null);
        setSuccess(null);
    };

    const handleViewBrand = (brand: Brand) => {
        setSelectedBrand(brand);
        setViewMode('view');
        setError(null);
        setSuccess(null);
    };

    const handleDeleteBrand = (brandId: string) => {
        if (!confirm('Are you sure you want to delete this brand?')) {
            return;
        }

        if (ENABLE_DEMO_MODE) {
            // Demo mode: local state management
            setBrands(brands.filter(brand => brand.bid !== brandId));
            setSuccess('Brand deleted successfully');
        } else {
            // TODO: Implement real API call here
            setError('Delete functionality not implemented in production mode');
        }
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
    };

    const handleFormSubmit = async (brandData: Partial<Brand>) => {
        try {
            setFormLoading(true);
            setError(null);

            if (ENABLE_DEMO_MODE) {
                // Demo mode: local state management
                if (viewMode === 'add') {
                    const newBrand = new Brand({
                        ...brandData,
                        bid: uuidv4(),
                        secret: 'mock-secret-' + Math.random().toString(36).substr(2, 9),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        enabledAt: brandData.enabled ? new Date() : null
                    });
                    
                    setBrands([...brands, newBrand]);
                    setSuccess('Brand created successfully');
                } else if (viewMode === 'edit' && selectedBrand) {
                    const updatedBrand = new Brand({
                        ...selectedBrand.toJSON(),
                        ...brandData,
                        bid: selectedBrand.bid,
                        updatedAt: new Date(),
                        enabledAt: brandData.enabled ? (selectedBrand.enabledAt || new Date()) : null
                    });
                    
                    setBrands(brands.map(brand => 
                        brand.bid === selectedBrand.bid ? updatedBrand : brand
                    ));
                    setSuccess('Brand updated successfully');
                }
            } else {
                // TODO: Implement real API calls here
                setError('Save functionality not implemented in production mode');
            }

            setViewMode('list');
        } catch (error) {
            console.error('Error saving brand:', error);
            setError('Error saving brand');
        } finally {
            setFormLoading(false);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    const handleCancel = () => {
        setViewMode('list');
        setSelectedBrand(null);
        setError(null);
        setSuccess(null);
    };

    const renderListView = () => {
        const filteredAndSortedBrands = getFilteredAndSortedBrands();

        return (
            <View padding="size-200">
                <Flex justifyContent="space-between" alignItems="center" marginBottom="size-200">
                    <Heading level={1}>
                        Brand Manager
                        {ENABLE_DEMO_MODE && ' (Demo Mode)'}
                    </Heading>
                    <Button
                        variant="primary"
                        onPress={handleAddBrand}
                    >
                        <Add />
                        <Text>Register Brand</Text>
                    </Button>
                </Flex>
                
                <Text marginBottom="size-200">Welcome, {userEmail}</Text>
                
                {ENABLE_DEMO_MODE && (
                    <StatusLight variant="info" marginBottom="size-200">
                        Running in demo mode with mock data
                    </StatusLight>
                )}
                
                {error && (
                    <StatusLight variant="negative" marginBottom="size-200">
                        {error}
                    </StatusLight>
                )}
                
                {success && (
                    <StatusLight variant="positive" marginBottom="size-200">
                        {success}
                    </StatusLight>
                )}

                {/* Search and Filter Controls */}
                <Flex gap="size-200" marginBottom="size-200" alignItems="end">
                    <SearchField
                        label="Search brands"
                        placeholder="Search by name or URL..."
                        value={searchQuery}
                        onChange={setSearchQuery}
                        width="size-3000"
                    />
                    <ComboBox
                        label="Status"
                        selectedKey={statusFilter}
                        onSelectionChange={(key) => setStatusFilter(key as string)}
                        width="size-2000"
                    >
                        <Item key="all">All Status</Item>
                        <Item key="enabled">Enabled</Item>
                        <Item key="disabled">Disabled</Item>
                    </ComboBox>
                    <Text>
                        Showing {filteredAndSortedBrands.length} of {brands.length} brands
                    </Text>
                </Flex>
                
                {loading ? (
                    <Flex justifyContent="center" alignItems="center" height="size-2000">
                        <ProgressCircle aria-label="Loading brands" />
                        <Text marginStart="size-100">Loading brands...</Text>
                    </Flex>
                ) : (
                    <TableView
                        aria-label="Brands table"
                        selectionMode="single"
                        sortDescriptor={sortDescriptor}
                        onSortChange={setSortDescriptor}
                        onSelectionChange={(selected) => {
                            console.log('Selected:', selected);
                        }}
                    >
                        <TableHeader>
                            <Column key="logo">Logo</Column>
                            <Column key="name" allowsSorting>Name</Column>
                            <Column key="endPointUrl" allowsSorting>Endpoint URL</Column>
                            <Column key="enabled" allowsSorting>Status</Column>
                            <Column key="createdAt" allowsSorting>Created</Column>
                            <Column align="center">Actions</Column>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedBrands.map((brand) => (
                                <Row key={brand.bid}>
                                    <Cell>
                                        {brand.logo ? (
                                            <Image 
                                                src={brand.logo} 
                                                alt={brand.name} 
                                                width="size-400" 
                                                height="size-400"
                                                objectFit="contain"
                                            />
                                        ) : (
                                            <Text>No Logo</Text>
                                        )}
                                    </Cell>
                                    <Cell>{brand.name}</Cell>
                                    <Cell>{brand.endPointUrl}</Cell>
                                    <Cell>
                                        <StatusLight variant={brand.enabled ? 'positive' : 'negative'}>
                                            {brand.enabled ? 'Enabled' : 'Disabled'}
                                        </StatusLight>
                                    </Cell>
                                    <Cell>{brand.createdAt.toLocaleDateString()}</Cell>
                                    <Cell>
                                        <Flex gap="size-100">
                                            <Button 
                                                variant="primary" 
                                                onPress={() => handleViewBrand(brand)}
                                            >
                                                <ViewDetail />
                                            </Button>
                                            <Button 
                                                variant="primary" 
                                                onPress={() => handleEditBrand(brand)}
                                            >
                                                <Edit />
                                            </Button>
                                            <Button 
                                                variant="negative" 
                                                onPress={() => handleDeleteBrand(brand.bid)}
                                            >
                                                <Delete />
                                            </Button>
                                        </Flex>
                                    </Cell>
                                </Row>
                            ))}
                        </TableBody>
                    </TableView>
                )}
            </View>
        );
    };

    const renderFormView = () => (
        <BrandForm
            brand={selectedBrand}
            mode={viewMode as 'add' | 'edit' | 'view'}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
            loading={formLoading}
        />
    );

    const isDeleting = (brandId: string) => deletingBrands.has(brandId);

    return (
        <View>
            {viewMode === 'list' ? renderListView() : renderFormView()}
        </View>
    );
};

export default BrandManagerView;