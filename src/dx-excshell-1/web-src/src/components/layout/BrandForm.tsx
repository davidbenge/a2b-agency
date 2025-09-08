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
    Header,
    Image,
    Well,
    DropZone,
    FileTrigger
} from '@adobe/react-spectrum';

interface BrandFormProps {
    brand?: Brand | null;
    mode: 'add' | 'edit' | 'view';
    onSubmit: (brandData: Partial<Brand>) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

const titleMap = {
    add: 'Register New Brand',
    edit: 'Edit Brand',
    view: 'Brand Details'
};

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
        enabled: false,
        logo: undefined
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    useEffect(() => {
        if (brand) {
            setFormData({
                name: brand.name,
                endPointUrl: brand.endPointUrl,
                enabled: brand.enabled,
                logo: brand.logo
            });
            if (brand.logo) {
                setLogoPreview(brand.logo);
            }
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

    const handleLogoUpload = (files: FileList | null) => {

        const file = files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setErrors({ ...errors, logo: 'Please select a valid image file' });
                return;
            }

            if (file.size > 1024 * 1024) {
                setErrors({ ...errors, logo: 'Logo file size must be less than 1MB' });
                return;
            }

            setErrors({ ...errors, logo: undefined });
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setLogoPreview(result);

                setFormData({ ...formData, logo: result });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeLogo = () => {
        setLogoPreview(null);
        setFormData({ ...formData, logo: undefined });
        setErrors({ ...errors, logo: undefined });
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            // await onSubmit(formData);
        } catch (error) {
            console.error('Error submitting brand:', error);
        }
    };

    const isViewMode = mode === 'view';

    return (
        <View padding="size-200" maxWidth="size-5000">
            <Header>
                <Heading level={2}>{titleMap[mode] || 'Brand'}</Heading>
            </Header>

            <Content>
                {brand && mode === 'view' && (
                    <View marginBottom="size-200">
                        <Text>Brand ID: {brand.brandId}</Text>
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

                    {/* Logo Upload Section */}
                    <Well>
                        <Heading level={4}>Brand Logo</Heading>
                        <Text marginBottom="size-100">
                            Upload a logo for your brand (PNG, JPG, GIF - max 1MB as Base64 string)
                        </Text>

                        {logoPreview && (
                            <View marginBottom="size-200">
                                <Image
                                    src={logoPreview}
                                    alt="Brand logo preview"
                                    objectFit="contain"
                                    width="size-1000"
                                    height="size-1000"
                                />
                                {!isViewMode && (
                                    <Button
                                        variant="negative"
                                        onPress={removeLogo}
                                        marginTop="size-100"
                                    >
                                        Remove Logo
                                    </Button>
                                )}
                            </View>
                        )}

                        {!logoPreview && !isViewMode && (
                            <View>
                                <DropZone
                                    onDrop={handleLogoUpload}
                                    accept="image/*"
                                    maxSize={5 * 1024 * 1024} // 5MB
                                >
                                    <Text>Drag and drop your logo here, or</Text>
                                    <FileTrigger
                                        acceptedFileTypes={['image/*']}
                                        onSelect={handleLogoUpload}
                                    >
                                        <Button variant="primary">Select File</Button>
                                    </FileTrigger>
                                </DropZone>
                                {errors.logo && (
                                    <StatusLight variant="negative" marginTop="size-100">
                                        {errors.logo}
                                    </StatusLight>
                                )}
                            </View>
                        )}
                    </Well>

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