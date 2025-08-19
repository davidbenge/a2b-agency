export function errorResponse(statusCode: number, message: string, logger?: any): any;
export function checkMissingRequestInputs(params: any, requiredParams: string[], requiredHeaders: string[]): string | null;
export function mergeRouterParams<T = any>(params: T): T;
export function stripOpenWhiskParams<T = any>(params: T): T;
