"use strict";
//const ARKNetwork = require('./network.js');
const toolbox = require('./utils.js');
const request = require('request-promise-native');
var ARKAPI = ()=>{};    
    
const port = 1;
const version = "1.0.0";
const timeout = 5000;

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
            nethash: node.network.nethash,
            version: version,
            port: port
        },
        timeout: timeout
    };    
    
    return ARKAPI.getFromNode(options)
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
        let noAccount = {"account": "" };
        return Promise.reject(noAccount); // Resolve instead of reject for future chaining of commands
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
            nethash: node.network.nethash,
            version: version,
            port: port
        },
        timeout: timeout
    };    
    
    return ARKAPI.getFromNode(options)
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
        let noBalance = {"balance": "" };
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
            nethash: node.network.nethash,
            version: version,
            port: port
        },
        timeout: timeout
    };    
    
    return ARKAPI.getFromNode(options)
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
        let noPublickey = {"publicKey":""}; 
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
            nethash: node.network.nethash,
            version: version,
            port: port
        },
        timeout: timeout
    };    
    
    return ARKAPI.getFromNode(options)
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
        let noDelegates = {"delegates":[]}; 
        return Promise.resolve(noDelegates);
    });
};

/**
 * @dev     Connect to an ARK node and GET request information
 * @param   {json} options Options for the GET request {uri, header{nethash, port, version}}
 * @return  Promise result with data or Promise reject with error
 */ 
ARKAPI.getFromNode = (options) => {
    
    if(!options.hasOwnProperty('uri') 
    || !options.hasOwnProperty('headers') 
    || !options.headers.hasOwnProperty('nethash')
    || !options.headers.hasOwnProperty('port')
    || !options.headers.hasOwnProperty('version')) {
        return Promise.reject('Request does not comply to ARK v1 standard.');
    }
    
    return request(options)
    .then((body) => {
       
        body = JSON.parse(body);
        if ( !body.hasOwnProperty('success') || body.success != true) {
            let error = body.hasOwnProperty('error') ? body.error : "Couldn't connect to node.";  
            return Promise.reject(`Failed: ${error}`);
        } 
        return Promise.resolve(body);
        
    }).catch(function(error){
        return Promise.reject(`Failed ${error}`);
    });
};

ARKAPI.getNetworkFromNode = ((nodeURI, verbose) => {
    let uri = `${nodeURI}/api/loader/autoconfigure`
    let options ={
        uri: uri,
        headers: {
            nethash: "none",
            version: version,
            port: port
        },
        timeout: timeout
    };
    
    return ARKAPI.getFromNode(options)
    .then(result => {
        
        if (result.hasOwnProperty('network') && result.network.hasOwnProperty('nethash')) {
            if(verbose) {
                console.log("Network information received from node.");
            }
            // Prepare result for output
            delete result.success;
            return Promise.resolve(result);
        }
        
        if(verbose) {
            console.log("Can't receive Network information from node: This node is not configured correctly.");
        }
        
        return Promise.reject(`Can't receive network information from ${nodeURI}.`);
    })
    .catch(error => {
        if(verbose) {
            console.log("Can't receive Network information from node: This is not a public node.");
        }
        return Promise.reject(`Can't connect to ${nodeURI}.`);
    });
    
});

module.exports = ARKAPI;