import React, { useState, useEffect } from 'react';
import { ViewPropsBase } from '../../types/ViewPropsBase';
import {
    View,
    Heading,
    Text,
    Button,
    Flex,
    TextField,
    NumberField,
    TextArea,
    ComboBox,
    Item,
    Switch,
    Divider,
    StatusLight,
    ProgressCircle,
    ActionGroup
} from '@adobe/react-spectrum';
import { v4 as uuidv4 } from 'uuid';


enum EventType {
    AEM_ASSET_CREATED = "aem.assets.asset.created",
    AEM_ASSET_UPDATED = "aem.assets.asset.updated",
    AEM_ASSET_DELETED = "aem.assets.asset.deleted",
    AEM_ASSET_METADATA_UPDATED = "aem.assets.asset.metadata_updated"
  }
  Object.values(EventType).forEach((eventType)  => {
    console.log('eventType', eventType)
  })

const EventTypeLabels = {
    [EventType.AEM_ASSET_CREATED]: "AEM Asset Created",
    [EventType.AEM_ASSET_UPDATED]: ["name",EventType.AEM_ASSET_UPDATED],
    [EventType.AEM_ASSET_DELETED]: ["name",EventType.AEM_ASSET_DELETED],
    [EventType.AEM_ASSET_METADATA_UPDATED]: "AEM Asset Metadata Updated"
}
Object.values(EventTypeLabels).forEach((eventTypeLabel)  => {
    console.log('eventTypeLabel', eventTypeLabel)
})




// Types for Workfront request structure
interface WorkfrontRequest {
    name: string;
    projectID: string;
    queueDefID: string;
    parameterValues: Record<string, any>;
}

interface WorkfrontField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'textarea' | 'select' | 'boolean' | 'date';
    required: boolean;
    options?: string[];
    placeholder?: string;
    description?: string;
}

interface WorkfrontFormTemplate {
    id: string;
    name: string;
    description: string;
    projectID: string;
    queueDefID: string;
    fields: WorkfrontField[];
}

// Mock data for demo mode
const mockWorkfrontTemplates: WorkfrontFormTemplate[] = [
    {
        id: 'rebate-request',
        name: 'Rebate Request Submission',
        description: 'Submit rebate requests for customer purchases',
        projectID: 'PROJ-12345',
        queueDefID: 'QUEUE-REBATE-001',
        fields: [
            {
                id: 'DE:Customer Name',
                name: 'Customer Name',
                type: 'text',
                required: true,
                placeholder: 'Enter customer name',
                description: 'Full name of the customer requesting rebate'
            },
            {
                id: 'DE:Amount',
                name: 'Rebate Amount',
                type: 'number',
                required: true,
                placeholder: '0.00',
                description: 'Amount of rebate requested in USD'
            },
            {
                id: 'DE:Product Category',
                name: 'Product Category',
                type: 'select',
                required: true,
                options: ['Electronics', 'Software', 'Services', 'Hardware', 'Consulting'],
                description: 'Category of product/service for rebate'
            },
            {
                id: 'DE:Reason',
                name: 'Reason for Rebate',
                type: 'textarea',
                required: true,
                placeholder: 'Explain the reason for this rebate request...',
                description: 'Detailed explanation of why rebate is being requested'
            },
            {
                id: 'DE:Urgent',
                name: 'Urgent Request',
                type: 'boolean',
                required: false,
                description: 'Check if this is an urgent rebate request'
            }
        ]
    },
    {
        id: 'approval-request',
        name: 'Approval Request',
        description: 'Request approval for various business processes',
        projectID: 'PROJ-67890',
        queueDefID: 'QUEUE-APPROVAL-001',
        fields: [
            {
                id: 'DE:Request Type',
                name: 'Request Type',
                type: 'select',
                required: true,
                options: ['Budget Approval', 'Resource Allocation', 'Project Extension', 'Vendor Selection'],
                description: 'Type of approval being requested'
            },
            {
                id: 'DE:Amount',
                name: 'Amount',
                type: 'number',
                required: true,
                placeholder: '0.00',
                description: 'Amount associated with this request'
            },
            {
                id: 'DE:Justification',
                name: 'Business Justification',
                type: 'textarea',
                required: true,
                placeholder: 'Provide business justification...',
                description: 'Explain why this approval is needed'
            },
            {
                id: 'DE:Deadline',
                name: 'Required By',
                type: 'date',
                required: true,
                description: 'When this approval is needed'
            }
        ]
    },
    {
        id: 'support-ticket',
        name: 'Support Ticket',
        description: 'Create support tickets for technical issues',
        projectID: 'PROJ-11111',
        queueDefID: 'QUEUE-SUPPORT-001',
        fields: [
            {
                id: 'DE:Issue Type',
                name: 'Issue Type',
                type: 'select',
                required: true,
                options: ['Bug Report', 'Feature Request', 'Performance Issue', 'Integration Problem'],
                description: 'Type of issue being reported'
            },
            {
                id: 'DE:Priority',
                name: 'Priority',
                type: 'select',
                required: true,
                options: ['Low', 'Medium', 'High', 'Critical'],
                description: 'Priority level of this issue'
            },
            {
                id: 'DE:Description',
                name: 'Issue Description',
                type: 'textarea',
                required: true,
                placeholder: 'Describe the issue in detail...',
                description: 'Detailed description of the problem'
            },
            {
                id: 'DE:Steps to Reproduce',
                name: 'Steps to Reproduce',
                type: 'textarea',
                required: false,
                placeholder: '1. Step one\n2. Step two\n3. Step three',
                description: 'Steps to reproduce the issue (if applicable)'
            }
        ]
    }
];

const WorkfrontRequestForm: React.FC<{ viewProps: ViewPropsBase }> = ({ viewProps }) => {
    const isDemoMode = viewProps.aioEnableDemoMode;
    
    // State management
    const [templates, setTemplates] = useState<WorkfrontFormTemplate[]>(isDemoMode ? mockWorkfrontTemplates : []);
    const [selectedTemplate, setSelectedTemplate] = useState<WorkfrontFormTemplate | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [showForm, setShowForm] = useState(false);

    // Demo mode fallback
    if (!isDemoMode) {
        return (
            <View padding="size-400">
                <Heading level={1}>Workfront Request Form</Heading>
                <Text>This component is only available in demo mode.</Text>
            </View>
        );
    }

    // Handle template selection
    const handleTemplateSelect = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplate(template);
            setFormData({});
            setShowForm(true);
            setSubmitStatus('idle');
        }
    };

    // Handle form field changes
    const handleFieldChange = (fieldId: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    // Render form field based on type
    const renderFormField = (field: WorkfrontField) => {
        const value = formData[field.id] || '';
        const isRequired = field.required;

        switch (field.type) {
            case 'text':
                return (
                    <TextField
                        key={field.id}
                        label={field.name}
                        value={value}
                        onChange={(val) => handleFieldChange(field.id, val)}
                        placeholder={field.placeholder}
                        description={field.description}
                        isRequired={isRequired}
                        width="100%"
                    />
                );

            case 'number':
                return (
                    <NumberField
                        key={field.id}
                        label={field.name}
                        value={value}
                        onChange={(val) => handleFieldChange(field.id, val)}
                        placeholder={field.placeholder}
                        description={field.description}
                        isRequired={isRequired}
                        width="100%"
                    />
                );

            case 'textarea':
                return (
                    <TextArea
                        key={field.id}
                        label={field.name}
                        value={value}
                        onChange={(val) => handleFieldChange(field.id, val)}
                        placeholder={field.placeholder}
                        description={field.description}
                        isRequired={isRequired}
                        width="100%"
                        rows={4}
                    />
                );

            case 'select':
                return (
                    <ComboBox
                        key={field.id}
                        label={field.name}
                        selectedKey={value}
                        onSelectionChange={(key) => handleFieldChange(field.id, key)}
                        description={field.description}
                        isRequired={isRequired}
                        width="100%"
                    >
                        {field.options?.map(option => (
                            <Item key={option}>{option}</Item>
                        ))}
                    </ComboBox>
                );

            case 'boolean':
                return (
                    <Switch
                        key={field.id}
                        isSelected={value}
                        onChange={(isSelected) => handleFieldChange(field.id, isSelected)}
                        description={field.description}
                    >
                        {field.name}
                    </Switch>
                );

            case 'date':
                return (
                    <TextField
                        key={field.id}
                        label={field.name}
                        value={value}
                        onChange={(val) => handleFieldChange(field.id, val)}
                        placeholder="YYYY-MM-DD"
                        description={field.description}
                        isRequired={isRequired}
                        width="100%"
                        type="date"
                    />
                );

            default:
                return (
                    <TextField
                        key={field.id}
                        label={field.name}
                        value={value}
                        onChange={(val) => handleFieldChange(field.id, val)}
                        description={field.description}
                        isRequired={isRequired}
                        width="100%"
                    />
                );
        }
    };

    // Validate form
    const validateForm = (): boolean => {
        if (!selectedTemplate) return false;
        
        for (const field of selectedTemplate.fields) {
            if (field.required && (!formData[field.id] || formData[field.id] === '')) {
                return false;
            }
        }
        return true;
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!selectedTemplate || !validateForm()) {
            setSubmitStatus('error');
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            const workfrontRequest: WorkfrontRequest = {
                name: selectedTemplate.name,
                projectID: selectedTemplate.projectID,
                queueDefID: selectedTemplate.queueDefID,
                parameterValues: formData
            };

            console.log('Workfront Request:', workfrontRequest);
            setSubmitStatus('success');
            
            // Reset form after successful submission
            setTimeout(() => {
                setFormData({});
                setShowForm(false);
                setSelectedTemplate(null);
                setSubmitStatus('idle');
            }, 3000);

        } catch (error) {
            console.error('Error submitting Workfront request:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle form reset
    const handleReset = () => {
        setFormData({});
        setSubmitStatus('idle');
    };

    // Handle back to template selection
    const handleBack = () => {
        setShowForm(false);
        setSelectedTemplate(null);
        setFormData({});
        setSubmitStatus('idle');
    };

    return (
        <View padding="size-400">
            <Heading level={1}>Workfront Request Form</Heading>
            <Text marginBottom="size-300">
                Create and submit Workfront requests using dynamic forms. Select a template to get started.
            </Text>

            {!showForm ? (
                // Template Selection View
                <View>
                    <Heading level={2} marginTop="size-400" marginBottom="size-300">
                        Available Templates ({templates.length})
                    </Heading>
                    
                    <Flex direction="column" gap="size-200">
                        {templates.map(template => (
                            <View
                                key={template.id}
                                padding="size-300"
                                borderWidth="thin"
                                borderColor="gray-300"
                                borderRadius="medium"
                                backgroundColor="gray-50"
                            >
                                <Flex direction="column" gap="size-100">
                                    <Heading level={3}>{template.name}</Heading>
                                    <Text>{template.description}</Text>
                                    <Flex gap="size-200" marginTop="size-200">
                                        <StatusLight variant="info">
                                            Project: {template.projectID}
                                        </StatusLight>
                                        <StatusLight variant="notice">
                                            Queue: {template.queueDefID}
                                        </StatusLight>
                                        <StatusLight variant="positive">
                                            {template.fields.length} fields
                                        </StatusLight>
                                    </Flex>
                                    <Button
                                        variant="primary"
                                        onPress={() => handleTemplateSelect(template.id)}
                                        marginTop="size-200"
                                    >
                                        Use This Template
                                    </Button>
                                </Flex>
                            </View>
                        ))}
                    </Flex>
                </View>
            ) : (
                // Form View
                <View>
                    <Flex direction="row" alignItems="center" gap="size-200" marginBottom="size-400">
                        <Button variant="secondary" onPress={handleBack}>
                            ← Back to Templates
                        </Button>
                        <Heading level={2}>{selectedTemplate?.name}</Heading>
                    </Flex>

                    <Text marginBottom="size-400">
                        {selectedTemplate?.description}
                    </Text>

                    <Divider marginY="size-300" />

                    <View>
                        <Heading level={3} marginBottom="size-300">
                            Form Fields
                        </Heading>
                        
                        <Flex direction="column" gap="size-300">
                            {selectedTemplate?.fields.map(field => renderFormField(field))}
                        </Flex>

                        <Divider marginY="size-400" />

                        <Flex direction="row" gap="size-200" alignItems="center">
                            <Button
                                variant="primary"
                                onPress={handleSubmit}
                                isDisabled={!validateForm() || isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Flex direction="row" alignItems="center" gap="size-100">
                                        <ProgressCircle size="S" />
                                        <Text>Submitting...</Text>
                                    </Flex>
                                ) : (
                                    'Submit Request'
                                )}
                            </Button>
                            
                            <Button variant="secondary" onPress={handleReset}>
                                Reset Form
                            </Button>

                            {submitStatus === 'success' && (
                                <StatusLight variant="positive">
                                    Request submitted successfully!
                                </StatusLight>
                            )}
                            
                            {submitStatus === 'error' && (
                                <StatusLight variant="negative">
                                    Please fill in all required fields
                                </StatusLight>
                            )}
                        </Flex>

                        {validateForm() && (
                            <View marginTop="size-300" padding="size-200" backgroundColor="green-100" borderRadius="medium">
                                <Text>✓ Form is valid and ready to submit</Text>
                            </View>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
};

export default WorkfrontRequestForm;

