import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Flex,
    Text,
    ActionButton,
    View,
    StatusLight,
    ComboBox,
    Item,
    Divider
} from '@adobe/react-spectrum';
import { ViewPropsBase } from '../../types/ViewPropsBase';

interface NavigationItem {
    label: string;
    path: string;
    category?: string;
}

interface NavigationCategory {
    label: string;
    items: NavigationItem[];
}

const TopNavigation: React.FC<{ viewProps: ViewPropsBase }> = ({ viewProps }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    // Define navigation structure with categories
    const navigationCategories: NavigationCategory[] = [
        {
            label: 'Home',
            items: [
                { label: 'Dashboard', path: '/' }
            ]
        },
        {
            label: 'Management',
            items: [
                { label: 'Brand Manager', path: '/brand_manager' },
                { label: 'Rules Configuration', path: '/rules_manager' }
            ]
        },
        {
            label: 'Configuration',
            items: [
                { label: 'Workfront Requests', path: '/workfront_requests' }
            ]
        },
        {
            label: 'System',
            items: [
                { label: 'About', path: '/about' }
            ]
        }
    ];

    // Flatten all navigation items for easy access
    const allNavItems = navigationCategories.flatMap(category => 
        category.items.map(item => ({ ...item, category: category.label }))
    );

    const isActive = (path: string) => {
        if (path === '/' && location.pathname === '/') {
            return true;
        }
        return path !== '/' && location.pathname.startsWith(path);
    };

    const getCurrentCategory = () => {
        const currentItem = allNavItems.find(item => isActive(item.path));
        return currentItem?.category || '';
    };

    const handleCategoryChange = (categoryKey: string) => {
        setSelectedCategory(categoryKey);
        if (categoryKey && categoryKey !== 'all') {
            const category = navigationCategories.find(cat => cat.label === categoryKey);
            if (category && category.items.length > 0) {
                navigate(category.items[0].path);
            }
        }
    };

    const currentCategory = getCurrentCategory();

    return (
        <View 
            backgroundColor="purple-600" 
            paddingX="size-300" 
            paddingY="size-200"
            borderBottomWidth="thick"
            borderBottomColor="purple-700"
        >
            <Flex 
                direction="column" 
                gap="size-200"
            >
                {/* Top Row - Brand and Demo Mode */}
                <Flex 
                    direction="row" 
                    justifyContent="space-between" 
                    alignItems="center"
                    wrap
                >
                    {/* Brand/Client Label */}
                    <Flex direction="column" gap="size-50">
                        <Text 
                            UNSAFE_style={{ 
                                color: 'white', 
                                fontSize: '18px', 
                                fontWeight: 'bold' 
                            }}
                        >
                            Agency {viewProps.aioEnableDemoMode && ' (Demo Mode)'}
                        </Text>
                        {viewProps?.imsProfile?.email && (
                            <Text 
                                UNSAFE_style={{ 
                                    color: 'rgba(255, 255, 255, 0.8)', 
                                    fontSize: '12px' 
                                }}
                            >
                                {viewProps.imsProfile.email}
                            </Text>
                        )}
                    </Flex>

                    {/* Demo Mode Indicator */}
                    {viewProps.aioEnableDemoMode && (
                        <StatusLight 
                            variant="info"
                            UNSAFE_style={{
                                '--spectrum-global-color-status-info': '#ffffff',
                                color: 'white'
                            }}
                        >
                            <Text UNSAFE_style={{ color: 'white', fontSize: '12px' }}>
                                Demo Mode Active
                            </Text>
                        </StatusLight>
                    )}
                </Flex>

                {/* Navigation Row */}
                <Flex 
                    direction="row" 
                    justifyContent="space-between" 
                    alignItems="center"
                    wrap
                    gap="size-200"
                >
                    {/* Category Navigation */}
                    <Flex 
                        direction="row" 
                        gap="size-100" 
                        alignItems="center"
                        wrap
                    >
                        {navigationCategories.map((category) => (
                            <ActionButton
                                key={category.label}
                                onPress={() => handleCategoryChange(category.label)}
                                isQuiet
                                UNSAFE_style={{
                                    color: currentCategory === category.label ? 'white' : 'rgba(255, 255, 255, 0.8)',
                                    backgroundColor: currentCategory === category.label 
                                        ? 'rgba(255, 255, 255, 0.2)' 
                                        : 'transparent',
                                    borderRadius: '4px',
                                    padding: '8px 16px',
                                    fontWeight: currentCategory === category.label ? 'bold' : 'normal',
                                    border: 'none',
                                    transition: 'all 0.2s ease',
                                    minHeight: '36px'
                                }}
                                UNSAFE_className="spectrum-header-nav-item"
                            >
                                {category.label}
                            </ActionButton>
                        ))}
                    </Flex>

                    {/* Sub-navigation for current category */}
                    {currentCategory && (
                        <Flex 
                            direction="row" 
                            gap="size-100" 
                            alignItems="center"
                            wrap
                        >
                            {navigationCategories
                                .find(cat => cat.label === currentCategory)
                                ?.items.map((item) => (
                                    <ActionButton
                                        key={item.path}
                                        onPress={() => navigate(item.path)}
                                        isQuiet
                                        UNSAFE_style={{
                                            color: isActive(item.path) ? 'white' : 'rgba(255, 255, 255, 0.7)',
                                            backgroundColor: isActive(item.path) 
                                                ? 'rgba(255, 255, 255, 0.15)' 
                                                : 'transparent',
                                            borderRadius: '4px',
                                            padding: '6px 12px',
                                            fontWeight: isActive(item.path) ? 'bold' : 'normal',
                                            border: 'none',
                                            transition: 'all 0.2s ease',
                                            minHeight: '32px',
                                            fontSize: '14px'
                                        }}
                                        UNSAFE_className="spectrum-header-sub-nav-item"
                                    >
                                        {item.label}
                                    </ActionButton>
                                ))}
                        </Flex>
                    )}
                </Flex>
            </Flex>
        </View>
    );
};

export default TopNavigation;

