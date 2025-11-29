import * as React from 'react';
import { useState, useEffect } from 'react';
import { IBrand } from '../../../../../shared/types';
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
    FileTrigger,
    Picker,
    Item,
    ProgressCircle
} from '@adobe/react-spectrum';

interface WorkfrontCompany {
    ID: string;
    name: string;
    description?: string;
}

interface WorkfrontGroup {
    ID: string;
    name: string;
    description?: string;
}

interface BrandFormProps {
    brand?: IBrand | null;
    mode: 'add' | 'edit' | 'view';
    onSubmit: (brandData: Partial<IBrand>) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
    imsToken: string;
    imsOrgId: string;
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
    loading = false,
    imsToken,
    imsOrgId
}) => {
    const [formData, setFormData] = useState<Partial<IBrand>>({
        name: '',
        endPointUrl: '',
        enabled: false,
        logo: undefined,
        workfrontServerUrl: '',
        workfrontCompanyId: '',
        workfrontCompanyName: '',
        workfrontGroupId: '',
        workfrontGroupName: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    
    // Workfront state
    const [companies, setCompanies] = useState<WorkfrontCompany[]>([]);
    const [groups, setGroups] = useState<WorkfrontGroup[]>([]);
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [workfrontError, setWorkfrontError] = useState<string | null>(null);

    useEffect(() => {
        if (brand) {
            setFormData({
                name: brand.name,
                endPointUrl: brand.endPointUrl,
                enabled: brand.enabled,
                logo: brand.logo,
                workfrontServerUrl: brand.workfrontServerUrl || '',
                workfrontCompanyId: brand.workfrontCompanyId || '',
                workfrontCompanyName: brand.workfrontCompanyName || '',
                workfrontGroupId: brand.workfrontGroupId || '',
                workfrontGroupName: brand.workfrontGroupName || ''
            });
            if (brand.logo) {
                setLogoPreview(brand.logo);
            }
            
            // Load Workfront data if URL exists when opening edit form
            if (brand.workfrontServerUrl && mode === 'edit') {
                // Set a flag to load after formData is updated
                setTimeout(() => {
                    loadCompanies();
                    loadGroups();
                }, 0);
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

        // Workfront validation: if URL is provided, company and group must be selected
        if (formData.workfrontServerUrl?.trim()) {
            if (!formData.workfrontCompanyId) {
                newErrors.workfrontCompanyId = 'Workfront Company is required when Server URL is provided';
            }
            if (!formData.workfrontGroupId) {
                newErrors.workfrontGroupId = 'Workfront Group is required when Server URL is provided';
            }
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

    // Load Workfront companies
    const loadCompanies = async () => {
        if (!formData.workfrontServerUrl) {
            return;
        }

        setIsLoadingCompanies(true);
        setWorkfrontError(null);

        try {
            const response = await fetch('/api/v1/web/a2b-agency/list-workfront-companies', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${imsToken}`,
                    'x-gw-ims-org-id': imsOrgId
                },
                body: JSON.stringify({ workfrontServerUrl: formData.workfrontServerUrl })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setCompanies(result.companies || []);
            } else {
                setWorkfrontError(result.message || 'Failed to load companies');
            }
        } catch (err) {
            setWorkfrontError(err instanceof Error ? err.message : 'Failed to load companies');
        } finally {
            setIsLoadingCompanies(false);
        }
    };

    // Load Workfront groups
    const loadGroups = async () => {
        if (!formData.workfrontServerUrl) {
            return;
        }

        setIsLoadingGroups(true);
        setWorkfrontError(null);

        try {
            const response = await fetch('/api/v1/web/a2b-agency/list-workfront-groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${imsToken}`,
                    'x-gw-ims-org-id': imsOrgId
                },
                body: JSON.stringify({ workfrontServerUrl: formData.workfrontServerUrl })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setGroups(result.groups || []);
            } else {
                setWorkfrontError(result.message || 'Failed to load groups');
            }
        } catch (err) {
            setWorkfrontError(err instanceof Error ? err.message : 'Failed to load groups');
        } finally {
            setIsLoadingGroups(false);
        }
    };

    // Auto-load when Workfront server URL changes
    useEffect(() => {
        if (formData.workfrontServerUrl && formData.workfrontServerUrl !== brand?.workfrontServerUrl) {
            loadCompanies();
            loadGroups();
        }
    }, [formData.workfrontServerUrl]);

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        console.log('BrandForm: Submitting formData:', formData);
        console.log('BrandForm: Workfront fields:', {
            workfrontServerUrl: formData.workfrontServerUrl,
            workfrontCompanyId: formData.workfrontCompanyId,
            workfrontCompanyName: formData.workfrontCompanyName,
            workfrontGroupId: formData.workfrontGroupId,
            workfrontGroupName: formData.workfrontGroupName
        });

        try {
            await onSubmit(formData);
        } catch (error) {
            console.error('Error submitting brand:', error);
        }
    };

    const isViewMode = mode === 'view';

    return (
        <View backgroundColor="gray-50" minHeight="100vh" UNSAFE_style={{ marginTop: 0, paddingTop: 0 }}>
            <View padding="size-400" maxWidth="size-6000">
                <Header>
                    <Heading level={2}>{titleMap[mode] || 'Brand'}</Heading>
                </Header>

                <Content>
                {brand && mode === 'view' && (
                    <Flex direction="column" gap="size-100" marginBottom="size-300">
                        <Text><strong>Brand ID:</strong> {brand.brandId}</Text>
                        {brand.imsOrgName && (
                            <Text><strong>IMS Organization:</strong> {brand.imsOrgName}</Text>
                        )}
                        {brand.imsOrgId && (
                            <Text><strong>IMS Org ID:</strong> {brand.imsOrgId}</Text>
                        )}
                        <Text><strong>Created:</strong> {new Date(brand.createdAt).toLocaleDateString()}</Text>
                        <Text><strong>Last Updated:</strong> {new Date(brand.updatedAt).toLocaleDateString()}</Text>
                        {brand.enabledAt && (
                            <Text><strong>Enabled:</strong> {new Date(brand.enabledAt).toLocaleDateString()}</Text>
                        )}
                    </Flex>
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
                        isReadOnly={true}
                        validationState={errors.endPointUrl ? 'invalid' : undefined}
                        errorMessage={errors.endPointUrl}
                        description="Set during initial registration and cannot be changed"
                    />

                    {/* Logo Upload Section */}
                    <Well marginTop="size-300">
                        <Heading level={4}>Brand Logo</Heading>
                        <Text marginBottom="size-200">
                            Upload a logo for your brand (PNG, JPG, GIF - max 1MB as Base64 string)
                        </Text>

                        {logoPreview && (
                            <Flex direction="row" gap="size-300" alignItems="center" marginBottom="size-200">
                                <Image
                                    src={logoPreview}
                                    alt="Brand logo preview"
                                    objectFit="contain"
                                    width="size-2000"
                                    height="size-2000"
                                />
                                {!isViewMode && (
                                    <Button
                                        variant="negative"
                                        onPress={removeLogo}
                                    >
                                        Remove Logo
                                    </Button>
                                )}
                            </Flex>
                        )}

                        {!logoPreview && !isViewMode && (
                            <View>
                                <DropZone
                                    onDrop={handleLogoUpload}
                                    accept="image/*"
                                    maxSize={5 * 1024 * 1024} // 5MB
                                    minHeight="size-2000"
                                    UNSAFE_style={{ 
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px dashed var(--spectrum-global-color-gray-400)',
                                        borderRadius: '4px',
                                        padding: 'var(--spectrum-global-dimension-size-300)'
                                    }}
                                >
                                    <Flex direction="column" gap="size-100" alignItems="center">
                                        <Text>Drag and drop your logo here, or</Text>
                                        <FileTrigger
                                            acceptedFileTypes={['image/*']}
                                            onSelect={handleLogoUpload}
                                        >
                                            <Button variant="primary">Select File</Button>
                                        </FileTrigger>
                                    </Flex>
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

                    {/* Workfront Integration Configuration */}
                    {mode !== 'add' && (
                        <Well marginTop="size-300">
                            <Heading level={4}>Workfront Integration</Heading>
                            <Text marginBottom="size-200">
                                Configure Workfront server and organization settings for this brand
                            </Text>

                            <Flex direction="column" gap="size-200">
                                <TextField
                                    label="Workfront Server URL"
                                    value={formData.workfrontServerUrl || ''}
                                    onChange={(value) => {
                                        setFormData({ ...formData, workfrontServerUrl: value });
                                        // Clear Workfront validation errors if URL is cleared
                                        if (!value?.trim()) {
                                            setErrors(prev => {
                                                const updated = { ...prev };
                                                delete updated.workfrontCompanyId;
                                                delete updated.workfrontGroupId;
                                                return updated;
                                            });
                                        }
                                    }}
                                    placeholder="https://yourcompany.workfront.com"
                                    isReadOnly={isViewMode}
                                    description="Enter the base URL of your Workfront instance"
                                    width="100%"
                                />

                                {(isLoadingCompanies || isLoadingGroups) && (
                                    <Flex direction="row" gap="size-100" alignItems="center">
                                        <ProgressCircle size="S" isIndeterminate aria-label="Loading..." />
                                        <Text>Loading Workfront data...</Text>
                                    </Flex>
                                )}

                                <Picker
                                label="Workfront Company"
                                selectedKey={formData.workfrontCompanyId || null}
                                onSelectionChange={(key) => {
                                    const selectedCompany = companies.find(c => c.ID === key);
                                    setFormData(prev => ({ 
                                        ...prev, 
                                        workfrontCompanyId: key as string,
                                        workfrontCompanyName: selectedCompany?.name || ''
                                    }));
                                    // Clear error when selection is made
                                    if (key && errors.workfrontCompanyId) {
                                        setErrors(prev => {
                                            const updated = { ...prev };
                                            delete updated.workfrontCompanyId;
                                            return updated;
                                        });
                                    }
                                }}
                                isDisabled={isViewMode || isLoadingCompanies || companies.length === 0}
                                placeholder={isLoadingCompanies ? "Loading..." : companies.length === 0 ? "Enter Server URL above" : "Select a company"}
                                validationState={errors.workfrontCompanyId ? 'invalid' : undefined}
                                errorMessage={errors.workfrontCompanyId}
                                isRequired={formData.workfrontServerUrl?.trim() ? true : false}
                                necessityIndicator="label"
                                width="100%"
                            >
                                {companies.map((company) => (
                                    <Item key={company.ID}>{company.name}</Item>
                                ))}
                            </Picker>

                                <Picker
                                label="Workfront Group"
                                selectedKey={formData.workfrontGroupId || null}
                                onSelectionChange={(key) => {
                                    const selectedGroup = groups.find(g => g.ID === key);
                                    setFormData(prev => ({ 
                                        ...prev, 
                                        workfrontGroupId: key as string,
                                        workfrontGroupName: selectedGroup?.name || ''
                                    }));
                                    // Clear error when selection is made
                                    if (key && errors.workfrontGroupId) {
                                        setErrors(prev => {
                                            const updated = { ...prev };
                                            delete updated.workfrontGroupId;
                                            return updated;
                                        });
                                    }
                                }}
                                isDisabled={isViewMode || isLoadingGroups || groups.length === 0}
                                placeholder={isLoadingGroups ? "Loading..." : groups.length === 0 ? "Enter Server URL above" : "Select a group"}
                                validationState={errors.workfrontGroupId ? 'invalid' : undefined}
                                errorMessage={errors.workfrontGroupId}
                                isRequired={formData.workfrontServerUrl?.trim() ? true : false}
                                necessityIndicator="label"
                                width="100%"
                            >
                                {groups.map((group) => (
                                    <Item key={group.ID}>{group.name}</Item>
                                ))}
                            </Picker>

                                {workfrontError && (
                                    <StatusLight variant="negative">
                                        {workfrontError}
                                    </StatusLight>
                                )}
                            </Flex>
                        </Well>
                    )}

                    {/* Secret is NEVER displayed in the UI for security reasons.
                        It is only shared:
                        - Generated during new-brand-registration
                        - Sent via registration.enabled CloudEvent to brand
                        - Used in X-A2B-Brand-Secret header for authentication */}

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
        </View>
    );
};

export default BrandForm; 