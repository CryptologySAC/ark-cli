"use strict";

var cliProgram = require("commander");
var ARKNetwork = require("./network.js");
var ARKCommands = require("./ark-commands.js");
var merge = require('deepmerge');

cliProgram.version('0.0.1');

// Get the balance for an address
cliProgram.command('account <address>')
    .description('Get the data for <address>.')
    .option('-a, --account', 'Get the account information. ')
    .option('-b, --balance', 'Get the balance for this account.')
    .option('-k, --key', 'Get the public key for this account.')
    .option('-d, --delegates', 'Get the delegates for this account')
    .option('-n, --network <network>', 'The network for this address [ark|testnet]', 'ark')
    .option('-f, --format <format>', 'How to format the output [json|table]', 'json')
    .option('-v, --verbose', 'Show verbose logging')
    .action( function(address, cmd){
        let output = {"account" : {"address": address}};
        let verbose = cmd.verbose ? true : false;
        let network = cmd.network ? cmd.network : 'ark';
        let format = cmd.format ? cmd.format : "json";
        
        // Default to getting account information.
        if (!cmd.balance && !cmd.key && !cmd.delegates) {
            cmd.account = true;
        }
        
        // First Connect to the network
        ARKNetwork.connect(network, verbose).then(node => {
            if(verbose) {
                console.log('Connected to Node: '+node.ip + ':' + node.port);
            }
        
            let commands = [];
            
            if(cmd.account) {
                commands.push(new Promise((resolve, reject) => {
                    ARKCommands.getAccount(address, node, verbose)
                    .then((result) => {
                        output = merge(output, result);
                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    });
                }));
            }
            
            if(cmd.balance && !cmd.account) {
                commands.push(new Promise((resolve, reject) => {
                    ARKCommands.accountGetBalance(address, node, verbose)
                    .then((result) => {
                        output  = merge(output, result);
                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    });
                }));
            }
            
            if(cmd.key && !cmd.account) {
                commands.push(new Promise((resolve, reject) => {
                    ARKCommands.accountGetPublicKey(address, node, verbose)
                    .then((result) => {
                        output  = merge(output, result);
                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    }); 
                }));
            }
            
            if(cmd.delegates) {
                commands.push(new Promise((resolve, reject) => {
                    ARKCommands.accountGetDelegates(address, node, verbose)
                    .then((result) => {
                        output  = merge(output, result);
                        resolve();
                    })
                    .catch((error) => {
                        reject(error);
                    }); 
                }));
            }
            
            // Execute the commands
            Promise.all(commands)
            .then(results => {
                showData(output, format);
            }).catch(error => {
                process.exitCode = 1;
                console.log(error);
            })
        });
    }
);
    

/**
 * @dev Format the output and show it on the CLI.
 * @param {JSON} data The data to format.
 * @param {string} format How to format the output.
 **/
function showData(data, format) {
    format = format.toLowerCase().trim();
    switch(format) {
        case 'table':
            
            break;
        default:
            console.log(JSON.stringify(data));
    }
}

module.exports = cliProgram;    