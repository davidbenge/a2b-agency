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
    const parsed = EventManager.getApplicationRuntimeInfo(params);
    if (!parsed) return undefined;
    return new ApplicationRuntimeInfo(parsed);
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


