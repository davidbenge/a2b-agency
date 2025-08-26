# Demo Mode Instructions: How to Use and Work with Demo Mode

> 📖 **This is the detailed guide for Demo Mode. For project overview and setup, see the [main README.md](../README.md)**

## Overview

Demo Mode is a development-friendly feature that enables you to test and develop the Agency App without requiring backend services or authentication. It provides a fully functional interface using mock data, making it perfect for UI development, testing, and demonstrations.

## 🚀 Quick Start

### Enabling Demo Mode

Demo mode is automatically enabled in development environments. To manually enable it:

1. **Environment Variable** (Recommended):
   ```bash
   # Add to your .env file
   REACT_APP_ENABLE_DEMO_MODE=true
   ```

2. **Development Environment**:
   - Demo mode is automatically enabled when `NODE_ENV=development`
   - No additional configuration needed

### Starting the Application

```bash
# Start the web application with demo mode
aio app run -e dx/excshell/1 --no-actions

# The application will be available at the displayed localhost URL
# Demo mode will be indicated in the UI
```

## 🎯 What Demo Mode Provides

### **Full CRUD Functionality**
- ✅ **Create**: Add new brands with realistic form validation
- ✅ **Read**: View and search through existing brands
- ✅ **Update**: Edit brand information and settings
- ✅ **Delete**: Remove brands with confirmation

### **Realistic Mock Data**
- Pre-populated with sample brands for immediate testing
- Realistic data structures matching production models
- Various states (enabled/disabled, different dates, etc.)

### **UI Development Features**
- Hot reload for instant feedback on changes
- No authentication required
- Safe testing environment
- Clear demo mode indicators

## 📋 How to Use Demo Mode

### **Brand Manager**
1. Navigate to **Brand Manager** in the left sidebar
2. You'll see pre-populated mock brands
3. Test all CRUD operations:
   - **Add Brand**: Click "Add Brand" button
   - **Edit Brand**: Click edit icon on any brand row
   - **View Brand**: Click on brand name to view details
   - **Delete Brand**: Click delete icon with confirmation

### **Form Validation**
- All form fields have proper validation
- Required fields are enforced
- URL validation for endpoint URLs
- Real-time feedback on form errors

### **Search and Filtering**
- Search brands by name
- Filter by enabled/disabled status
- Sort by different columns
- Real-time search results

## 🔧 Development Workflow

### **UI Development**
1. Enable demo mode in your environment
2. Start the development server
3. Navigate to Brand Manager
4. Make changes to components
5. See instant updates with hot reload
6. Test all interactions with mock data

### **Component Testing**
- Test form components with various inputs
- Verify validation logic
- Check responsive design
- Test accessibility features

### **Feature Development**
- Add new UI components
- Test with realistic data
- Iterate quickly without backend dependencies
- Validate user experience

## 📊 Demo Mode Indicators

### **Visual Indicators**
- **Header**: Shows "Demo Mode" in the top navigation
- **Status Light**: Blue indicator showing "Demo Mode Active"
- **Brand Label**: Agency label shows "(Demo Mode)" suffix

### **Console Indicators**
- Demo mode status logged to console
- Mock data operations logged for debugging
- Clear separation from production behavior

## 🛠️ Technical Details

### **Data Storage**
- **Type**: In-memory React state
- **Persistence**: None (data resets on page refresh)
- **Scope**: Component-level state management
- **Mock Data**: Pre-defined realistic brand objects

### **State Management**
```typescript
// Demo mode is controlled by environment variable
const ENABLE_DEMO_MODE = process.env.REACT_APP_ENABLE_DEMO_MODE === 'true' || 
                        process.env.NODE_ENV === 'development';

// State initialization with mock data
const [brands, setBrands] = useState<Brand[]>(ENABLE_DEMO_MODE ? mockBrands : []);
```

### **Safe Operations**
- All operations are performed on local state
- No network requests made in demo mode
- Defensive programming prevents crashes
- Graceful fallbacks for missing data

## ⚠️ Limitations

### **Current Limitations**
- **No Persistence**: Data is lost on page refresh
- **Memory Only**: No backup or export functionality
- **Single Tab**: Changes don't sync across browser tabs
- **Mock Data Only**: No real API integration

### **Workarounds**
- Refresh page to reset to initial mock data
- Use browser dev tools to inspect state
- Document any important test data manually


## 🚨 Troubleshooting

### **Common Issues**

**Demo Mode Not Working**
- Check environment variable: `REACT_APP_ENABLE_DEMO_MODE=true`
- Verify you're in development environment
- Restart the development server

**No Mock Data Visible**
- Refresh the page to reset to initial data
- Check browser console for errors
- Verify Brand Manager component is loading

**Form Validation Issues**
- Check that all required fields are filled
- Verify URL format for endpoint URLs
- Look for console error messages

### **Debug Mode**
- Open browser developer tools
- Check console for demo mode logs
- Inspect React component state
- Verify environment variables

## 📚 Best Practices

### **For Developers**
- Always test with demo mode before implementing real API calls
- Use realistic mock data that represents actual use cases
- Test edge cases and error scenarios
- Document any demo-specific behavior

### **For Testing**
- Create comprehensive test scenarios
- Test all CRUD operations
- Verify form validation
- Check responsive design on different screen sizes

### **For Demonstrations**
- Use demo mode for client presentations
- Prepare realistic test scenarios
- Show both success and error states
- Demonstrate all available features

## 🎉 Summary

Demo Mode provides a powerful development environment that enables:
- **Rapid UI Development**: No backend dependencies
- **Safe Testing**: No risk of affecting production data
- **Realistic Experience**: Full functionality with mock data
- **Easy Setup**: Minimal configuration required

Use demo mode for all your UI development, testing, and demonstration needs. It's designed to make development faster and safer while providing a realistic user experience. 