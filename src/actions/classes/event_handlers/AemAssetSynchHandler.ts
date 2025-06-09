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

import * as stateLib from "@adobe/aio-lib-state";
import { IoEventHandler } from '../IoEventHandler';

export class AssetSynchEventHandler extends IoEventHandler {
  /*******
   * handleEvent - handle the event and see if the asset needs to be processed
   * 
   * @param event: any 
   * @returns Promise<any>
   *******/
  async handleEvent(event: any): Promise<any> {
    this.logger.info("Asset Synch Event Handler called",event);

    // todo:// look to see if we need to handle the event 
    if(event.type === 'aem.assets.asset.deleted'){
      this.logger.info("Asset deleted event",event);
    }else if(event.type === 'aem.assets.asset.metadata_updated'){
      this.logger.info("Asset metadata updated event",event);
    }else{
      this.logger.info("Asset event not handled",event);
    }

    return {
      statusCode: 200,
      body: {
        message: 'Asset event processed successfully',
      }
    }
  }
}