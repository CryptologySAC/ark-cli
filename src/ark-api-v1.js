"use strict";
const ARKNetwork = require('./network.js');
const toolbox = require('./utils.js');
var ARKAPI = ()=>{};    
    
const port = 1;
const version = "1.0.0";
const timeout = 1000;

/******** Account ********/

/*
 * @dev     Get the information of an account.
 * @param   {string}    address The address for which to get the information for.
 * @param   {json}      node    The node to poll for the information.
 * @param   {boolean}   verbose Show logs or not 
 * @return  Promise.resolve() with JSON account.
 */
ARKAPI.getAccount = (address, node, verbose) => {
    let server = toolbox.getNode(node);
    let command = "/api/accounts?address=";
    
    let uri = server + command + address;
    let options = {
        uri: uri,
        headers: {
            nethash: node.nethash,
            version: version,
            port: port
        },
        timeout: timeout
    };    
    
    return ARKNetwork.getFromNodeV1(options)
    .then((result) => {
        if(verbose) {
            console.log("Account information received from node.");
        }
        
        // Prepare result for output
        delete result.success;
        return Promise.resolve(result);
    })
    .catch(function(error){
        if(verbose) {
            console.log(error);
        }
        let noAccount = {"account": error };
        return Promise.resolve(noAccount); // Resolve instead of reject for future chaining of commands
    });
}

/*
 * @dev     Get the balance of an account.
 * @param   {string}    address The address for which to get the balance for.
 * @param   {json}      node    The node to poll for the balance.
 * @param   {boolean}   verbose Show logs or not 
 * @return  Promise.resolve() with JSON Balance.
 */
ARKAPI.accountGetBalance = (address, node, verbose) => {
    let server = toolbox.getNode(node);
    let command = "/api/accounts/getBalance?address=";
    let uri = server + command + address;
    let options = {
        uri: uri,
        headers: {
            nethash: node.nethash,
            version: version,
            port: port
        },
        timeout: timeout
    };    
    
    return ARKNetwork.getFromNodeV1(options)
    .then((result) => {
        if(verbose) {
            console.log("Balance received from node.");
        }
        
        // Prepare result for output
        delete result.success;
        result = {"account" : result};
        return Promise.resolve(result);
    }).catch((error) => {
        if(verbose) {
            console.log(error);
        }
        let noBalance = {"balance": error };
        return Promise.resolve(noBalance); // Resolve instead of reject for chaining of commands
    });
}


/*
 * @dev     Get the public key of an account.
 * @param   {string}    address The address for which to get the public key for.
 * @param   {json}      node    The node to poll for the balance.
 * @param   {boolean}   verbose Show logs or not 
 * @return  Promise.resolve() with JSON Balance.
 */
ARKAPI.accountGetPublicKey = (address, node, verbose) => {
    let server = toolbox.getNode(node);
    let command = "/api/accounts/getPublickey?address=";
    let uri = server + command + address;
    let options = {
        uri: uri,
        headers: {
            nethash: node.nethash,
            version: version,
            port: port
        },
        timeout: timeout
    };    
    
    return ARKNetwork.getFromNodeV1(options)
    .then((result) => {
        if(verbose) {
            console.log("Public key received from node.");
        }
        
        // Prepare result for output
        delete result.success;
        result = {"account" : result};
        return Promise.resolve(result);
    }).catch((error) => {
        if(verbose) {
            console.log(error);
        }
        let noPublickey = {"publicKey":error}; 
        return Promise.resolve(noPublickey);
    });
};

/*
 * @dev     Get the delegates of an account.
 * @param   {string}    address The address for which to get the delegatesfor.
 * @param   {json}      node    The node to poll for the delegates.
 * @param   {boolean}   verbose Show logs or not 
 * @return  Promise.resolve() with JSON Delegates.
 */
ARKAPI.accountGetDelegates = (address, node, verbose) => {
    let server = toolbox.getNode(node);
    let command = "/api/accounts/delegates?address=";
    let uri = server + command + address;
    let options = {
        uri: uri,
        headers: {
            nethash: node.nethash,
            version: version,
            port: port
        },
        timeout: timeout
    };    
    
    return ARKNetwork.getFromNodeV1(options)
    .then((result) => {
        if(verbose) {
            console.log("Delegates received from node.");
        }
        
        // Prepare result for output
        delete result.success;
        return Promise.resolve(result);
    }).catch((error) => {
        if(verbose) {
            console.log(error);
        }
        let noDelegates = {"delegates":error}; 
        return Promise.resolve(noDelegates);
    });
};

module.exports = ARKAPI;