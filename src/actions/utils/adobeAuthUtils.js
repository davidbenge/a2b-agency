/* 
* <license header>
*/

/* This file exposes some common auth utils */
const fetch = require('node-fetch');
const { Core } = require('@adobe/aio-sdk');
const { errorResponse, getBearerToken, stringParameters, checkMissingRequestInputs } = require('./common');
const jwt = require('jsonwebtoken');
const auth = require("@adobe/jwt-auth");

/***
 * Get aem jwt account token
 * 
 * @param {object} authOptions - raw request parameters
 * @param {string} authOptions.client_id - client id
 * @param {string} authOptions.technical_account_id - technical account id
 * @param {string} authOptions.org_id - org id
 * @param {string} authOptions.client_secret - client secret
 * @param {string} authOptions.private_key - PrivateKey is a string (utf-8 encoded), buffer, object, or KeyObject containing either the secret for HMAC algorithms or the PEM encoded private key for RSA and ECDSA
 * @param {boolean} authOptions.private_key_base64 - private key base64 encoded
 * @param {Array<string>} authOptions.meta_scopes - meta scopes
 * @param {string} authOptions.ims_endpoint - IMS https://ims-na1.adobelogin.com
 * @param {object} params - raw request parameters
 * @param {object} logger - logger object
 * 
 * return {object} tokenResponse - token response
 * return {string} tokenResponse.access_token - access token
 * return {string} tokenResponse.token_type - token type
 * return {string} tokenResponse.expires_in - expires in
 */
async function getJwtToken(authOptions,params,logger){

  const config = {
    clientId: authOptions.client_id,
    clientSecret: authOptions.client_secret,
    technicalAccountId: authOptions.technical_account_id,
    orgId: authOptions.org_id,
    metaScopes: authOptions.meta_scopes,
    privateKey: authOptions.private_key.replace(/\\r\\n/g, '\r\n'),
  };

  //logger.debug(`authOptions: ${JSON.stringify(authOptions, null, 2)}`)  
  //logger.debug(`call config: ${JSON.stringify(config, null, 2)}`)  

  let tokenResponse = await auth(config);

  logger.debug(`tokenResponse: ${JSON.stringify(tokenResponse, null, 2)}`)
  
  return tokenResponse
}

/***
 * Get a server to server token
 * 
 * @param {string} clientId - client id
 * @param {string} clientSecret - client secret
 * @param {string} orgId - org id
 * @param {string} scopes - scopes
 * @param {object} logger - logger object
 * 
 * return {object} callResult - call result
 */     
async function getServer2ServerToken(clientId,clientSecret,orgId,scopes,logger){
  const urlencoded = new URLSearchParams();
  urlencoded.append('client_id', clientId);
  urlencoded.append('client_secret', clientSecret);
  urlencoded.append('grant_type', 'client_credentials');
  urlencoded.append('scope', scopes);

  logger.debug("getServer2ServerToken urlencoded",urlencoded.toString());

  const callConfig = {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "x-gw-ims-org-id": orgId,
    },
    body: urlencoded.toString()
  };

  //logger.debug('adobeAuthUtils callConfig:', callConfig);
  //logger.debug('adobeAuthUtils formdata:', urlencoded.toString());

  const callResult = await fetch("https://ims-na1.adobelogin.com/ims/token/v3", callConfig);

  if (!callResult.ok) {
    logger.error('adobeAuthUtils getServer2ServerToken NOT GOOD callResult:', callResult.body);
    throw new Error('adobeAuthUtils error getServer2ServerTokencallResult:', callResult.body);
  }else{
    const data = await callResult.json();
    logger.debug('adobeAuthUtils getServer2ServerToken Response:', data);

    if(data.access_token){
      return data.access_token;
    }else{
      logger.error('adobeAuthUtils getServer2ServerToken no auth token returned', data);
      throw new Error('adobeAuthUtils getServer2ServerToken no auth token returned', data);
    }
  }
}

module.exports = {
  getJwtToken,
  getServer2ServerToken
}