import { EventCategoryValue } from '../constants';

/**
 * Logger interface that works with both Node (aioLogger) and browser (console)
 */
export interface Logger {
    info(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    debug?(message: string, ...args: any[]): void;
}

export interface EventDefinition {
    code: string;
    category: EventCategoryValue;
    name: string;
    description: string;
    eventClass: string;
    version: string;
    eventBodyexample: any;
    routingRules: string[];
    requiredFields: string[];
    optionalFields?: string[];
}