# Application Navigation Structure

## Overview

The application uses a top-level categorized navigation system implemented in the `TopNavigation` component.

## Navigation Categories

### Home
- **Dashboard** (`/`) - Main application dashboard

### Rules Manager
- **Rules Configuration** (`/rules_manager`) - Configure event routing rules with visual builder

### Management
- **Brand Manager** (`/brand_manager`) - Manage brand configurations and settings

### Configuration
- **Workfront Requests** (`/workfront_requests`) - Dynamic form generator for Workfront requests

### System
- **About** (`/about`) - Application information and system details

## Navigation Structure

```typescript
const navigationCategories: NavigationCategory[] = [
    { label: 'Home', items: [{ label: 'Dashboard', path: '/' }] },
    { label: 'Rules Manager', items: [{ label: 'Rules Configuration', path: '/rules_manager' }] },
    { label: 'Management', items: [{ label: 'Brand Manager', path: '/brand_manager' }] },
    { label: 'Configuration', items: [{ label: 'Workfront Requests', path: '/workfront_requests' }] },
    { label: 'System', items: [{ label: 'About', path: '/about' }] }
];
```

## Component

**File:** `src/dx-excshell-1/web-src/src/components/common/TopNavigation.tsx`

**Features:**
- Categorized navigation structure
- Active state highlighting
- Demo mode indicator
- User profile display
- Responsive design

## Visual Design

- **Primary Color:** Purple theme (`purple-600`, `purple-700`)
- **Active States:** White with transparency
- **Demo Mode:** Blue status light indicator
- **Transitions:** Smooth 0.2s ease

## Related Documentation

- [Rules Manager](RULES_MANAGER.md) - Rules configuration and management
- [Workfront Request Form](WORKFRONT_REQUEST_FORM.md) - Dynamic form generator
- [Demo Mode Instructions](DEMO_MODE_INSTRUCTIONS.md) - Demo mode setup

---

**Version:** 1.0.0  
**Component:** TopNavigation  
**Demo Mode:** ✅ Supported
