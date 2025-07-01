import * as React from 'react';
import { useState, useEffect } from 'react';
import { Brand } from '../../../../../actions/classes/Brand';
import {
    View,
    Form,
    TextField,
    Button,
    Flex,
    Heading,
    Text,
    Switch,
    StatusLight,
    Divider,
    Content,
    Header
} from '@adobe/react-spectrum';

interface BrandFormProps {
    brand?: Brand | null;
    mode: 'add' | 'edit' | 'view';
    onSubmit: (brandData: Partial<Brand>) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

const BrandForm: React.FC<BrandFormProps> = ({ 
    brand, 
    mode, 
    onSubmit, 
    onCancel, 
    loading = false 
}) => {
    const [formData, setFormData] = useState<Partial<Brand>>({
        name: '',
        endPointUrl: '',
        enabled: false
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (brand) {
            setFormData({
                name: brand.name,
                endPointUrl: brand.endPointUrl,
                enabled: brand.enabled
            });
        }
    }, [brand]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name?.trim()) {
            newErrors.name = 'Brand name is required';
        }

        if (!formData.endPointUrl?.trim()) {
            newErrors.endPointUrl = 'Endpoint URL is required';
        } else if (!isValidUrl(formData.endPointUrl)) {
            newErrors.endPointUrl = 'Please enter a valid URL';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidUrl = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Error submitting brand:', error);
        }
    };

    const getTitle = () => {
        switch (mode) {
            case 'add': return 'Register New Brand';
            case 'edit': return 'Edit Brand';
            case 'view': return 'Brand Details';
            default: return 'Brand';
        }
    };

    const isViewMode = mode === 'view';

    return (
        <View padding="size-200" maxWidth="size-5000">
            <Header>
                <Heading level={2}>{getTitle()}</Heading>
            </Header>
            
            <Content>
                {brand && mode === 'view' && (
                    <View marginBottom="size-200">
                        <Text>Brand ID: {brand.bid}</Text>
                        <Text>Created: {brand.createdAt.toLocaleDateString()}</Text>
                        <Text>Last Updated: {brand.updatedAt.toLocaleDateString()}</Text>
                        {brand.enabledAt && (
                            <Text>Enabled: {brand.enabledAt.toLocaleDateString()}</Text>
                        )}
                    </View>
                )}

                <Form necessityIndicator="label">
                    <TextField
                        label="Brand Name"
                        value={formData.name || ''}
                        onChange={(value) => setFormData({ ...formData, name: value })}
                        isRequired
                        isReadOnly={isViewMode}
                        validationState={errors.name ? 'invalid' : undefined}
                        errorMessage={errors.name}
                    />

                    <TextField
                        label="Endpoint URL"
                        value={formData.endPointUrl || ''}
                        onChange={(value) => setFormData({ ...formData, endPointUrl: value })}
                        isRequired
                        isReadOnly={isViewMode}
                        validationState={errors.endPointUrl ? 'invalid' : undefined}
                        errorMessage={errors.endPointUrl}
                        placeholder="https://example.com/api"
                    />

                    {mode !== 'add' && (
                        <Switch
                            label="Enabled"
                            isSelected={formData.enabled}
                            onChange={(isSelected) => setFormData({ ...formData, enabled: isSelected })}
                            isReadOnly={isViewMode}
                        >
                            {formData.enabled ? 'Brand is active' : 'Brand is inactive'}
                        </Switch>
                    )}

                    {brand && mode === 'view' && (
                        <View marginTop="size-200">
                            <Divider size="S" />
                            <Text marginTop="size-100">
                                <strong>Secret:</strong> {brand.secret}
                            </Text>
                        </View>
                    )}

                    {!isViewMode && (
                        <Flex gap="size-100" marginTop="size-200">
                            <Button
                                variant="primary"
                                onPress={handleSubmit}
                                isDisabled={loading}
                            >
                                {loading ? 'Saving...' : (mode === 'add' ? 'Register Brand' : 'Update Brand')}
                            </Button>
                            <Button
                                variant="secondary"
                                onPress={onCancel}
                                isDisabled={loading}
                            >
                                Cancel
                            </Button>
                        </Flex>
                    )}

                    {isViewMode && (
                        <Button
                            variant="secondary"
                            onPress={onCancel}
                            marginTop="size-200"
                        >
                            Close
                        </Button>
                    )}
                </Form>
            </Content>
        </View>
    );
};

export default BrandForm; 