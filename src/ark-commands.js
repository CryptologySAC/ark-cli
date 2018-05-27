"use strict";
const ARKAPI = require('./ark-api-v1.js');
const merge = require('deepmerge');

var ARKCommands = ()=>{
};

ARKCommands.output = {};


/******** Account ********/

/**
 * @dev     Get the account information.
 * @param   {string}    address The address for which to get the information for.
 * @param   {string}    node The node to connect to for the account.
 * @param   {boolean}   verbose Show logs or not 
 * @return  Promise with JSON account.
 **/
ARKCommands.getAccount = (address, node, verbose) => {
    return ARKAPI.getAccount(address, node, verbose)
    .then((account) => {
        return Promise.resolve(account);
    }).catch((error) => {
        return Promise.reject(error);
    });
}; 

/**
 * @dev     Get the balance of an account.
 * @param   {string}    address The address for which to get the balance for.
 * @param   {string}    node The node to connect to for the balance.
 * @param   {boolean}   verbose Show logs or not 
 * @return  Promise with JSON Balance.
 **/
ARKCommands.accountGetBalance = (address, node, verbose) => {
    return ARKAPI.accountGetBalance(address, node, verbose)
    .then((balance) => {
        return Promise.resolve(balance);
    }).catch((error) => {
        return Promise.reject(error);
    });
};

/**
 * @dev     Get the public key of an account.
 * @param   {string}    address The address for which to get the public key for.
 * @param   {string}    node The node to connect to for the public key.
 * @param   {boolean}   verbose Show logs or not 
 * @return  Promise with JSON Public key.
 **/
ARKCommands.accountGetPublicKey = (address, node, verbose) => {
    return ARKAPI.accountGetPublicKey(address, node, verbose)
    .then(function(publicKey) {
        return Promise.resolve(publicKey);
    }).catch(function(error) {
        return Promise.reject(error);
    });
};

/**
 * @dev     Get the delegates of an account.
 * @param   {string}    address The address for which to get the delegates for.
 * @param   {string}    node The node to connect to for the delegates.
 * @param   {boolean}   verbose Show logs or not 
 * @return  Promise with JSON Delegates.
 **/
ARKCommands.accountGetDelegates = (address, node, verbose) => {
    return ARKAPI.accountGetDelegates(address, node, verbose)
    .then(function(delegates) {
        return Promise.resolve(delegates);
    }).catch(function(error) {
        return Promise.reject(error);
    });
};

ARKCommands.prepareGetAccount = (account, balance, key, delegates, address, node, verbose) => {
    let commands = [];
            
    if(account) {
        commands.push(new Promise((resolve, reject) => {
            ARKCommands.getAccount(address, node, verbose)
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
            ARKCommands.accountGetBalance(address, node, verbose)
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
            ARKCommands.accountGetPublicKey(address, node, verbose)
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
            ARKCommands.accountGetDelegates(address, node, verbose)
            .then((result) => {
                ARKCommands.output  = merge(ARKCommands.output, result);
                resolve();
            })
            .catch((error) => {
                reject(error);
            }); 
        }));
    }
    return commands;
};

module.exports = ARKCommands;