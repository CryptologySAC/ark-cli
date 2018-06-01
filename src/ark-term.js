"use strict";

const ARKNetwork = require('./network.js');
const ARKCommands = require('./ark-commands.js');
const toolbox = require('./utils.js');
const vorpal = require('vorpal')();
var node = null;
var format = 'json';
var verbose = false;

var ARKTerm = () => {};

vorpal.history('ark-cli');

vorpal.command('connect <network>', 'Connect to network <network>.')
.action( (args, callback) => {
    // Reset a potential active connection
    node = null;
    let network = args.network;
    
    ARKNetwork.connectBlockchain(network, false, verbose)
    .then(connected => {
        node = connected;
        let server = toolbox.getNode(node);
        let networkName = node.network.hasOwnProperty('name') && node.network.name ? node.network.name : 'connected';
        vorpal.delimiter(`${networkName}>`).log(`Connected to Node: ${server}`);
        callback();
    })
    .catch((error) => {
        vorpal.log(error);
        callback();
    });
});

vorpal.command('node <node>', 'Connect to node <node>.')
.action( (args, callback) => {
    // Reset a potential active connection
    node = null;
    let nodeURI = args.node;
    
    ARKNetwork.connectBlockchain("none", nodeURI, verbose)
    .then(connected => {
        node = connected;
        let server = toolbox.getNode(node);
        let networkName = node.network.hasOwnProperty('name') && node.network.name ? node.network.name : nodeURI;
        vorpal.delimiter(`${networkName}>`).log(`Connected to Node: ${server}`);
        callback();
    }) 
    .catch((error) => {
        vorpal.log(error);
        callback();
    });
});

vorpal.command('disconnect', 'Disconnect from connected node.')
.action( (args, callback) => {
    let server = toolbox.getNode(node);
    server = server ? `${server} ` : '';
    node = null;
    vorpal.delimiter('ark>').log(`node ${server} disconnected.`);
    callback();
});

vorpal.command('account <address> [detail]', 'Get [detail] account information for <address>. Valid options for detail are [all|publickey|balance|delegate].')
.action((args,callback) => {
    if(node) {
        let account = false;
        let balance = false;
        let key = false;
        let delegate = false;
        switch(args.detail) {
            case 'all':
            case 'a':    
                account = true;
                delegate = true;
                break;
            case 'key':    
            case 'publickey':
            case 'k':    
                key = true;
                break;
            case 'balance':
            case 'b':    
                balance = true;
                break;
            case 'delegate':
            case 'd':    
                delegate = true;
                break;
             default:
                account=true;
                break;    
        }
        let address = args.address;
        let commands = ARKCommands.prepareGetAccount(account, balance, key, delegate, address, node, verbose);
        ARKCommands.output = {"account" : {"address": address}};
            
        // Execute the commands
        Promise.all(commands)
        .then(results => {
            toolbox.showData(ARKCommands.output, format, node);
            callback();
        })
        .catch((error) => {
            vorpal.log(error);
            callback();
        });
    } else {
        vorpal.log('Not connected to a network. Please connect to network before.');
        callback();
    }
});

vorpal.command('output <format>', 'Show output as <format>. Valid options are [json|table].')
.action( (args, callback) => {
    switch(args.format) {
        case 'table':
        case 't':    
            format = 'table';
            break;
        default:    
        case 'json':
            format = 'json';
    }
    vorpal.log('Output will be formatted as '+ format);
    callback();
});

vorpal.command('verbose [status]', 'Show verbose logging [on|off].')
.action( (args, callback) => {
    let verboseStatus = 'on';
    switch(args.status) {
        default:
        case 'on':
            verbose = true;
            break;
        case 'off':
            verbose = false;
            verboseStatus = 'off';
    }
    vorpal.log(`Verbose logging turned ${verboseStatus}.`);
    callback();
});

ARKTerm.start = () => {

    vorpal
        .delimiter('ark>')
        .show();
};
module.exports = ARKTerm;