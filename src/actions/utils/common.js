/*
* <license header>
*/
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
/* This file exposes some common utilities for your actions */
/**
 *
 * Returns a log ready string of the action input parameters.
 * The `Authorization` header content will be replaced by '<hidden>'.
 *
 * @param {object} params action input parameters.
 *
 * @returns {string}
 *
 */
function stringParameters(params) {
    // hide authorization token without overriding params
    var headers = params.__ow_headers || {};
    if (headers.authorization) {
        headers = __assign(__assign({}, headers), { authorization: '<hidden>' });
    }
    return JSON.stringify(__assign(__assign({}, params), { __ow_headers: headers }));
}
/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} obj object to check.
 * @param {array} required list of required keys.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'
 *
 * @returns {array}
 * @private
 */
function getMissingKeys(obj, required) {
    return required.filter(function (r) {
        var splits = r.split('.');
        var last = splits[splits.length - 1];
        var traverse = splits.slice(0, -1).reduce(function (tObj, split) { tObj = (tObj[split] || {}); return tObj; }, obj);
        return traverse[last] === undefined || traverse[last] === ''; // missing default params are empty string
    });
}
/**
 *
 * Returns the list of missing keys giving an object and its required keys.
 * A parameter is missing if its value is undefined or ''.
 * A value of 0 or null is not considered as missing.
 *
 * @param {object} params action input parameters.
 * @param {array} requiredHeaders list of required input headers.
 * @param {array} requiredParams list of required input parameters.
 *        Each element can be multi level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'.
 *
 * @returns {string} if the return value is not null, then it holds an error message describing the missing inputs.
 *
 */
function checkMissingRequestInputs(params, requiredParams, requiredHeaders) {
    if (requiredParams === void 0) { requiredParams = []; }
    if (requiredHeaders === void 0) { requiredHeaders = []; }
    var errorMessage = null;
    // input headers are always lowercase
    requiredHeaders = requiredHeaders.map(function (h) { return h.toLowerCase(); });
    // check for missing headers
    var missingHeaders = getMissingKeys(params.__ow_headers || {}, requiredHeaders);
    if (missingHeaders.length > 0) {
        errorMessage = "missing header(s) '".concat(missingHeaders, "'");
    }
    // check for missing parameters
    var missingParams = getMissingKeys(params, requiredParams);
    if (missingParams.length > 0) {
        if (errorMessage) {
            errorMessage += ' and ';
        }
        else {
            errorMessage = '';
        }
        errorMessage += "missing parameter(s) '".concat(missingParams, "'");
    }
    return errorMessage;
}
/**
 *
 * Extracts the bearer token string from the Authorization header in the request parameters.
 *
 * @param {object} params action input parameters.
 *
 * @returns {string|undefined} the token string or undefined if not set in request headers.
 *
 */
function getBearerToken(params) {
    if (params.__ow_headers &&
        params.__ow_headers.authorization &&
        params.__ow_headers.authorization.startsWith('Bearer ')) {
        return params.__ow_headers.authorization.substring('Bearer '.length);
    }
    return undefined;
}
/**
 *
 * Returns an error response object and attempts to log.info the status code and error message
 *
 * @param {number} statusCode the error status code.
 *        e.g. 400
 * @param {string} message the error message.
 *        e.g. 'missing xyz parameter'
 * @param {*} [logger] an optional logger instance object with an `info` method
 *        e.g. `new require('@adobe/aio-sdk').Core.Logger('name')`
 *
 * @returns {object} the error object, ready to be returned from the action main's function.
 *
 */
function errorResponse(statusCode, message, logger) {
    if (logger && typeof logger.info === 'function') {
        logger.info("".concat(statusCode, ": ").concat(message));
    }
    return {
        error: {
            statusCode: statusCode,
            body: {
                error: message
            }
        }
    };
}
/**
 * Set default content
 *
 */
function contentInit(params) {
    var content = {
        "message": "success",
        "status": "ok"
    };
    /*
    if(typeof params.debug !== 'undefined'){
      content.debug = params.debug
    }
  
    if(typeof params.aemHost !== 'undefined'){
      content.aemHost = params.aemHost
    }
  
    if(typeof params.aemAssetPath !== 'undefined'){
      content.aemAssetPath = params.aemAssetPath
    }
  
    if(typeof params.manifest !== 'undefined'){
      content.manifest = params.manifest
    }
  
    if(typeof params.aemHost !== 'undefined'){
      content.aemHost = params.aemHost
    }
  
    if(typeof params.aemHost !== 'undefined'){
      content.aemHost = params.aemHost
    }
  
    if(typeof params.modules !== 'undefined'){
      content.modules = params.modules
    }
  
    if(typeof params.artboardCount !== 'undefined'){
      content.artboardCount = params.artboardCount
    }
    */
    return content;
}
module.exports = {
    errorResponse: errorResponse,
    getBearerToken: getBearerToken,
    stringParameters: stringParameters,
    checkMissingRequestInputs: checkMissingRequestInputs,
    contentInit: contentInit
};
