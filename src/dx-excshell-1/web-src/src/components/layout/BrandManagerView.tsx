import { useEffect, useState } from 'react';
import { ViewPropsBase } from '../../types/ViewPropsBase';
import { IBrand } from '../../../../../shared/types';
import { DemoBrandManager } from '../../utils/DemoBrandManager';
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
    Image,
    TooltipTrigger,
    Tooltip
} from '@adobe/react-spectrum';
import Add from '@spectrum-icons/workflow/Add';
import Edit from '@spectrum-icons/workflow/Edit';
import ViewDetail from '@spectrum-icons/workflow/ViewDetail';
import Delete from '@spectrum-icons/workflow/Delete';
import Close from '@spectrum-icons/workflow/Close';
import Settings from '@spectrum-icons/workflow/Settings';
import { v4 as uuidv4 } from 'uuid';
import { apiService } from '../../services/api';
import { Brand } from '../../classes/Brand';
import { WorkfrontConfigModal } from '../modals/WorkfrontConfigModal';
import { DialogTrigger, ActionButton } from '@adobe/react-spectrum';

type ViewMode = 'list' | 'add' | 'edit' | 'view';

// Mock data for testing (only used in demo mode)
const mockBrands: Brand[] = [
    DemoBrandManager.createBrand({
        brandId: '1',
        secret: 'mock-secret-1',
        name: 'Test Brand 1',
        endPointUrl: 'https://example1.com/api',
        enabled: true,
        logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMDA3Q0ZGIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QnJhbmQgMTwvdGV4dD4KPC9zdmc+',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        enabledAt: new Date('2024-01-01')
    }),
    DemoBrandManager.createBrand({
        brandId: '2',
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
    const [brands, setBrands] = useState<Brand[]>(viewProps.aioEnableDemoMode ? mockBrands : []);
    const [loading, setLoading] = useState(!viewProps.aioEnableDemoMode);
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedBrandForWF, setSelectedBrandForWF] = useState<Brand | null>(null);
    console.debug('BrandManagerView: viewProps.aioEnableDemoMode', viewProps.aioEnableDemoMode);
    console.debug('BrandManagerView: viewProps', viewProps);

    // Sorting and filtering state
    const [sortDescriptor, setSortDescriptor] = useState<any>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Safe access to viewProps and imsProfile with fallbacks
    const safeViewProps = viewProps || {} as any;
    const userEmail = safeViewProps.imsProfile?.email || 'Demo User';


    // Load brands from API when not in demo mode
    useEffect(() => {
        if (!viewProps.aioEnableDemoMode) {
            const fetchBrands = async () => {
                try {
                    console.debug('BrandManagerView getting brands');
                    const response = await apiService.getBrandList();
                    console.debug('BrandManager View getting brands response', response);
                    console.debug('BrandManager View getting brands response json', JSON.stringify(response, null, 2));

                    console.debug('response statusCode', response.statusCode);
                    console.debug('response body', response.body);
                    console.debug('response body.data', response.body.data);
                    if (response.body.data) {
                        const items = response.body.data as any[];
                        // API returns brand data without secret for security
                        // DemoBrandManager.getBrandFromJson handles missing secret gracefully
                        const mapped = items.map(item => DemoBrandManager.getBrandFromJson(item));
                        setBrands(mapped);
                    }
                } catch (error) {
                    console.error('Error fetching brands:', error);
                } finally {
                    setLoading(false);
                }
            };

            fetchBrands();
        }
    }, [viewProps.aioEnableDemoMode, viewProps.imsToken, viewProps.baseUrl]);


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
                        aValue = new Date(a.createdAt).getTime();
                        bValue = new Date(b.createdAt).getTime();
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

    const handleDeleteBrand = async (brandId: string) => {
        if (!confirm('Are you sure you want to delete this brand?')) {
            return;
        }

        try {
            setError(null);
            setSuccess(null);

            if (viewProps.aioEnableDemoMode) {
                // Demo mode: local state management
                setBrands(brands.filter(brand => brand.brandId !== brandId));
                setSuccess('Brand deleted successfully');
            } else {
                // Production mode: call API
                const response = await apiService.deleteBrand(brandId);
                
                if (response.statusCode === 200) {
                    // Remove from local state
                    setBrands(brands.filter(brand => brand.brandId !== brandId));
                    setSuccess('Brand deleted successfully');
                } else {
                    setError(`Failed to delete brand: ${response.body?.error || 'Unknown error'}`);
                }
            }
        } catch (error) {
            console.error('Error deleting brand:', error);
            setError('Error deleting brand. Please try again.');
        }

        // Clear messages after 3 seconds
        setTimeout(() => {
            setSuccess(null);
            setError(null);
        }, 3000);
    };

    const handleDisableBrand = async (brand: Brand) => {
        if (!confirm(`Are you sure you want to disable "${brand.name}"?`)) {
            return;
        }

        try {
            setError(null);
            setSuccess(null);

            if (viewProps.aioEnableDemoMode) {
                // Demo mode: local state management
                const updatedBrand = DemoBrandManager.createBrand({
                    ...brand.toJSON(),
                    enabled: false,
                    enabledAt: null,
                    updatedAt: new Date()
                });
                setBrands(brands.map(b => b.brandId === brand.brandId ? updatedBrand : b));
                setSuccess('Brand disabled successfully');
            } else {
                // Production mode: call API
                const updatedBrand = new Brand({
                    ...brand.toJSON(),
                    enabled: false,
                    enabledAt: null,
                    updatedAt: new Date()
                });

                const response = await apiService.updateBrand(updatedBrand);
                
                if (response.statusCode === 200 && response.body.data) {
                    const brandFromApi = DemoBrandManager.getBrandFromJson(response.body.data);
                    setBrands(brands.map(b => b.brandId === brand.brandId ? brandFromApi : b));
                    setSuccess('Brand disabled successfully');
                } else {
                    setError(`Failed to disable brand: ${response.body?.error || 'Unknown error'}`);
                }
            }
        } catch (error) {
            console.error('Error disabling brand:', error);
            setError('Error disabling brand. Please try again.');
        }

        // Clear messages after 3 seconds
        setTimeout(() => {
            setSuccess(null);
            setError(null);
        }, 3000);
    };

    const handleWorkfrontConfigSave = async () => {
        if (!selectedBrandForWF) return;
        
        try {
            setSuccess('Workfront configuration saved successfully');
            
            // Refresh the brands list to show updated Workfront info
            const response = await apiService.getBrandList();
            if (response.body.data) {
                const items = response.body.data as any[];
                const brandObjects = items.map(item => DemoBrandManager.getBrandFromJson(item));
                setBrands(brandObjects);
            }
        } catch (error) {
            console.error('Error refreshing brands after Workfront config:', error);
        }
        
        // Close the modal
        setSelectedBrandForWF(null);
        
        // Clear messages after 3 seconds
        setTimeout(() => {
            setSuccess(null);
        }, 3000);
    };

    const handleFormSubmit = async (brandData: Partial<Brand>) => {
        try {
            console.debug('BrandManagerView: handleFormSubmit called', {
                viewMode,
                brandData,
                selectedBrand: selectedBrand?.brandId
            });
            setFormLoading(true);
            setError(null);

            if (viewProps.aioEnableDemoMode) {
                // Demo mode: local state management
                if (viewMode === 'add') {
                    const newBrand = DemoBrandManager.createBrand({
                        ...brandData,
                        brandId: uuidv4(),
                        secret: 'mock-secret-' + Math.random().toString(36).substr(2, 9),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        enabledAt: brandData.enabled ? new Date() : null
                    });

                    setBrands([...brands, newBrand]);
                    setSuccess('Brand created successfully');
                } else if (viewMode === 'edit' && selectedBrand) {
                    const updatedBrand = DemoBrandManager.createBrand({
                        ...selectedBrand.toJSON(),
                        ...brandData,
                        brandId: selectedBrand.brandId,
                        updatedAt: new Date(),
                        enabledAt: brandData.enabled ? (selectedBrand.enabledAt || new Date()) : null
                    });

                    setBrands(brands.map(brand =>
                        brand.brandId === selectedBrand.brandId ? updatedBrand : brand
                    ));
                    setSuccess('Brand updated successfully');
                }
            } else if (viewMode === 'edit' && selectedBrand) {
                // Prepare update data (secret is excluded automatically by Brand.toJSON() on frontend)
                const updatedBrand = new Brand({
                    ...selectedBrand.toJSON(),
                    ...brandData,
                    brandId: selectedBrand.brandId,
                    updatedAt: new Date(),
                    enabledAt: brandData.enabled ? (selectedBrand.enabledAt || new Date()) : null
                });

                console.debug('BrandManagerView: Submitting brand update', {
                    brandId: updatedBrand.brandId,
                    enabled: updatedBrand.enabled,
                    enabledAt: updatedBrand.enabledAt,
                    brandDataEnabled: brandData.enabled
                });

                // Convert to plain object for API call
                const response = await apiService.updateBrand(updatedBrand.toJSON());

                if (response.statusCode === 200 && response.body.data) {
                    // Use the brand data from API response (which excludes secret for security)
                    const brandFromApi = DemoBrandManager.getBrandFromJson(response.body.data);
                    setBrands(brands.map(brand =>
                        brand.brandId === selectedBrand.brandId ? brandFromApi : brand
                    ));
                    setSuccess('Brand updated successfully');
                }

            } else {
                // TODO: Implement real API calls here
                setError('Save functionality not implemented in production mode');
            }
            console.debug('BrandManagerView: handleFormSubmit: setViewMode to list');
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
                        {viewProps.aioEnableDemoMode && ' (Demo Mode)'}
                    </Heading>
                    {/* Brands register themselves with the agency via their own UI - agency cannot register brands */}
                    {/* <Button
                        variant="primary"
                        onPress={handleAddBrand}
                    >
                        <Add />
                        <Text>Register Brand</Text>
                    </Button> */}
                </Flex>

                <Text marginBottom="size-200">Welcome, {userEmail}</Text>

                {viewProps.aioEnableDemoMode && (
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
                        sortDescriptor={sortDescriptor}
                        onSortChange={setSortDescriptor}
                    >
                        <TableHeader>
                            <Column key="logo" width={80}>Logo</Column>
                            <Column key="name" allowsSorting minWidth={150}>Name</Column>
                            <Column key="imsOrgName" allowsSorting minWidth={150}>IMS Org</Column>
                            <Column key="endPointUrl" allowsSorting minWidth={200}>Endpoint URL</Column>
                            <Column key="enabled" allowsSorting width={120}>Status</Column>
                            <Column key="createdAt" allowsSorting width={120}>Created</Column>
                            <Column key="actions" align="center" width={200}>Actions</Column>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedBrands.map((brand) => (
                                <Row key={brand.brandId}>
                                    <Cell>
                                        {brand.logo ? (
                                            <Image
                                                src={brand.logo}
                                                alt={brand.name}
                                                width="size-600"
                                                height="size-600"
                                                objectFit="contain"
                                            />
                                        ) : (
                                            <Text>No Logo</Text>
                                        )}
                                    </Cell>
                                    <Cell>{brand.name}</Cell>
                                    <Cell>
                                        {brand.imsOrgName ? (
                                            <TooltipTrigger>
                                                <Text
                                                    UNSAFE_style={{
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        display: 'block',
                                                        cursor: 'help'
                                                    }}
                                                >
                                                    {brand.imsOrgName}
                                                </Text>
                                                <Tooltip>
                                                    <div>
                                                        <strong>Org Name:</strong> {brand.imsOrgName}<br/>
                                                        {brand.imsOrgId && (
                                                            <><strong>Org ID:</strong> {brand.imsOrgId}</>
                                                        )}
                                                    </div>
                                                </Tooltip>
                                            </TooltipTrigger>
                                        ) : (
                                            <Text>—</Text>
                                        )}
                                    </Cell>
                                    <Cell>
                                        <TooltipTrigger>
                                            <Text
                                                UNSAFE_style={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    display: 'block',
                                                    cursor: 'help'
                                                }}
                                            >
                                                {brand.endPointUrl}
                                            </Text>
                                            <Tooltip>{brand.endPointUrl}</Tooltip>
                                        </TooltipTrigger>
                                    </Cell>
                                    <Cell>
                                        <StatusLight variant={brand.enabled ? 'positive' : 'negative'}>
                                            {brand.enabled ? 'Enabled' : 'Disabled'}
                                        </StatusLight>
                                    </Cell>
                                    <Cell>{brand?.createdAt ? new Date(brand.createdAt as any).toLocaleDateString() : ''}</Cell>
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
                                            <DialogTrigger isDismissable>
                                                <ActionButton
                                                    onPress={() => setSelectedBrandForWF(brand)}
                                                    aria-label="Configure Workfront"
                                                >
                                                    <Settings />
                                                </ActionButton>
                                                {(close) => (
                                                    <WorkfrontConfigModal
                                                        brandId={brand.brandId}
                                                        imsToken={viewProps.imsToken}
                                                        imsOrgId={viewProps.imsOrg}
                                                        existingConfig={{
                                                            workfrontServerUrl: brand.workfrontServerUrl,
                                                            workfrontCompanyId: brand.workfrontCompanyId,
                                                            workfrontCompanyName: brand.workfrontCompanyName,
                                                            workfrontGroupId: brand.workfrontGroupId,
                                                            workfrontGroupName: brand.workfrontGroupName
                                                        }}
                                                        onSave={async (config) => {
                                                            // The modal will handle the actual save via API call
                                                            // This is just the callback after successful save
                                                            await handleWorkfrontConfigSave();
                                                        }}
                                                        onClose={() => {
                                                            close();
                                                            setSelectedBrandForWF(null);
                                                        }}
                                                    />
                                                )}
                                            </DialogTrigger>
                                            {/* Disable button only shown for enabled brands */}
                                            {brand.enabled && (
                                                <Button
                                                    variant="negative"
                                                    onPress={() => handleDisableBrand(brand)}
                                                >
                                                    <Close />
                                                </Button>
                                            )}
                                            {/* Delete button only shown for disabled brands */}
                                            {!brand.enabled && (
                                                <Button
                                                    variant="negative"
                                                    onPress={() => handleDeleteBrand(brand.brandId)}
                                                >
                                                    <Delete />
                                                </Button>
                                            )}
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

    return (
        <View>
            {viewMode === 'list' ? renderListView() : renderFormView()}
        </View>
    );
};

export default BrandManagerView;