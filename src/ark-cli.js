"use strict";
const ARKCLI = require('commander');
const ARKNetwork = require('./network.js');
const ARKCommands = require('./ark-commands.js');
const ARKTerm = require('./ark-term.js');
const toolbox = require('./utils.js');
const prompt = require('prompt');

ARKCLI.version('0.0.1');

// Get the account information for an address
ARKCLI.command('account <address>')
    .description('Get the account data for <address>.')
    .option('--account', 'Get the account data for this account.')
    .option('--balance', 'Get the balance for this account.')
    .option('--key', 'Get the public key for this account.')
    .option('--delegate', 'Get the delegate voted for by this account')
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

// Post a transaction to send <amount> from <sender> to <receiver>
ARKCLI.command('send <amount> <receiver>')
    .description('Post a transaction to send <amount> to <receiver>.  <amount> format examples: 10, 10.4, 10000, 10000.4')
    .option('-p, --pass <pass>', 'The passphrase for your address <"word1 word2 ...word12">. Will be prompted if not entered here.' )
    .option('-s, --smartbridge <smartbridge>', 'The information to send in the vendor field')
    .option('-n, --network <network>', 'The network to post to [mainnet|devnet]', 'mainnet')
    .option('-c, --node <node>', 'Connect directly to a node on <node>.')
    .option('-f, --format <format>', 'Specify how to format the output [json|table]', 'json')
    .option('-v, --verbose', 'Show verbose logging')
    .action((amount, receiver, cmd) => {
        let verbose = cmd.verbose ? true : false;
        let network = cmd.network ? cmd.network : 'mainnet';
        let format = cmd.format ? cmd.format : "json";
        let nodeURI = cmd.node ? cmd.node : false;
        let seed = cmd.pass ? cmd.pass.toString() : null; // it's passed as an object, but we need a string for arkjs.crypto.getkeys();
        let smartbridge = cmd.smartbridge ? cmd.smartbridge.toString() : null;
        
        try {
            amount = toolbox.inputToValue(amount);
        
        }
        catch(error) {
            console.log(error.toString());
            return;
        }
        
        // First Connect to the network
        ARKNetwork.connectBlockchain(network, nodeURI, verbose)
        .then(async node => {
            
            if(verbose) {
                let server = toolbox.getNode(node);
                console.log(`Successfully connected to node: ${server}`);
            }
                
            try {
                // Prepare transaction
                let sender = await ARKCommands.getAccountFromSeed(seed, node.network.version);
                let transaction = ARKCommands.createTransaction(sender, receiver, amount, smartbridge);
                let transactionId = await ARKCommands.postToNode(transaction, node);

                return Promise.resolve(transactionId);
            } 
            catch (error) {
                return Promise.reject(error);
            }
        })
        .then(transactionId => {
            //TODO output in json/table
            console.log(JSON.stringify(transactionId));                
            console.log(`TransactionId: ${transactionId.transactionIds[0]}`);
        })
        .catch(error => {
            console.log(error.toString());
            process.exitCode = 1;
        });
    }
);


// Get the block information
/* TODO
ARKCLI.command('block <block>')
    .description('Get the data for <block>.')
    .option('-n, --network <network>', 'The network to query [mainnet|devnet]', 'mainnet')
    .option('-c, --node <node>', 'Connect directly to a node on <node>.')
    .option('-f, --format <format>', 'Specify how to format the output [json|table]', 'json')
    .option('-v, --verbose', 'Show verbose logging')
    .action( (block, cmd) => {
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
            
            let commands = [];//ARKCommands.prepareGetBlocks(cmd.status, cmd.fees, cmd.config, node, verbose);
            
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
  
// ARK Node API v1 /delegates/*
// Get the delegate information
ARKCLI.command('delegate <delegate>')
    .description('Get the data for <delegate>.')
    .option('-n, --network <network>', 'The network to query [mainnet|devnet]', 'mainnet')
    .option('-c, --node <node>', 'Connect directly to a node on <node>.')
    .option('-f, --format <format>', 'Specify how to format the output [json|table]', 'json')
    .option('-v, --verbose', 'Show verbose logging')
    .action( (delegate, cmd) => {
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
            
            let commands = [];//ARKCommands.prepareGetDelegate(cmd.status, cmd.fees, cmd.config, node, verbose);
            
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
    
// Get the node information
ARKCLI.command('node <node>')
    .description('Get the data for the <node>.')
    .option('-n, --network <network>', 'The network to query [mainnet|devnet]', 'mainnet')
    .option('-c, --node <node>', 'Connect directly to a node on <node>.')
    .option('-f, --format <format>', 'Specify how to format the output [json|table]', 'json')
    .option('-v, --verbose', 'Show verbose logging')
    .action( (node, cmd) => {
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
            
            let commands = [];//ARKCommands.prepareGetNode(cmd.status, cmd.fees, cmd.config, node, verbose);
            
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
    
// Get transaction information
ARKCLI.command('transaction <transaction>')
    .description('Get the data for <transaction>.')
    .option('-n, --network <network>', 'The network to query [mainnet|devnet]', 'mainnet')
    .option('-c, --node <node>', 'Connect directly to a node on <node>.')
    .option('-f, --format <format>', 'Specify how to format the output [json|table]', 'json')
    .option('-v, --verbose', 'Show verbose logging')
    .action( (transaction, cmd) => {
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
            
            let commands = [];//ARKCommands.prepareGetTransaction(cmd.status, cmd.fees, cmd.config, node, verbose);
            
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
    

    
// Vote for a delegate
ARKCLI.command('vote <delegate> <from>')
    .description('Vote for a delegate.')
    .option('-n, --network <network>', 'The network to post to [mainnet|devnet]', 'mainnet')
    .option('-c, --node <node>', 'Connect directly to a node on <node>.')
    .option('-f, --format <format>', 'Specify how to format the output [json|table]', 'json')
    .option('-v, --verbose', 'Show verbose logging')

// Unvote for a delegate
ARKCLI.command('unvote <from>')
    .description('Unvote delegate.')
    .option('-n, --network <network>', 'The network to post to [mainnet|devnet]', 'mainnet')
    .option('-c, --node <node>', 'Connect directly to a node on <node>.')
    .option('-f, --format <format>', 'Specify how to format the output [json|table]', 'json')
    .option('-v, --verbose', 'Show verbose logging')

*/    
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