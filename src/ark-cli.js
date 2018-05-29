"use strict";

const cliProgram = require('commander');
const ARKNetwork = require('./network.js');
const ARKCommands = require('./ark-commands.js');
const ARKTerm = require('./ark-term.js');
const toolbox = require('./utils.js');

cliProgram.version('0.0.1');

// ARK Node API v1 /accounts/*
// Get the account information for an address
cliProgram.command('account <address>')
    .description('Get the data for <address>.')
    .option('-a, --account', 'Get account information.')
    .option('-b, --balance', 'Get the balance for this account.')
    .option('-k, --key', 'Get the public key for this account.')
    .option('-d, --delegates', 'Get the delegates for this account')
    .option('-n, --network <network>', 'The network for this address [ark|testnet]', 'ark')
    // TODO .option('--node <uri>', 'Connect directly to a node on <uri>.') /* Query the node for nethash etc */
    .option('-f, --format <format>', 'How to format the output [json|table]', 'json')
    .option('-v, --verbose', 'Show verbose logging')
    .action( (address, cmd) => {
        ARKCommands.output = {"account" : {"address": address}};
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
                let server = toolbox.getNode(node);
                console.log(`Connected to Node: ${server}`);
            }
            
            let commands = ARKCommands.prepareGetAccount(cmd.account, cmd.balance, cmd.key, cmd.delegates, address, node, verbose);
            
            // Execute the commands
            Promise.all(commands)
            .then(results => {
                toolbox.showData(ARKCommands.output, format, node);
            }).catch(error => {
                process.exitCode = 1;
                console.log(error);
            })
        });
    }
);
    

// ARK Node API v1 /blocks/*
// Get the block information
cliProgram.command('block <block>')
    .description('Get the data for <block>.')
  
// ARK Node API v1 /delegates/*
// Get the delegate information
cliProgram.command('delegate <delegate>')
    .description('Get the data for <delegate>.')
    
// Get the blockchain network information
cliProgram.command('blockchain <network>')
    .description('Get the data for the blockchain <network>.')
  
// Get the node information
cliProgram.command('node <node>')
    .description('Get the data for the <node>.')  
    
// Post a transaction
cliProgram.command('transaction')
    .description('Post a transaction to the blockchain.')  
    
// Start a terminal
// Get the node information
cliProgram.command('term')
    .description('Start an ARK terminal.') 
    .action(() => { 
        ARKTerm.start();
    }
);

module.exports = cliProgram;    