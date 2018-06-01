"use strict";
const ARKCLI = require('commander');
const ARKNetwork = require('./network.js');
const ARKCommands = require('./ark-commands.js');
const ARKTerm = require('./ark-term.js');
const toolbox = require('./utils.js');

ARKCLI.version('0.0.1');

// Get the account information for an address
ARKCLI.command('account <address>')
    .description('Get the account data for <address>.')
    .option('-a, --account', 'Get the account data for this account.')
    .option('-b, --balance', 'Get the balance for this account.')
    .option('-k, --key', 'Get the public key for this account.')
    .option('-d, --delegate', 'Get the delegate voted for by this account')
    .option('-n, --network <network>', 'The network to query for this account [mainnet|devnet]', 'mainnet')
    .option('-c, --node <node>', 'Connect directly to a node on <node>.')
    .option('-f, --format <format>', 'Specify how to format the output [json|table]', 'json')
    .option('-v, --verbose', 'Show verbose logging')
    .action( (address, cmd) => {
        
        let verbose = cmd.verbose ? true : false;
        let network = cmd.network ? cmd.network : 'mainnet';
        let format = cmd.format ? cmd.format : "json";
        let nodeURI = cmd.node ? cmd.node : false;
        
        // Default to getting account information.
        if (!cmd.balance && !cmd.key && !cmd.delegate) {
            cmd.account = true;
        }
        
        // First Connect to the network
        ARKNetwork.connectBlockchain(network, nodeURI, verbose)
        .then(node => {
            
            if(verbose) {
                let server = toolbox.getNode(node);
                console.log(`Successfully connected to node: ${server}`);
            }
        
            let commands = ARKCommands.prepareGetAccount(cmd.account, cmd.balance, cmd.key, cmd.delegate, address, node, verbose);
            
            // Execute the commands
            Promise.all(commands)
            .then(() => {
                toolbox.showData(ARKCommands.output, format, node);
            })
            .catch(error => {
                throw error;
            });
        })
        .catch(error => {
            process.exitCode = 1;
            console.log(error);
        });
    }
);
    

// Get the blockchain network information
ARKCLI.command('blockchain')
    .description('Get the data for blockchain <network>.')
    .option('--status', 'Get the status for this blockchain.')
    .option('--config', 'Get the configuration for this blockchain.')
    .option('--fees', 'Get the fees for this blockchain.')
    .option('-n, --network <network>', 'The network to query [mainnet|devnet]', 'mainnet')
    .option('-c, --node <node>', 'Connect directly to a node on <node>.')
    .option('-f, --format <format>', 'Specify how to format the output [json|table]', 'json')
    .option('-v, --verbose', 'Show verbose logging')
    .action(cmd => {
        let verbose = cmd.verbose ? true : false;
        let network = cmd.network ? cmd.network : 'mainnet';
        let format = cmd.format ? cmd.format : "json";
        let nodeURI = cmd.node ? cmd.node : false;
        
        // First Connect to the network
        ARKNetwork.connectBlockchain(network, nodeURI, verbose)
        .then(node => {
            
            if(verbose) {
                let server = toolbox.getNode(node);
                console.log(`Successfully connected to node: ${server}`);
            }
            
            // if no details have been specified we just get all of it
            if (!cmd.fees && !cmd.config && !cmd.status) {
                cmd.fees = true;
                cmd.config = true;
                cmd.status = true;
            }
            
            let commands = ARKCommands.prepareGetBlockchain(cmd.status, cmd.fees, cmd.config, node, verbose);
            
            // Execute the commands
            Promise.all(commands)
            .then(() => {
                toolbox.showData(ARKCommands.output, format, node);
            })
            .catch(error => {
                throw error;
            });
        })
        .catch(error => {
            process.exitCode = 1;
            console.log(error);
        });
    }
);
  

// Get the block information
ARKCLI.command('block <block>')
    .description('Get the data for <block>.');
  
// ARK Node API v1 /delegates/*
// Get the delegate information
ARKCLI.command('delegate <delegate>')
    .description('Get the data for <delegate>.');
    

// Get the node information
ARKCLI.command('node <node>')
    .description('Get the data for the <node>.');
    
// Post a transaction
ARKCLI.command('transaction')
    .description('Post a transaction to the blockchain.');  
    
// Start a terminal
// Get the node information
// TODO decide if we should split this to a separate branch
ARKCLI.command('term')
    .description('Start an ARK terminal.')
    .action(() => { 
        ARKTerm.start();
    }
);

module.exports = ARKCLI;    