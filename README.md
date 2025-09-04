```
 █████  ██████╗ ███████╗███╗   ██╗ ██████╗██╗   ██╗
██╔══██╗██╔════╝ ██╔════╝████╗  ██║██╔════╝╚██╗ ██╔╝
███████║██║  ███╗█████╗  ██╔██╗ ██║██║  ███╗╚████╔╝ 
██╔══██║██║   ██║██╔══╝  ██║╚██╗██║██║   ██║ ╚██╔╝  
██║  ██║╚██████╔╝███████╗██║ ╚████║╚██████╔╝  ██║   
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝   ╚═╝   
```

# a2b Agency Application 

The Agency to Brand solution is an active proof of concept being developed using Adobe App Builder. It’s designed to connect asset workflows between agencies and brand-owned AEM environments in a secure and auditable way—without requiring direct access to the brand’s systems.
This POC establishes a repeatable pattern that can be shared with agencies and partners to build their own Agency-to-Brand extension using Adobe App Builder and distributing on Adobe Exchange.

[Brand To Agency](https://github.com/davidbenge/a2b-brand)   
[Adobe](https://github.com/davidbenge/a2b-adobe)   

## Prerequisites

- Node.js = 22
- Adobe I/O CLI (`aio`)
- Adobe Developer Console access

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Populate the `.env` file in the project root and fill it as shown [below](#environment-variables)
4. Start the development server:
   ```bash
   npm run run:application
   ```

## Local Development

- Actions only (Node/OpenWhisk):
  - `aio app run -e application --no-serve`
- Web only (Experience Cloud Shell):
  - `aio app run -e dx/excshell/1 --no-actions`
- You must choose one `-e` extension when running.

## Architecture & Best Practices

- Project layout:
  - `src/actions/**` Node 22 OpenWhisk actions (TypeScript)
  - `src/dx-excshell-1/web-src/**` JAMstack web app (React + React Spectrum)
  - `docs/**` all documentation (Cursor-generated notes in `docs/cursor/`)
  - `.cursor/rules/**` repository automation rules

- TypeScript configuration:
  - `tsconfig.base.json`: shared strict, interop, resolution
  - `tsconfig.actions.json` (Node/CommonJS):
    - `module: CommonJS`, `target/lib: ES2020`, `types: ["node"]`, `allowJs: true`
    - consumed by actions build; do not move compilerOptions back into the loader
  - `tsconfig.web.json` (browser/ESNext):
    - `module: ESNext`, `lib: ["ES2020","DOM","DOM.Iterable"]`, `jsx: react-jsx`

- Actions webpack:
  - `webpack-config.js` uses `ts-loader` with `options.configFile = tsconfig.actions.json`
  - `DefinePlugin` is limited to `AIO_*` envs; secrets are not baked into bundles
  - Runtime inputs come from `app.config.yaml`

- Module interop:
  - With `esModuleInterop` enabled, import CommonJS libs with default import:
    - `import aioLogger from '@adobe/aio-lib-core-logging'`

- Strict typing:
  - Avoid implicit `any` (e.g., type arrays: `const requiredHeaders: string[] = []`)
  - In `catch`, use `catch (error: unknown)` and cast as needed

- Actions vs Web boundaries:
  - Do not import Node-only modules (`openwhisk`, `@adobe/aio-lib-*`) from `src/dx-excshell-1/**`
  - If code must be shared, place browser-safe types/models under `src/shared/**`

- JS utilities in actions:
  - JS files under `src/actions/utils/**` may be imported (actions tsconfig enables `allowJs`)
  - Prefer adding minimal `.d.ts` shims when introducing new JS utils

- Runtime isolation contract:
  - Every action accepts `APPLICATION_RUNTIME_INFO` (JSON string)
  - All emitted events include `data.app_runtime_info` with `consoleId`, `projectName`, `workspace`, `app_name`, `action_package_name`

- Tests:
  - Store all tests under the root `test/` directory

- Documentation structure:
  - Keep all docs under `docs/`
  - Cursor-generated notes/summaries live under `docs/cursor/`

## Testing & Coverage

This project includes comprehensive testing with automated CI/CD pipelines. For detailed testing information, see [Testing and CI/CD Setup](docs/cursor/TESTING_AND_CI.md).

### Quick Test Commands
```bash
# Run all tests
npm test

# Run tests with Adobe I/O CLI
aio app test

# Run specific test suites
npm test -- --testPathPattern=BrandManager.test.ts
```

### Test Requirements
- ✅ All tests must pass before merging to main
- ✅ Automated testing on every PR
- ✅ Branch protection rules enforced
- ✅ Security scans prevent vulnerabilities
## Deployment & Cleanup

- `aio app deploy` to build and deploy all actions on Runtime and static files to CDN
- `aio app undeploy` to undeploy the app

## Dependencies

This project uses several key Adobe and React libraries:

- @adobe/aio-sdk
- @adobe/exc-app
- @adobe/react-spectrum
- React 16.13.1
- TypeScript
- Jest for testing

## Configuration

### Environment Variables

You can generate the `.env` file using the command `aio app use`. 

```bash
# This file must **not** be committed to source control

# Adobe I/O Runtime
AIO_RUNTIME_AUTH=
AIO_RUNTIME_NAMESPACE=
AIO_app_name=

# Adobe I/O Events
AIO_AGENCY_EVENTS_REGISTRATION_PROVIDER_ID=
AIO_AGENCY_EVENTS_AEM_ASSET_SYNC_PROVIDER_ID=

# Adobe Internal Calls
ADOBE_INTERNAL_URL_ENDPOINT=

# AEM Authentication
AEM_AUTH_CLIENT_SECRET=
AEM_AUTH_SCOPES=
AEM_AUTH_CLIENT_ID=
AEM_AUTH_TECH_ACCOUNT_ID=
AEM_AUTH_PRIVATE_KEY=
AEM_AUTH_TYPE=

# Service-to-Service Authentication
S2S_API_KEY=
S2S_CLIENT_SECRET=
S2S_SCOPES=

# Organization
ORG_ID=
```

### Environment Setup Instructions

To run this application, you need to configure several environment variables with values from your Adobe Developer Console and AEM Cloud Service settings.

#### 1. Adobe Developer Console Settings

Update these variables with values from your Adobe Developer Console project:

```bash
# Organization ID from your Adobe Developer Console
ORG_ID=your-org-id@AdobeOrg

# Service Account (JWT) credentials from your project
S2S_API_KEY=your-service-account-api-key
S2S_CLIENT_ID=your-service-account-client-id
S2S_CLIENT_SECRET=your-service-account-client-secret
S2S_SCOPES=["AdobeID","openid","read_organizations","additional_info.projectedProductContext","additional_info.roles","adobeio_api","read_client_secret","manage_client_secrets"]
```

#### 2. Application-Specific Settings

Set these to your own target values:

```bash
# Your agency name (used for events and identification)
AGENCY_NAME=Your Agency Name

# Generate a UUID for your agency (use a UUID generator)
AGENCY_ID=12345678-1234-1234-1234-123456789abc

# Your application name (should match your Adobe Developer Console project)
AIO_app_name=your-app-name

# Adobe Internal Calls Configuration
# Endpoint for getting presigned read URLs from Adobe internal services
ADOBE_INTERNAL_URL_ENDPOINT=https://27200-609silverstork-stage.adobeioruntime.net/api/v1/web/a2b-agency
```

#### 3. AEM Cloud Service Integration

These values come from your AEM Cloud Service Developer Console:

```bash
# AEM JWT Integration credentials
AEM_AUTH_CLIENT_ID=your-aem-client-id
AEM_AUTH_TECH_ACCOUNT_ID=your-aem-tech-account-id@techacct.adobe.com
AEM_AUTH_CLIENT_SECRET=your-aem-client-secret
AEM_AUTH_SCOPES=ent_aem_cloud_api
AEM_AUTH_TYPE=jwt
```

##### Private Key Setup (Important!)

The `AEM_AUTH_PRIVATE_KEY` requires special handling:

1. **Download the JWT token** from your AEM Developer Console
2. **Remove the last `\r\n`** from the key
3. **Replace all other `\r\n` with `\n`**
4. **Surround the entire key with double quotes**

Example:
```bash
AEM_AUTH_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nFAKE\n-----END RSA PRIVATE KEY-----"
```

#### 4. Event Provider IDs

These are generated when you register event providers in Adobe I/O Events. You need to find existing providers or create new ones.

##### Finding Existing Event Providers

Use the Adobe I/O CLI to list existing event providers:

```bash
# List all event providers in your organization
aio event provider list

# Look for providers with names like:
# - "Agency Asset Sync Events" or similar for asset sync
# - "Agency Brand Registration Events" or similar for registration
```

##### Creating Event Providers (if none exist)

If you don't have the required event providers, create them:

```bash
# Create asset sync event provider
aio event provider create --name "Agency Asset Sync Events" --description "Events for AEM asset synchronization"

# Create brand registration event provider  
aio event provider create --name "Agency Brand Registration Events" --description "Events for brand registration workflows"
```

##### Updating Environment Variables

After finding or creating the providers, update these variables with the provider UUIDs:

```bash
# Registration events provider ID (from aio event provider list)
AIO_AGENCY_EVENTS_REGISTRATION_PROVIDER_ID=your-registration-provider-uuid

# Asset sync events provider ID (from aio event provider list)
AIO_AGENCY_EVENTS_AEM_ASSET_SYNC_PROVIDER_ID=your-asset-sync-provider-uuid
```

**Note**: The provider UUIDs are required for the application to publish events. If you don't have these set up, the application will fail to publish events.

### Setup Checklist

- [ ] Adobe Developer Console project created
- [ ] Server to Server Account credentials configured
- [ ] AEM Cloud Service JWT integration set up
- [ ] JWT private key properly formatted
- [ ] Event providers checked with `aio event provider list`
- [ ] Event providers created if needed with `aio event provider create`
- [ ] Event provider UUIDs copied to environment variables
- [ ] All environment variables populated
- [ ] Application deployed with `aio app deploy`

### Adobe Internal Calls Configuration

The application can integrate with Adobe internal services to retrieve presigned URLs for assets. This is configured through the `ADOBE_INTERNAL_URL_ENDPOINT` environment variable.

```bash
# Adobe Internal Calls Configuration
# Endpoint for getting presigned read URLs from Adobe internal services
ADOBE_INTERNAL_URL_ENDPOINT=https://27200-609silverstork-stage.adobeioruntime.net/api/v1/web/a2b-agency
```

**Note**: This endpoint is used by the `agency-assetsync-internal-handler` action to retrieve presigned URLs when processing asset sync events. The endpoint should be configured to point to your Adobe internal service that provides presigned URLs for AEM assets.

### Runtime Environment Isolation

The application implements a sophisticated runtime environment isolation system to prevent cross-contamination of events between different development environments. This is crucial when multiple developers are working simultaneously on the same IMS organization.

#### How It Works

1. **Runtime Information Injection**: Every action receives an `APPLICATION_RUNTIME_INFO` parameter containing:
   ```json
   {
     "namespace": "your-runtime-namespace",
     "app_name": "your-app-name"
   }
   ```

2. **Event Enrichment**: All events published by the EventManager are automatically enriched with `app_runtime_info` in their data payload:
   ```json
   {
     "app_runtime_info": {
       "consoleId": "12345",
       "projectName": "a2b", 
       "workspace": "benge",
       "app_name": "a2b-agency"
     }
   }
   ```

3. **Namespace Parsing**: The runtime namespace is parsed into three components:
   - `consoleId`: The Adobe Developer Console ID (first part of namespace)
   - `projectName`: The project name (second part of namespace)
   - `workspace`: The workspace identifier (remaining parts)

#### Benefits

- **Event Isolation**: Events from different development environments can be filtered based on `app_runtime_info`
- **Debugging Clarity**: Developers can easily identify which environment generated specific events
- **Multi-Developer Support**: Multiple developers can work simultaneously without interference
- **Environment Tracking**: Clear visibility into which runtime environment is processing events

#### Implementation Details

The isolation system is implemented through:

- **EventManager**: Automatically adds `app_runtime_info` to all published events
- **IoCustomEventManager**: Parses namespace and enriches event data
- **Action Configuration**: All actions receive `APPLICATION_RUNTIME_INFO` parameter
- **Event Filtering**: Consumers can filter events based on runtime information

This architecture ensures that when multiple developers deploy their own instances of the application, each instance will only process events from its own runtime environment, eliminating confusion and cross-contamination issues.

### Project Configuration

```yaml
benge app project in TMD dev org: 27200-brand2agency-stage
title: brand to agency
```

## Project Structure

```
.
├── src/                          # Source code
│   ├── actions/                  # Adobe I/O Runtime actions
│   │   ├── assetsync-event-handler/  # Asset sync event handling
│   │   ├── get-brands/          # Brand retrieval functionality
│   │   ├── new-brand-registration/    # Brand registration handling
│   │   ├── classes/             # Shared classes
│   │   ├── types/               # TypeScript type definitions
│   │   ├── utils/               # Utility functions
│   │   └── constants.ts         # Shared constants
│   └── dx-excshell-1/           # Experience Cloud Shell configuration
│       ├── web-src/             # Web application source
│       ├── test/                # Unit tests
│       ├── e2e/                 # End-to-end tests
│       └── ext.config.yaml      # Extension configuration
├── test/                        # Test files
├── docs/                        # Documentation
├── setup/                       # Setup scripts
└── dist/                        # Build output
```

## API Endpoints

The application exposes the following endpoints:

- `GET /api/v1/web/a2b-agency/get-brands` - Retrieve list of brands
- `POST /api/v1/web/a2b-agency/new-brand-registration` - Register a new brand
- `POST /api/v1/web/a2b-agency/assetsync-event-handler` - Handle asset sync events

## Unified Shell API

For more information, visit the [Unified Shell API documentation](https://github.com/AdobeDocs/exc-app).

## Event Registration

### Brand Registration Events

1. Create event provider:
```bash
aio event provider create
```
Label: "a2b Brand Registration Event Provider"

2. Create event metadata:
```bash
aio event eventmetadata create <id>
```

#### Event Types

1. **a2b Brand Registration Received**
   - Label: "a2b Brand Registration Received"
   - Code: `com.adobe.a2b.registration.received`
   - Description: "This contains an echo of event that was received from remote brand"

```json
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
    "brandId": "2e59b727-4f9c-4653-a6b9-a49a602ec983",
    "secret": "PFVZNkBLH9iquYvr8hGSctesInK4QlRh",
    "name": "test client benge 37",
    "endPointUrl": "https://pathtoendpoint/37",
    "enabled": false,
    "createdAt": "2025-06-08T05:44:51.219Z",
    "updatedAt": "2025-06-08T05:44:51.219Z"
  }
}
```

2. **a2b Brand Registration Enabled**
   - Label: "a2b Brand Registration Enabled"
   - Code: `com.adobe.a2b.registration.enabled`
   - Description: "When an admin approves a brand registration this event is thrown"

```json
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
    "brandId": "f94496b9-a40c-4d7a-8c4e-e59db029f247",
    "secret": "Uebq3tGYkoDoxonUxQizqKFHzHG703F1",
    "name": "test client benge 36",
    "endPointUrl": "https://pathtoendpoint/36",
    "enabled": false,
    "createdAt": "2025-06-08T05:39:46.778Z",
    "updatedAt": "2025-06-08T05:39:46.778Z"
  }
}
```

3. **a2b Brand Registration Disabled**
   - Label: "a2b Brand Registration Disabled"
   - Code: `com.adobe.a2b.registration.disabled`
   - Description: "When an admin disables a brand registration this event is thrown"

```json
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
    "brandId": "4e9976ab-95ea-47c1-a2e3-7e266aa47935",
    "secret": "OMWwg3qNE5Mxlwye1KGXj3zYy7ORT9FC",
    "name": "test client benge 36",
    "endPointUrl": "https://pathtoendpoint/36",
    "enabled": false,
    "createdAt": "2025-06-08T05:42:21.855Z",
    "updatedAt": "2025-06-08T05:42:21.855Z"
  }
}
```

### Environment Configuration

## Brand Manager

The Brand Manager is a comprehensive web application for managing brand registrations and configurations within the Adobe Experience Cloud Shell environment. It provides a modern, intuitive interface for brand administrators to register, view, edit, and manage brand information.

### Demo Mode

The Brand Manager includes a powerful demo mode for development and testing:

> 📖 **For detailed demo mode instructions, see the [Demo Mode Guide](./docs/DEMO_MODE_INSTRUCTIONS.md)**

**Key Features:**
- **Full CRUD Operations**: Create, read, update, delete brands with mock data
- **No Backend Required**: Complete functionality without authentication or API setup
- **Real-time Development**: Hot reload with instant feedback
- **Safe Testing**: No risk of affecting production data

**Quick Start:**
```bash
# Enable demo mode
REACT_APP_ENABLE_DEMO_MODE=true

# Start the application
aio app run -e dx/excshell/1 --no-actions
```

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
    brandId: string;           // Brand ID (unique identifier)
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
   - Set `AIO_ENABLE_DEMO_MODE=false` for production (web-only; only AIO_* vars are exposed in the bundle)
   - Configure backend API endpoints

### API Integration

The Brand Manager is designed to integrate with backend APIs for production use:

#### Brand Operations
- `GET /get-brands` - Retrieve all brands
- `GET /get-brand/{brandId}` - Retrieve specific brand
- `POST /new-brand-registration` - Create new brand
- `PUT /update-brand/{brandId}` - Update existing brand
- `DELETE /delete-brand/{brandId}` - Delete brand

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

=======
Update your `.env` with the provider id returned by `aio event provider create`:
```bash
AIO_AGENCY_EVENTS_REGISTRATION_PROVIDER_ID=5c3431a2-bd91-4eff-a356-26b747d0aad4
```

## Asset Sync Events

AssetSync is a comprehensive system that handles synchronization of AEM assets between Adobe Experience Manager (AEM) and brand systems. It processes asset events, validates metadata, and distributes asset data to registered brands.

> 📖 **For detailed AssetSync implementation, configuration, and troubleshooting, see the [AssetSync Detailed Guide](./docs/events/aem/AssetSync.md)**

### Event Provider Setup

```bash
aio event provider create
```
Label: "a2b Asset Sync Event Provider"

### Event Types

1. **New Asset Published**
   - Label: "a2b New Asset Published"
   - Code: `com.adobe.a2b.assetsync.new`
   - Description: "Asset that has never been synced before is coming over for the first time"

2. **Asset Updated**
   - Label: "a2b Asset Updated"
   - Code: `com.adobe.a2b.assetsync.update`
   - Description: "Asset that has been synced before has changed"

3. **Asset Deleted**
   - Label: "a2b Asset Deleted"
   - Code: `com.adobe.a2b.assetsync.delete`
   - Description: "Asset that has been synced before has been deleted"

### Asset Sync Setup

Using the AEM Assets Author API, subscribe to the following events at:
`https://your_adobe_developer_project.adobeioruntime.net/api/v1/web/a2b-agency/assetsync-event-handler`

This is done in the Adobe Developer Console. [See setup documentation](https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/aem-apis/openapis/setup)

Events to subscribe to:
- Asset deleted event: `aem.assets.asset.deleted`
- Asset metadata updated event: `aem.assets.asset.metadata_updated`

These events will be published to the BRAND and also echoed locally for secondary in-house systems use.

### Quick Reference

- **Main Handler**: `agency-assetsync-internal-handler`
- **Environment Variable**: `AIO_AGENCY_EVENTS_AEM_ASSET_SYNC_PROVIDER_ID`
- **AEM Metadata Required**: `a2b__sync_on_change`, `a2b__customers`
- **Brand Requirements**: Enabled status, valid endpoint URL

## Troubleshooting
removing all your runtime actions 
`aio rt actions list --json | jq -r '.[] | (.namespace + "/" + .name)' | while read -r a; do [ -n "$a" ] && aio rt action delete "$a"; done`

### Common Issues

1. **Authentication Issues**
   - Ensure all required environment variables are set
   - Verify Adobe I/O credentials are valid
   - Check AEM authentication configuration

2. **Asset Sync Issues**
   - Verify AEM event subscriptions
   - Check asset sync provider configuration
   - Review logs for detailed error messages

## Rules
1. all event are cloud events see (cloud events)[https://github.com/cloudevents/spec]

## Contributing

1. Make a branch or fork
2. Follow the coding standards (ESLint configuration is provided)
3. Write tests for new features that are actions. UI is nice to have but not wired
4. Submit a pull request

## First build
1. git pull the repo local
2. go to adobe developer console and setup a workspace in org Tech Marketing Development in the project "agency to brand" 
3. inside your new project add the following services 
   - Adobe Workfront and use a server to server credential
   - I/O Mangement API
4. For testing reasons add in Custom Event listeners for Brand Registration
   - Test registration provider events is the name
   - Add Event
   - Select 3rd Party Custom Events
   - Select a2b Brand Registration Event Provider
   - Add event subscriptions for all the listed events
5. For testing reasons add in Custom Event listeners for Asset Event Provider
   - Test asset events provider events is the name
   - Add Event
   - Select 3rd Party Custom Events
   - Select a2b Brand Registration Event Provider
   - Add event subscriptions for all the listed events (a2b Asset Deleted, a2b Asset Updated, a2b New Asset Published)
6. Navigate back to your new workspace home 
7. in top right `download all` and pull the json file down that has all the workspace config
8. install Node Version Manager nvm
9. install Node version 22 `nvm install 22`
10. set node 22 current `nvm use 22`
11. alias 22 to default `nvm alias default 22`
12. install aio cli `npm install -g @adobe/aio-cli`
13. import the adobe developer console config to project `aio app use ~/Downloads/a2b-27200-benge.json` or simular command to your downloaded workspace config
14. .env needs to be updated with values from _dot.env. Every thing in that file from `###### do not change the items in your .env above this.` down goes in your new .env that was created with the aio app use command
15. Update any of the values needed from the values in your adobe developer console. see above in readme for help on vars 
16. run the application with `aio app run -e application` or `npm run run:application`
17. Stop the running application 
18. verify actions were installed `aio rt actions list`
19. you can now run the local web app if you would like to work on it `aio app run -e dx/excshell/1` or `npm run run:excshell`

## Quick Start for Contributors

1. Install and configure
   - Node.js 20, Adobe I/O CLI (`npm i -g @adobe/aio-cli`)
   - `npm install`
   - `aio app use ~/Downloads/<your-console-config>.json` to generate `.env`
   - Copy any required values from `_dot.env` into your `.env`

2. Run locally (choose one extension)
   - Actions only: `aio app run -e application --no-serve`
   - Web only: `aio app run -e dx/excshell/1 --no-actions` (open `https://localhost:9080`)

3. Coding rules (must follow)
   - Use default logger import: `import aioLogger from '@adobe/aio-lib-core-logging'`
   - Keep actions and web separate; no Node-only imports in `src/dx-excshell-1/**`
   - TS configs are split: `tsconfig.actions.json` (Node/CommonJS) and `tsconfig.web.json` (browser/ESNext)
   - Actions webpack reads `tsconfig.actions.json` via `ts-loader` `configFile`
   - Avoid implicit `any`; type arrays and `catch (error: unknown)`
   - Put shared browser-safe types/models in `src/shared/**`

4. Docs and tests
   - All docs live under `docs/`; Cursor notes under `docs/cursor/`
   - All tests belong under the root `test/` folder

5. Deploy
   - `aio app deploy`

## 🛡️ Security

### Secret Detection

This repository uses [Gitleaks](https://github.com/gitleaks/gitleaks) for comprehensive secret detection:

```bash
# Install Gitleaks (recommended)
brew install gitleaks  # macOS
# Or download from: https://github.com/gitleaks/gitleaks/releases

# Security commands
npm run security:check          # Check current changes
npm run security:scan-history   # Scan entire git history
npm run precommit              # Full pre-commit check (security + lint + test)
```

### Critical Security Rules

**❌ NEVER commit real private keys or secrets!**

**✅ ALWAYS use this exact format for testing:**
```
-----BEGIN RSA PRIVATE KEY-----
FAKE
-----END RSA PRIVATE KEY-----
```

**For more details**: See `docs/SECURITY_GUIDELINES.md`
