"use strict";
const toolbox = require('./utils.js');
const request = require('request-promise-native');

const timeout = 8000;

/******** Account ********/

/*
 * @dev     Get the information of an account.
 * @param   {string}    address The address for which to get the information for.
 * @param   {json}      node    The node to poll for the information.
 * @param   {boolean}   verbose Show logs or not 
 * @return  {json} account
 */
async function getAccount(address, node) {
    let command = `/api/accounts?address=${address}`;
    let options = prepareRequestOptions(node, command);
    
    try {
        let results = await getFromNode(options);
        if (!results.hasOwnProperty('account')) {
            throw "No account received from node.";
        }
        return results.account;
    }
    catch(error){
       throw error;
    }
}

/*
 * @dev     Get the delegates of an account.
 * @param   {string}    address The address for which to get the delegatesfor.
 * @param   {json}      node    The node to poll for the delegates.
 * @param   {boolean}   verbose Show logs or not 
 * @return  Promise.resolve() with JSON Delegates.
 */
async function accountGetDelegate(address, node){
    let command = `/api/accounts/delegates?address=${address}`;
    let options = prepareRequestOptions(node, command); 
    
    try {
        let result = await getFromNode(options);
        let delegate = {'username':"-"};
        
        // Prepare result for output
        if(result.hasOwnProperty('delegates') 
        && result.delegates.length 
        && result.delegates[0].hasOwnProperty('username')) 
        {
            delegate.username = result.delegates[0].username;
        }
        return delegate;
    }
    catch(error) {
        throw error;
    }
}

/*
 * @dev     Get the balance of an account.
 * @param   {string}    address The address for which to get the balance for.
 * @param   {json}      node    The node to poll for the balance.
 * @param   {boolean}   verbose Show logs or not 
 * @return  Promise.resolve() with JSON Balance.
 */
async function accountGetBalance (address, node){
    let command = `/api/accounts/getBalance?address=${address}`;
    let options = prepareRequestOptions(node, command);  
    
    try{
        let balance = await getFromNode(options);
       
        
        // Prepare result for output
        return Promise.resolve(balance);
    }
    catch(error){
        
        let noBalance = {"balance": "" };
        return Promise.resolve(noBalance); // Resolve instead of reject for chaining of commands
    }
}


/*
 * @dev     Get the public key of an account.
 * @param   {string}    address The address for which to get the public key for.
 * @param   {json}      node    The node to poll for the balance.
 * @param   {boolean}   verbose Show logs or not 
 * @return  Promise.resolve() with JSON Balance.
 */
async function accountGetPublicKey(address, node) {
    let command = `/api/accounts/getPublickey?address=${address}`;
    let options = prepareRequestOptions(node, command);  
       
    
    return getFromNode(options)
    .then((result) => {
        
        // Prepare result for output
        delete result.success;
        result = result.hasOwnProperty('publicKey') ? result.publicKey : "";
        return result;
    }).catch((error) => {
        
        throw error;
    });
}



/**
 * @dev     Connect to an ARK node and GET request information
 * @param   {json} options Options for the GET request {uri, header{nethash, port, version}}
 * @return  Promise result with data or Promise reject with error
 */ 
async function getFromNode(options) {
    
    if(!options.hasOwnProperty('uri') 
    || !options.hasOwnProperty('headers') 
    || !options.headers.hasOwnProperty('nethash')
    || !options.headers.hasOwnProperty('port')
    || !options.headers.hasOwnProperty('version')) 
    {
        throw 'Request does not comply to ARK v1 standard.';
    }
    
    try {
        let body = await request(options);
        body = JSON.parse(body);
        if ( !body.hasOwnProperty('success') || body.success != true) {
            let error = body.hasOwnProperty('error') && body.error ? body.error : "Couldn't retrieve from node.";  
            throw error;
        } 
        return body;
    } 
    catch(error){
        throw error;
    }
};

async function getNetworkConfigFromNode(node) {
    let command = '/api/loader/autoconfigure';
    let options = prepareRequestOptions(node, command);  
    
    try {
        let result = await getFromNode(options)
        
        if (result.hasOwnProperty('network') 
        && result.network.hasOwnProperty('nethash')
        && result.network.nethash )
        {
            return result.network;
        }
        
        throw `Failed to receive network configuration from ${node.network.protocol}://${node.network.ip}:${node.network.port}.`;
    }
    catch(error) {
        throw error;
    }
}

async function getActiveNodes(network) {
    let command = "/api/peers";
    let options = prepareRequestOptions(network.peers[0], command);
    
    try {
        return await getFromNode(options);
    }
    catch(error) {
        throw error;
    }
}

function prepareRequestOptions(node, command) {
    let server  = toolbox.getNode(node);
    let uri     = server + command;
    let nethash = node.hasOwnProperty('network') && node.network.hasOwnProperty('nethash') && node.network.nethash ? node.network.nethash : "none";
    let port    = node.hasOwnProperty('port') && node.port ? node.port : 1;
    let version = node.hasOwnProperty('version') && node.version ? node.version : "1.0.0";
    return {
        uri: uri,
        headers: {
            nethash: nethash,
            version: version,
            port: port
        },
        timeout: timeout
    };    
}


module.exports.getAccount = getAccount;
module.exports.getFromNode = getFromNode;
module.exports.accountGetBalance = accountGetBalance;
module.exports.getNetworkConfigFromNode = getNetworkConfigFromNode;
module.exports.accountGetPublicKey = accountGetPublicKey;
module.exports.accountGetDelegate = accountGetDelegate;
module.exports.getActiveNodes = getActiveNodes;