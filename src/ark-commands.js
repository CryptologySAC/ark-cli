"use strict";
const ARKAPI = require('./ark-api-v1.js');
const merge = require('deepmerge');
const ARKCommands = {'output':{}};


/******** Account ********/

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
 * @dev     Get the delegates of an account.
 * @param   {string}    address The address for which to get the delegates for.
 * @param   {string}    node The node to connect to for the delegates.
 * @param   {boolean}   verbose Show logs or not 
 * @return  Promise with JSON Delegates.
 **/
async function accountGetDelegates(address, node, verbose) {
    let output = {'account':{"delegate":{}}};
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
async function accountGetBalance(address, node, verbose){
    return ARKAPI.accountGetBalance(address, node, verbose)
    .then((balance) => {
        return Promise.resolve(balance);
    }).catch((error) => {
        return Promise.reject(error);
    });
}

/**
 * @dev     Get the public key of an account.
 * @param   {string}    address The address for which to get the public key for.
 * @param   {string}    node The node to connect to for the public key.
 * @param   {boolean}   verbose Show logs or not 
 * @return  Promise with JSON Public key.
 **/
async function accountGetPublicKey(address, node, verbose){
    return ARKAPI.accountGetPublicKey(address, node, verbose)
    .then(function(publicKey) {
        return Promise.resolve(publicKey);
    }).catch(function(error) {
        return Promise.reject(error);
    });
}

function prepareGetAccount(account, balance, key, delegates, address, node, verbose) {
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
            
    if(delegates) {
        commands.push(new Promise((resolve, reject) => {
            accountGetDelegates(address, node, verbose)
            .then((result) => {
                try {
                    ARKCommands.output  = merge(ARKCommands.output, result);
                    resolve();
                }catch(error){
                    throw(error);    
                }
            })
            .catch((error) => {
                reject(error);
            }); 
        }));
    }
    return commands;
}



module.exports = ARKCommands;
module.exports.getAccount = getAccount;
module.exports.accountGetBalance = accountGetBalance;
module.exports.accountGetPublicKey = accountGetPublicKey;
module.exports.accountGetDelegates = accountGetDelegates;
module.exports.prepareGetAccount = prepareGetAccount;