/**
 * onAemProcComplete
 *
 * Used to filter all events down to just the asset events we want to evaluate.
 * After filtering we set state varibles to capture the AEM asset data.  We then request a presigned url for the target aem asset.
 * The last step is we kick off a asynchronous request to get the target assets psd manifest data
 *
 * we subscribe this action to the Assets processing complete event in Adobe IO developer console.
 *
 */

import aioLogger from "@adobe/aio-lib-core-logging";
import stateLib from "@adobe/aio-lib-state";
import { errorResponse, checkMissingRequestInputs } from "../../utils/common";
const actionName = "asset-event-handler";

// main function that will be executed by Adobe I/O Runtime
async function main(params: any): Promise<any> {
  // create a Logger
  const logger = aioLogger(actionName, {level: params.LOG_LEVEL || "info"});

  try {
    // handle IO webhook challenge response
    // TODO: put in an interface and make this more pro 
    if (params.challenge) {
      const response: any = {
        statusCode: 200,
        body: { challenge: params.challenge },
      };
      return response;
    }else{
      // rest of the code if its not a challenge
      // TODO: put in an interface and make this more pro 
      // in this i am making a generic object to store the data
      let content: any = {};
      if (params.LOG_LEVEL === "debug") {
        if (typeof content.debug === "undefined") {
          content.debug = {};
          content.debug[actionName] = [];
        }
      }

      // check for missing request input parameters and headers
      const requiredParams: string[] = [];
      const requiredHeaders: string[] = [];
      const errorMessage = checkMissingRequestInputs(params,requiredParams,requiredHeaders);
      if (errorMessage) {
        return errorResponse(400, errorMessage, logger);
      }

      const response: any = {
        statusCode: 200,
        body: content,
      };
      return response;
    }
  } catch (error: unknown) {
    // log any server errors
    logger.error(error instanceof Error ? error.message : String(error));
    // return with 500
    return errorResponse(500, "server error", logger);
  }
}

export { main };