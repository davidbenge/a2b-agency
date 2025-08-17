/**
 * delete all brands
 */
import * as aioLogger from "@adobe/aio-lib-core-logging";

export async function main(params: any): Promise<any> {
  const logger = aioLogger("delete-all-brands", { level: params.LOG_LEVEL || "info" });

  try {
    
      const filesLib = require('@adobe/aio-lib-files');
      try {
          const fileStore = await filesLib.init();
          await fileStore.delete('brand/');
          logger.debug('File store initialized');

      } catch (error) {
          logger.error(`Error initializing file store: ${error}`);
          throw new Error(`Error initializing file store: ${error}`);
      }

    return {
      statusCode: 200,
      body: {
        "message": `all brands deleted successfully`,
        "data":{}
      }
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: {
        message: 'Error deleting brands',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}
