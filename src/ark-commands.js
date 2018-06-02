"use strict";
const ARKAPI = require('./ark-api-v1.js');
const merge = require('deepmerge');
const arkjs = require('arkjs');
const arkjsnetworks = require('arkjs/lib/networks.js');
const ARKCommands = {'output':{}};

/**
 * @dev     Get the account information.
 * @param   {string}    address The address for which to get the information for.
 * @param   {string}    node The node to connect to for the account.
 * @param   {boolean}   verbose Show logs or not 
 * @return  Promise with JSON account.
 **/
async function getAccount(address, node, verbose) {
    let output = {'account':{'address': address}};
    
    try{
        output.account = await ARKAPI.getAccount(address, node);
        output.account.success = true;
    }
    catch(error){
         // error in receiving delegate 
        if(verbose){
            console.log(`Can't get Account: ${error}`);
        }
        output.account.success = false;
    }
    finally {
        return output;
    }
}

/**
 * @dev     Get the delegate voted for by an account.
 * @param   {string}    address The address for which to get the delegate for.
 * @param   {string}    node The node to connect to for the delegate.
 * @param   {boolean}   verbose Show logs or not 
 * @return  Promise with JSON Delegates.
 **/
async function accountGetDelegate(address, node, verbose) {
    let output = {'account':{'address': address, "delegate":{}}};
    try {
        output.account.delegate = await ARKAPI.accountGetDelegate(address, node);
        output.account.delegate.success = true;
    }
    catch(error){
        // error in receiving delegate 
        output.account.delegate.success = false;
        if(verbose){
            console.log(`Can't get Delegate: ${error}`);
        }
    }
    finally {
        return output;
    }
}

/**
 * @dev     Get the balance of an account.
 * @param   {string}    address The address for which to get the balance for.
 * @param   {string}    node The node to connect to for the balance.
 * @param   {boolean}   verbose Show logs or not 
 * @return  Promise with JSON Balance.
 **/
async function accountGetBalance(address, node, verbose) {
    let output = {'account':{'address': address}};
    
    try{
        let balances = await ARKAPI.accountGetBalance(address, node);
        output.account.balance = balances.hasOwnProperty('balance') ? balances.balance : "unknown";
        output.account.unconfirmedBalance = balances.hasOwnProperty('unconfirmedBalance') ? balances.unconfirmedBalance : "unknown";
        output.account.success = true;
    }
    catch(error){
         // error in receiving delegate 
        if(verbose){
            console.log(`Can't get Account balance: ${error}`);
        }
        output.account.success = false;
    }
    finally {
        return output;
    }
}

/**
 * @dev     Get the public key of an account.
 * @param   {string}    address The address for which to get the public key for.
 * @param   {string}    node The node to connect to for the public key.
 * @param   {boolean}   verbose Show logs or not 
 * @return  Promise with JSON Public key.
 **/
async function accountGetPublicKey(address, node, verbose){
    let output = {'account':{'address': address}};
    
    try {
        let publicKey = await ARKAPI.accountGetPublicKey(address, node);
        output.account.publicKey = publicKey;
        output.account.success = true;
    }
    catch(error) {
        output.account.publicKey = "";
        output.account.success = false;
    }
    finally {
        return output;
    }
}

/**
 * @dev     Get the status of a network.
 * @param   {string}    node The node to connect to.
 * @param   {boolean}   verbose Show logs or not 
 * @return  {json} with blockchain status.
 **/
async function blockchainGetStatus(node, verbose){
    let output = {'blockchain':{'status':{}}};
    
    try {
        let status = await ARKAPI.getNetworkStatusFromNode(node);
        output.blockchain.status = status;
        output.blockchain.status.success = true;
    }
    catch(error) {
        output.blockchain.status.success = false;
    }
    finally {
        return output;
    }
}

/**
 * @dev     Get the config of a network.
 * @param   {string}    node The node to connect to.
 * @param   {boolean}   verbose Show logs or not 
 * @return  {json} with blockchain status.
 **/
async function blockchainGetConfig(node, verbose){
    let output = {'blockchain':{'config':{}}};
    
    try {
        let config = await ARKAPI.getNetworkConfigFromNode(node);
        output.blockchain.config = config;
        output.blockchain.config.success = true;
    }
    catch(error) {
        output.blockchain.config.success = false;
    }
    finally {
        return output;
    }
}

/**
 * @dev     Get the fees of a network.
 * @param   {string}    node The node to connect to.
 * @param   {boolean}   verbose Show logs or not 
 * @return  {json} with blockchain status.
 **/
async function blockchainGetFees(node, verbose){
    let output = {'blockchain':{'fees':{}}};
    
    try {
        let fees = await ARKAPI.getNetworkFeesFromNode(node);
        output.blockchain.fees = fees;
        output.blockchain.fees.success = true;
    }
    catch(error) {
        output.blockchain.fees.success = false;
    }
    finally {
        return output;
    }
}

function prepareGetAccount(account, balance, key, delegate, address, node, verbose) {
    let commands = [];
            
    if(account) {
        commands.push(new Promise((resolve, reject) => {
            getAccount(address, node, verbose)
            .then((result) => {
                ARKCommands.output = merge(ARKCommands.output, result);
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
        }));
    }
            
    if(balance && !account) {
        commands.push(new Promise((resolve, reject) => {
            accountGetBalance(address, node, verbose)
            .then((result) => {
                ARKCommands.output  = merge(ARKCommands.output, result);
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
        }));
    }
            
    if(key && !account) {
        commands.push(new Promise((resolve, reject) => {
            accountGetPublicKey(address, node, verbose)
            .then((result) => {
                ARKCommands.output  = merge(ARKCommands.output, result);
                resolve();
            })
            .catch((error) => {
                reject(error);
            }); 
        }));
    }
            
    if(delegate) {
        commands.push(new Promise((resolve, reject) => {
            accountGetDelegate(address, node, verbose)
            .then((result) => {
                ARKCommands.output = merge(ARKCommands.output, result);
                resolve();
            })
            .catch((error) => {
                reject(error);
            }); 
        }));
    }
    return commands;
}

function prepareGetBlockchain(status, fees, config, node, verbose) {
    let commands = [];
            
    if(status) {
        commands.push(new Promise((resolve, reject) => {
            blockchainGetStatus(node, verbose)
            .then((result) => {
                ARKCommands.output = merge(ARKCommands.output, result);
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
        }));
    }
    
    if(fees) {
        commands.push(new Promise((resolve, reject) => {
            blockchainGetFees(node, verbose)
            .then((result) => {
                ARKCommands.output = merge(ARKCommands.output, result);
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
        }));
    }
    
    if(config) {
        commands.push(new Promise((resolve, reject) => {
            blockchainGetConfig(node, verbose)
            .then((result) => {
                ARKCommands.output = merge(ARKCommands.output, result);
                resolve();
            })
            .catch((error) => {
                reject(error);
            });
        }));
    }
    return commands;
}

function getAccountFromSeed(seed, networkVersion){
    
    arkjs.crypto.setNetworkVersion(networkVersion);

    let keys = arkjs.crypto.getKeys(seed);
    let publicKey = keys.publicKey;
    let address = arkjs.crypto.getAddress(publicKey);
    
    let account = {
        "address": address,
        "publicKey": publicKey,
        "seed": seed,
        "networkVersion": networkVersion
    };
    return account;
}

function createTransaction(sender, receiver, amount, vendorfield) {
    arkjs.crypto.setNetworkVersion(sender.networkVersion);
    let transaction = arkjs.transaction.createTransaction(receiver, amount, vendorfield, sender.seed);
    return transaction;
}

async function postToNode(transaction, node){
    return await ARKAPI.postToNode(transaction, node);
}


module.exports = ARKCommands;
module.exports.getAccount = getAccount;
module.exports.accountGetBalance = accountGetBalance;
module.exports.accountGetPublicKey = accountGetPublicKey;
module.exports.accountGetDelegates = accountGetDelegate;
module.exports.blockchainGetStatus = blockchainGetStatus;
module.exports.blockchainGetConfig = blockchainGetConfig;
module.exports.blockchainGetFees = blockchainGetFees;
module.exports.prepareGetAccount = prepareGetAccount;
module.exports.prepareGetBlockchain = prepareGetBlockchain;
module.exports.getAccountFromSeed = getAccountFromSeed;
module.exports.createTransaction = createTransaction;
module.exports.postToNode = postToNode;