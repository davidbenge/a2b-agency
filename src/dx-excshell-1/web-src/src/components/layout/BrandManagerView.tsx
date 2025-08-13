import { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { ViewPropsBase } from '../../types/ViewPropsBase';
import { Brand } from '../../../../../actions/classes/Brand';
import { TableView, TableHeader, TableBody, Column, Row, Cell, View, Text, Heading, Button, Flex, ProgressCircle } from '@adobe/react-spectrum';

const BrandManagerView: React.FC<{ viewProps: ViewPropsBase }> = ({ viewProps }) => {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingBrands, setDeletingBrands] = useState<Set<string>>(new Set());

    useEffect(() => {
        const apiBaseUrl = `https://${viewProps.aioRuntimeNamespace}.adobeioruntime.net/api/v1/web/${viewProps.aioActionPackageName}`;
        apiService.initialize(apiBaseUrl, viewProps.imsToken, viewProps.imsOrg);
        
        const fetchBrands = async () => {
            try {
                console.debug('BrandManagerView getting brands');
                const response = await apiService.getBrandList();
                console.debug('BrandManager View getting brands response', response);
                console.debug('BrandManager View getting brands response json', JSON.stringify(response, null, 2));
                
                console.debug('response statusCode', response.statusCode);
                console.debug('response body', response.body);
                console.debug('response body', response.body);
                console.debug('response body.data', response.body.data);
                if (response.body.data) {
                    const brands = response.body.data as Brand[];
                    setBrands(brands);
                }
            } catch (error) {
                console.error('Error fetching brands:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBrands();

        return () => {
            apiService.clear();
        };
    }, [viewProps.imsToken, viewProps.baseUrl]);

    console.log('BrandManagerView props', viewProps);

    const handleEdit = (brand: Brand) => {
        // Implement edit functionality
        console.log('Edit brand:', brand);
    };

    const handleDelete = async (brandId: string) => {
        console.log('Delete brand:', brandId);
        
        // Add brand to deleting set
        setDeletingBrands(prev => new Set(prev).add(brandId));
        
        try {
            const response = await apiService.deleteBrand(brandId);
            console.log('Delete brand response:', response);
            // Create a new array without the deleted brand
            const updatedBrands = brands.filter(brand => brand.brandId !== brandId);
            setBrands(updatedBrands);
        } catch (error) {
            console.error('Error deleting brand:', error);
        } finally {
            // Remove brand from deleting set
            setDeletingBrands(prev => {
                const newSet = new Set(prev);
                newSet.delete(brandId);
                return newSet;
            });
        }
    };

    const isDeleting = (brandId: string) => deletingBrands.has(brandId);

    return (
        <View padding="size-200">
            <Heading level={1}>Brand Manager</Heading>
            <Text>Welcome, {viewProps.imsProfile.email}</Text>
            
            {loading ? (
                <Flex alignItems="center" gap="size-100">
                    <ProgressCircle aria-label="Loading brands..." size="S" />
                    <Text>Loading brands...</Text>
                </Flex>
            ) : (
                <TableView
                    aria-label="Brands table"
                    selectionMode="single"
                    onSelectionChange={(selected) => {
                        // Handle selection if needed
                        console.log('Selected:', selected);
                    }}
                >
                    <TableHeader>
                        <Column >Name</Column>
                        <Column >Endpoint URL</Column>
                        <Column >Status</Column>
                        <Column align="center">Actions</Column>
                    </TableHeader>
                    <TableBody>
                        {brands.map((brand) => (
                            <Row key={brand.brandId}>
                                <Cell>{brand.name}</Cell>
                                <Cell>{brand.endPointUrl}</Cell>
                                <Cell>{brand.enabled ? 'Enabled' : 'Disabled'}</Cell>
                                <Cell>
                                    <Flex gap="size-100" justifyContent="center">
                                        <Button
                                            variant="primary"
                                            onPress={() => handleEdit(brand)}
                                            isDisabled={isDeleting(brand.brandId)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="negative"
                                            onPress={() => handleDelete(brand.brandId)}
                                            isDisabled={isDeleting(brand.brandId)}
                                        >
                                            {isDeleting(brand.brandId) ? (
                                                <Flex alignItems="center" gap="size-100">
                                                    <ProgressCircle size="XS" />
                                                    Deleting...
                                                </Flex>
                                            ) : (
                                                'Delete'
                                            )}
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

export default BrandManagerView;