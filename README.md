# a2b Brand Application 

Welcome to my Adobe I/O Application!

## Setup

- Populate the `.env` file in the project root and fill it as shown [below](#env)

## Local Dev

- `aio app run` to start your local Dev server
- App will run on `localhost:9080` by default

By default the UI will be served locally but actions will be deployed and served from Adobe I/O Runtime. To start a
local serverless stack and also run your actions locally use the `aio app run --local` option.

## Test & Coverage

- Run `aio app test` to run unit tests for ui and actions
- Run `aio app test --e2e` to run e2e tests

## Deploy & Cleanup

- `aio app deploy` to build and deploy all actions on Runtime and static files to CDN
- `aio app undeploy` to undeploy the app

## Config

### `.env`

You can generate this file using the command `aio app use`. 

```bash
# This file must **not** be committed to source control

## please provide your Adobe I/O Runtime credentials
# AIO_RUNTIME_AUTH=
# AIO_RUNTIME_NAMESPACE=
```

### `app.config.yaml`
benge app project in TMD dev org: 27200-brand2agency-stage
title: brand to agency

endpoints 

## Exc Shell project structure 
src/
├── assets/
│   ├── images/         # Static images and icons
│   └── styles/         # Global styles, CSS modules
│       └── index.css
├── components/
│   ├── common/         # Reusable components (buttons, inputs, etc.)
│   └── layout/         # Layout components (header, footer, sidebar)
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── services/           # API calls and external services
├── types/
│   ├── interfaces/     # TypeScript interfaces
│   │   └── ViewPropsBase.ts
│   └── enums/         # TypeScript enums
├── utils/
│   ├── constants/     # Constants and configuration
│   │   └── config.json
│   └── helpers/       # Helper functions
│       └── utils.js
├── index.js           # Main application entry
└── exc-runtime.js     # Runtime configuration

## Unified Shell API
https://github.com/AdobeDocs/exc-app

## Register events
`aio event provider create`
"label": "Brand Registration"

### Events to create
`aio event eventmetadata create <id>`
"label": "Brand Registration Received"
"code" : "com.adobe.a2b.registration.received"
"description": "this contains an echo of event that was recieved from remote brand"
`
{
  "specversion": "1.0",
  "id": "20daaf84-c938-48e6-815c-3d3dfcf8c900",
  "source": "urn:uuid:fefcd900-66b6-4a46-9494-1b9ff1c5d0ac",
  "type": "com.adobe.a2b.registration.received",
  "datacontenttype": "application/json",
  "time": "2025-06-08T05:44:51.686Z",
  "eventid": "591c4e47-6ba1-4599-a136-5ccb43157353",
  "event_id": "591c4e47-6ba1-4599-a136-5ccb43157353",
  "recipient_client_id": "4ab33463139e4f96b851589286cd46e4",
  "recipientclientid": "4ab33463139e4f96b851589286cd46e4",
  "data": {
    "bid": "2e59b727-4f9c-4653-a6b9-a49a602ec983",
    "secret": "PFVZNkBLH9iquYvr8hGSctesInK4QlRh",
    "name": "test client benge 37",
    "endPointUrl": "https://pathtoendpoint/37",
    "enabled": false,
    "createdAt": "2025-06-08T05:44:51.219Z",
    "updatedAt": "2025-06-08T05:44:51.219Z"
  }
}
`

"label": "Brand Registration Enabled"
"code" : "com.adobe.a2b.registration.enabled"
"description" : "when an admin approves a brand registration this event is thrown"
`
{
  "specversion": "1.0",
  "id": "381691a0-a5c6-4c97-b1ac-662a06686856",
  "source": "urn:uuid:fefcd900-66b6-4a46-9494-1b9ff1c5d0ac",
  "type": "com.adobe.a2b.registration.enabled",
  "datacontenttype": "application/json",
  "time": "2025-06-08T05:39:47.227Z",
  "eventid": "d72bccdb-1af0-4c01-b802-fea422383017",
  "event_id": "d72bccdb-1af0-4c01-b802-fea422383017",
  "recipient_client_id": "4ab33463139e4f96b851589286cd46e4",
  "recipientclientid": "4ab33463139e4f96b851589286cd46e4",
  "data": {
    "bid": "f94496b9-a40c-4d7a-8c4e-e59db029f247",
    "secret": "Uebq3tGYkoDoxonUxQizqKFHzHG703F1",
    "name": "test client benge 36",
    "endPointUrl": "https://pathtoendpoint/36",
    "enabled": false,
    "createdAt": "2025-06-08T05:39:46.778Z",
    "updatedAt": "2025-06-08T05:39:46.778Z"
  }
}
`

"label": "Brand Registration Disabled"
"code" : "com.adobe.a2b.registration.disabled"
"description" : "when an admin disableds a brand registration this event is thrown"
`
{
  "specversion": "1.0",
  "id": "706c19f6-2975-49a3-9e33-39672aed756e",
  "source": "urn:uuid:fefcd900-66b6-4a46-9494-1b9ff1c5d0ac",
  "type": "com.adobe.a2b.registration.disabled",
  "datacontenttype": "application/json",
  "time": "2025-06-08T05:42:22.333Z",
  "eventid": "175cf397-6b9f-4bb9-9aaa-943d5c42333d",
  "event_id": "175cf397-6b9f-4bb9-9aaa-943d5c42333d",
  "recipient_client_id": "4ab33463139e4f96b851589286cd46e4",
  "recipientclientid": "4ab33463139e4f96b851589286cd46e4",
  "data": {
    "bid": "4e9976ab-95ea-47c1-a2e3-7e266aa47935",
    "secret": "OMWwg3qNE5Mxlwye1KGXj3zYy7ORT9FC",
    "name": "test client benge 36",
    "endPointUrl": "https://pathtoendpoint/36",
    "enabled": false,
    "createdAt": "2025-06-08T05:42:21.855Z",
    "updatedAt": "2025-06-08T05:42:21.855Z"
  }
}
`

Update your .env with the provider id returned by `aio event provider create`
`AIO_AGENCY_EVENTS_REGISTRATION_PROVIDER_ID=fefcd900-fake-fake-fake-1b9ff1c5d0ac`

## Asset Synch Events
`aio event provider create`
"label": "A2B Asset Synch"

### Events to create
`aio event eventmetadata create <provider id>`
"label": "New Asset Published"
"code" : "com.adobe.a2b.assetsynch.new"
"description": "Asset that has never been synched before is coming over for the first time"
todo: event body

`aio event eventmetadata create <provider id>`
"label": "Asset Updated"
"code" : "com.adobe.a2b.assetsynch.update"
"description": "Asset that has been synched before has changed"
todo: event body

`aio event eventmetadata create <provider id>`
"label": "Asset Deleted"
"code" : "com.adobe.a2b.assetsynch.delete"
"description": "Asset that has been synched before has been deleted"
todo: event body

These events will be published to the BRAND and also echo'ed localy for secondary in house systems use

### Asset Synch Setup
Using the AEM Assets Author API subscribe `https://your_adobe_developer_project.adobeioruntime.net/api/v1/web/a2b-agency/assetsynch-event-handler` to the following events. This is done in the Adobe Developer Console. [See setup documentation](https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/aem-apis/openapis/setup)
Asset deleted event - aem.assets.asset.deleted
Asset metadata updated event - aem.assets.asset.metadata_updated

## Brand Manager

The Brand Manager is a comprehensive web application for managing brand registrations and configurations within the Adobe Experience Cloud Shell environment. It provides a modern, intuitive interface for brand administrators to register, view, edit, and manage brand information.

## Rules Manager

The Rules Manager is a standalone feature that allows agencies to create and manage business rules, templates, and dependencies independently of brands. This enables agencies to build reusable rule sets that can be applied to multiple client brands.

### Key Features
- **Field Validation Rules**: Email format, phone number, and custom pattern validation
- **Asset Validation Rules**: File size limits, format restrictions, and dimension checks
- **Rule Templates**: Predefined rule sets that can be applied to multiple brands
- **Rule Dependencies**: Control execution order and create logical validation flows
- **Brand-Independent Management**: Create rules once and apply to multiple brands
- **Responsive Design**: Modern UI with horizontal scrolling tables and intuitive forms

For detailed documentation, see [Rules Manager Feature Guide](docs/RULES_MANAGER_FEATURE.md).

### Features

#### Core Brand Management
- **Brand Registration**: Create new brand profiles with essential information
- **Brand Listing**: View all registered brands in a sortable, filterable table
- **Brand Editing**: Update existing brand information and settings
- **Brand Details**: View comprehensive brand information including metadata
- **Brand Deletion**: Remove brands from the system with confirmation

#### Logo Management
- **Logo Upload**: Modern drag-and-drop file upload using React Spectrum components
- **File Validation**: Automatic validation of file type (images only) and size (max 5MB)
- **Logo Preview**: Real-time preview of uploaded logos
- **Logo Display**: Visual logo representation in brand listings and details
- **Logo Removal**: Easy removal of existing logos

#### User Experience
- **Demo Mode**: Full functionality testing with mock data (no backend required)
- **Responsive Design**: Optimized for various screen sizes and devices
- **Search & Filter**: Advanced filtering by brand name, URL, and status
- **Sorting**: Multi-column sorting for better data organization
- **Status Indicators**: Visual status lights for enabled/disabled brands
- **Loading States**: Proper loading indicators and error handling

### Technical Architecture

#### Frontend Components
- **BrandManagerView**: Main component handling brand listing and management
- **BrandForm**: Form component for brand creation, editing, and viewing
- **React Spectrum**: Adobe's design system components for consistent UI/UX

#### Data Model
```typescript
interface IBrand {
    bid: string;           // Brand ID (unique identifier)
    secret: string;        // Authentication secret
    name: string;          // Brand name
    endPointUrl: string;   // API endpoint URL
    enabled: boolean;      // Brand status
    logo?: string;         // Base64 encoded logo image
    createdAt: Date;       // Creation timestamp
    updatedAt: Date;       // Last update timestamp
    enabledAt: Date;       // Enable timestamp
}
```

#### Demo Mode
The Brand Manager includes a comprehensive demo mode that allows:
- **Local Testing**: Full functionality without backend dependencies
- **Mock Data**: Pre-populated with sample brands and logos
- **State Management**: In-memory data persistence during session
- **CRUD Operations**: Complete create, read, update, delete functionality

### Getting Started

#### Prerequisites
- Node.js and npm installed
- Adobe App Builder CLI (`aio`) configured
- Valid Adobe I/O Runtime credentials

#### Local Development
1. **Start the application**:
   ```bash
   cd src/dx-excshell-1
   aio app run
   ```

2. **Access the Brand Manager**:
   - Navigate to the Brand Manager section in the application
   - Demo mode is automatically enabled in development

3. **Test Logo Upload**:
   - Create a new brand or edit an existing one
   - Use the logo upload section to test file uploads
   - Supported formats: PNG, JPG, GIF, SVG, WebP (max 5MB)

#### Production Deployment
1. **Deploy the application**:
   ```bash
   aio app deploy
   ```

2. **Configure environment variables**:
   - Set `REACT_APP_ENABLE_DEMO_MODE=false` for production
   - Configure backend API endpoints

### API Integration

The Brand Manager is designed to integrate with backend APIs for production use:

#### Brand Operations
- `GET /get-brands` - Retrieve all brands
- `GET /get-brand/{bid}` - Retrieve specific brand
- `POST /new-brand-registration` - Create new brand
- `PUT /update-brand/{bid}` - Update existing brand
- `DELETE /delete-brand/{bid}` - Delete brand

#### Logo Storage
- Logos are stored as Base64 encoded strings in the brand record
- Production implementation should include:
  - File storage service integration
  - Image optimization and compression
  - CDN integration for fast delivery
  - Backup and recovery procedures

### Customization

#### Styling
The application uses React Spectrum components for consistent styling:
- Follow Adobe's design system guidelines
- Customize theme colors and spacing as needed
- Maintain accessibility standards

#### Functionality
- Extend the Brand model for additional fields
- Add custom validation rules
- Implement additional file upload features
- Integrate with external services

### Troubleshooting

#### Common Issues
1. **Logo upload fails**: Check file type and size limits
2. **Demo mode not working**: Verify environment variables
3. **Table not loading**: Check network connectivity and API endpoints
4. **File validation errors**: Ensure files are valid image formats

#### Debug Mode
Enable debug logging by setting:
```bash
LOG_LEVEL=debug
```

### Contributing

When contributing to the Brand Manager:
1. Follow React Spectrum design patterns
2. Maintain TypeScript type safety
3. Include proper error handling
4. Test in both demo and production modes
5. Update documentation for new features

---

For more information about the Brand Manager implementation, see the technical documentation in the `docs/` directory.




