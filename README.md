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

"label": "Brand Registration Enabled"
"code" : "com.adobe.a2b.registration.enabled"
"description" : "when an admin approves a brand registration this event is thrown"

"label": "Brand Registration Disabled"
"code" : "com.adobe.a2b.registration.disabled"
"description" : "when an admin disableds a brand registration this event is thrown"

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
"label": "Asset "
"code" : "com.adobe.a2b.assetsynch.delete"
"description": "Asset that has been synched before has been deleted"
todo: event body

These events will be published to the BRAND and also echo'ed localy for secondary in house systems use

### Asset Synch Setup
Using the AEM Assets Author API subscribe `https://your_adobe_developer_project.adobeioruntime.net/api/v1/web/a2b-agency/assetsynch-event-handler` to the following events. This is done in the Adobe Developer Console. [See setup documentation](https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/aem-apis/openapis/setup)
Asset deleted event - aem.assets.asset.deleted
Asset metadata updated event - aem.assets.asset.metadata_updated




