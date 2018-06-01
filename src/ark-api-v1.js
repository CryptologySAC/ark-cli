"use strict";
const toolbox = require('./utils.js');
const request = require('request-promise-native');
const timeout = 8000; // 8 Seconds timeout, more symbolic than reasoned. Node to be polled has been succesfully connected to already.

/*
 * @dev     Returns account information of an address
 * @param   {string}address The address for which to get the information for.
 * @param   {json}  node    The node to poll for the information.
 * @return  {json}  account
 */
async function getAccount(address, node){
    let command = `/api/accounts?address=${address}`;
    let options = prepareRequestOptions(node, command);
    
    try {
        let results = await getFromNode(options);
        if (!results.hasOwnProperty('account')) {
            throw "No account information received from node.";
        }
        return results.account;
    }
    catch(error){
       throw error;
    }
}

/*
 * @dev     Get the delegate voted for by an account.
 * @param   {string}address The address for which to get the voted delegate for.
 * @param   {json}  node    The node to poll for the delegate.
 * @return  {json}  Delegate username.
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
 * @param   {string}address The address for which to get the balance for.
 * @param   {json}  node    The node to poll for the balance.
 * @return  {json}  with Balance.
 */
async function accountGetBalance (address, node){
    let command = `/api/accounts/getBalance?address=${address}`;
    let options = prepareRequestOptions(node, command);  
    
    try {
        let results = await getFromNode(options);
        if (!results.hasOwnProperty('balance') && !results.hasOwnProperty('unconfirmedBalance')) {
            throw "No balance information received from node.";
        }
        return results;
    }
    catch(error){
       throw error;
    }
}

/*
 * @dev     Get the public key of an account.
 * @param   {string}address The address for which to get the public key for.
 * @param   {json}  node    The node to poll for the public key.
 * @return  {string} with public key.
 */
async function accountGetPublicKey(address, node) {
    let command = `/api/accounts/getPublickey?address=${address}`;
    let options = prepareRequestOptions(node, command);  
       
    try {
        let result = await getFromNode(options);
    
        result = result.hasOwnProperty('publicKey') ? result.publicKey : "";
        return result;
    }
    catch(error) {
        throw error;
    }
}

/**
 * @dev     Connect to an ARK node and GET request information
 * @param   {json} options Options for the GET request {uri, header{nethash, port, version}}
 * @return  {json} result with requested data.
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
        delete body.success;
        return body;
    } 
    catch(error){
        throw error;
    }
}

/**
 * @dev Return the configuration of the network
 * @param {json} node The node to poll for the data.
 * @return {json} with network configuration.
 */ 
async function getNetworkConfigFromNode(node) {
    let command = '/api/loader/autoconfigure';
    let options = prepareRequestOptions(node, command);  
    
    try {
        let result = await getFromNode(options);
        
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

/**
 * @dev Return the active nodes that are known to the peer that is polled.
 * @param {json} network The seed peers to poll.
 * @return {json} List of known nodes.
 */ 
async function getActiveNodes(network) {
    let command = "/api/peers";
    let options = prepareRequestOptions(network.peers[0], command);
    
    try {
        let nodes = await getFromNode(options);
        if(!nodes.hasOwnProperty('peers') || !nodes.peers.length) {
            throw "No active nodes received from this peer";
        }
        return nodes;
    }
    catch(error) {
        throw error;
    }
}

/**
 * @dev Create a valid json object that defines a GET request
 */ 
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