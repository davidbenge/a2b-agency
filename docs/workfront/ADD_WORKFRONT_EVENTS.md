# Adding Workfront Events to A2B Agency

This document outlines the steps to add Workfront event handling to the A2B Agency solution.

## 1. Event Provider Setup

First, create a new event provider in Adobe I/O:

```bash
aio event provider create
# Use "A2B Workfront" as the label
```

## 2. Event Metadata Creation

Create the event metadata for each Workfront event type:

```bash
aio event eventmetadata create <provider_id>
```

Create the following events:

1. Task Created Event:
   - Label: "Workfront Task Created"
   - Code: "com.adobe.a2b.workfront.task.created"
   - Description: "Event triggered when a new task is created in Workfront"

2. Task Updated Event:
   - Label: "Workfront Task Updated"
   - Code: "com.adobe.a2b.workfront.task.updated"
   - Description: "Event triggered when a task is updated in Workfront"

3. Task Completed Event:
   - Label: "Workfront Task Completed"
   - Code: "com.adobe.a2b.workfront.task.completed"
   - Description: "Event triggered when a task is completed in Workfront"

## 3. Action Subscription

Subscribe the action to Workfront events in the Adobe Developer Console:

1. Go to the Adobe Developer Console
2. Navigate to your project
3. Find the Events section
4. Add a new subscription with:
   - Endpoint: `https://your_adobe_developer_project.adobeioruntime.net/api/v1/web/a2b-agency/workfront-event-handler`
   - Event types to subscribe to:
     - `workfront.task.created`
     - `workfront.task.updated`
     - `workfront.task.completed`

## 4. Environment Variables

Add the following environment variables to your `.env` file:

```
AIO_AGENCY_EVENTS_WORKFRONT_PROVIDER_ID=<your_provider_id>
LOG_LEVEL=info
```

## 5. Implementation Details

The Workfront event handling system consists of:

1. `WorkfrontEventHandler` class:
   - Handles different types of Workfront events
   - Uses the existing logging system
   - Publishes events to Adobe Event Hub

2. Event classes:
   - `WorkfrontTaskCreatedEvent`
   - `WorkfrontTaskUpdatedEvent`
   - `WorkfrontTaskCompletedEvent`

3. Main action handler:
   - Located at `src/actions/workfront-event-handler/index.ts`
   - Processes incoming Workfront events
   - Implements error handling and logging

## 6. Logging

The system uses `@adobe/aio-lib-core-logging` for logging with the following levels:
- ERROR: For error conditions
- WARN: For warning conditions
- INFO: For general information
- DEBUG: For detailed debugging information

Logging occurs at key points:
- Event receipt
- Event processing
- Event completion
- Error conditions

## 7. Testing

To test the implementation:

1. Deploy the action:
```bash
aio app deploy
```

2. Monitor the logs:
```bash
aio app logs
```

3. Trigger test events from Workfront to verify the system is working correctly.

## 8. Troubleshooting

If events are not being processed:

1. Check the logs for any error messages
2. Verify the event provider ID is correct
3. Confirm the action is properly subscribed to the events
4. Ensure all required environment variables are set
5. Verify the Workfront integration is properly configured 