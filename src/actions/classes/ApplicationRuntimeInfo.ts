import { IApplicationRuntimeInfo } from "../types";
import { EventManager } from "./EventManager";

/**
 * ApplicationRuntimeInfo encapsulates the runtime isolation metadata
 * and provides helpers to construct and serialize it for event payloads.
 */
export class ApplicationRuntimeInfo implements IApplicationRuntimeInfo {
  consoleId: string;
  projectName: string;
  workspace: string;
  actionPackageName: string;
  app_name: string;

  constructor(params: IApplicationRuntimeInfo) {
    this.consoleId = params.consoleId;
    this.projectName = params.projectName;
    this.workspace = params.workspace;
    this.actionPackageName = params.actionPackageName;
    this.app_name = params.app_name;
  }

  /**
   * Build ApplicationRuntimeInfo from action params using existing logic.
   * Returns undefined if params do not contain a valid APPLICATION_RUNTIME_INFO.
   */
  static getApplicationRuntimeInfo(params: any): ApplicationRuntimeInfo | undefined {
    // Parse and process APPLICATION_RUNTIME_INFO if provided
    let parsed: ApplicationRuntimeInfo | undefined;
    if (params.APPLICATION_RUNTIME_INFO) {
      try {
          const runtimeInfo = JSON.parse(params.APPLICATION_RUNTIME_INFO);
          if (runtimeInfo.namespace && runtimeInfo.app_name) {
              // Split namespace into consoleId, projectName, and workspace (expected format: consoleId-projectName-workspace)
              const namespaceParts = String(runtimeInfo.namespace).split('-');
              if (namespaceParts.length >= 3) {
                  const applicationRuntimeInfo: IApplicationRuntimeInfo = {
                      consoleId: namespaceParts[0],
                      projectName: namespaceParts[1],
                      workspace: namespaceParts[2],
                      actionPackageName: runtimeInfo.action_package_name,
                      app_name: runtimeInfo.app_name
                  };
                  return new ApplicationRuntimeInfo(applicationRuntimeInfo);
              }
          }
      } catch (error) {
          console.warn('Failed to parse APPLICATION_RUNTIME_INFO:', error);
      }
    }else if( params.data && params.data.app_runtime_info ){
      return new ApplicationRuntimeInfo(params.app_runtime_info);
    }
    return undefined;
  }

  /**
   * Serialize to the exact shape we include on IoEvent.data.app_runtime_info.
   */
  serialize(): {
    consoleId: string;
    projectName: string;
    workspace: string;
    app_name: string;
    action_package_name: string;
  } {
    return {
      consoleId: this.consoleId,
      projectName: this.projectName,
      workspace: this.workspace,
      app_name: this.app_name,
      action_package_name: this.actionPackageName,
    };
  }
}


