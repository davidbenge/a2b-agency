import { IAdobeProject, IEventData } from '../types/index';

/**
 * Create enhanced event data with Adobe Developer Console context
 * @param baseData - Base event data
 * @param adobeConsoleJson - Adobe Developer Console JSON data
 * @returns Enhanced event data with Adobe Developer Console context
 */
export function createEventDataWithAdobeConsole(
    baseData: any,
    adobeConsoleJson?: any
): IEventData {
    const eventData: IEventData = {
        ...baseData,
        eventTimestamp: new Date()
    };

    if (adobeConsoleJson?.project) {
        eventData.adobeProject = adobeConsoleJson.project;
        eventData.imsId = adobeConsoleJson.project.org.ims_org_id;
        eventData.imsOrgName = adobeConsoleJson.project.org.name;
        eventData.primaryWorkspaceId = adobeConsoleJson.project.workspace.id;
    }

    return eventData;
}

/**
 * Extract Adobe Developer Console project data from an event
 * @param event - Event object
 * @returns Adobe Developer Console project data or undefined
 */
export function extractAdobeProjectFromEvent(event: any): IAdobeProject | undefined {
    return event.adobeProject || event.data?.adobeProject;
}

/**
 * Check if an event has Adobe Developer Console context
 * @param event - Event object
 * @returns True if event has Adobe Developer Console context
 */
export function hasAdobeConsoleContext(event: any): boolean {
    return !!(event.adobeProject || event.data?.adobeProject);
}

/**
 * Get Adobe Developer Console runtime URL from event
 * @param event - Event object
 * @returns Runtime URL or undefined
 */
export function getAdobeRuntimeUrlFromEvent(event: any): string | undefined {
    const project = extractAdobeProjectFromEvent(event);
    return project?.workspace.action_url;
}

/**
 * Get Adobe Developer Console project ID from event
 * @param event - Event object
 * @returns Project ID or undefined
 */
export function getAdobeProjectIdFromEvent(event: any): string | undefined {
    const project = extractAdobeProjectFromEvent(event);
    return project?.id;
}

/**
 * Get Adobe Developer Console workspace ID from event
 * @param event - Event object
 * @returns Workspace ID or undefined
 */
export function getAdobeWorkspaceIdFromEvent(event: any): string | undefined {
    const project = extractAdobeProjectFromEvent(event);
    return project?.workspace.id;
}

/**
 * Get Adobe Developer Console IMS organization ID from event
 * @param event - Event object
 * @returns IMS organization ID or undefined
 */
export function getAdobeImsOrgIdFromEvent(event: any): string | undefined {
    const project = extractAdobeProjectFromEvent(event);
    return project?.org.ims_org_id;
} 