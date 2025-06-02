# a2b Agency Application 

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
benge app project in TMD dev org: a2b-27200-benge 
title: agency to brand

endpoints 
https://27200-a2b-benge.adobeioruntime.net/api/v1/web/test-debugger/asset-event-handler
https://27200-a2b-benge.adobeioruntime.net/api/v1/web/a2b-agency/new-brand-registration
https://27200-a2b-benge.adobeioruntime.net/api/v1/web/a2b-agency/get-brands

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
