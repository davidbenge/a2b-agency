import { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { ViewPropsBase } from '../../types/ViewPropsBase';
import { Brand } from '../../../../../actions/Brand';
import { TableView, TableHeader, TableBody, Column, Row, Cell, View, Text, Heading, Button, Flex } from '@adobe/react-spectrum';

const BrandManagerView: React.FC<{ viewProps: ViewPropsBase }> = ({ viewProps }) => {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const apiBaseUrl = `https://${viewProps.aioRuntimeNamespace}.adobeioruntime.net/api/v1/web/${viewProps.aioAppName}`;
        apiService.initialize(apiBaseUrl, viewProps.imsToken);
        
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
        //TODO: Implement delete functionality
        console.log('Delete brand:', brandId);
    };

    return (
        <View padding="size-200">
            <Heading level={1}>Brand Manager</Heading>
            <Text>Welcome, {viewProps.imsProfile.email}</Text>
            
            {loading ? (
                <Text>Loading brands...</Text>
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
                            <Row key={brand.bid}>
                                <Cell>{brand.name}</Cell>
                                <Cell>{brand.endPointUrl}</Cell>
                                <Cell>{brand.enabled ? 'Enabled' : 'Disabled'}</Cell>
                                <Cell>
                                    <Flex gap="size-100">
                                        <Button 
                                            variant="primary" 
                                            onPress={() => handleEdit(brand)}
                                        >
                                            Edit
                                        </Button>
                                        <Button 
                                            variant="negative" 
                                            onPress={() => handleDelete(brand.bid)}
                                        >
                                            Delete
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