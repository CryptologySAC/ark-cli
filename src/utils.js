"use strict";
const Table = require('ascii-table');

function getNode(node) {
    let uri = "https://node1.arknet.cloud:4001";
    if(node) {
        let port    = node.hasOwnProperty('port') && node.port ? node.port : 4001;
        let protocol= node.protocol && node.protocol ? node.protocol : 'http://';
        let ip      = node.hasOwnProperty('ip') && node.ip ? node.ip : 'node1.arknet.cloud';
        uri         = `${protocol}${ip}:${port}`;
    } 
    return uri;
}

/**
 * @dev Format the output and show it on the CLI.
 * @param {JSON} data The data to format.
 * @param {string} format How to format the output.
 **/
function showData(data, format, node) {
    format = format.toLowerCase().trim();
    switch(format) {
        case 'table':
            if (data.hasOwnProperty('account')) {
                let accountTable = getAccountTable(data, node);
                console.log(accountTable.toString());
                
            }
            // TODO add othertables for blocks, etc
            break;
        default:
            console.log(JSON.stringify(data));
    }
}

function getAccountTable(data, node) {
    let table = new Table('Account');
    let symbol = '';
  
    if(data.account.hasOwnProperty('success') && !data.account.success) {
        table.setTitle("Error retrieving account.") ;   
    }
    
    if(node && node.hasOwnProperty('network')) {
        symbol = node.network.hasOwnProperty('symbol') ?  `${node.network.symbol} ` : '';
    }
    
    if(data.account.hasOwnProperty('balance')) {
        data.account.balance = formatBalance(data.account.balance, symbol);
    }
    
    if(data.account.hasOwnProperty('unconfirmedBalance')) {
        data.account.unconfirmedBalance = formatBalance(data.account.unconfirmedBalance, symbol);
    }
    
    for(let item in data.account) {
        if (data.account[item] && data.account[item].length) {
            table.addRow(item, data.account[item]);
        }
    }
    
    if(data.account.hasOwnProperty('delegate' )) {
        if (data.account.delegate.hasOwnProperty('success') && !data.account.delegate.success ) {
            table.addRow('delegate', "Error retrieving delegate");    
        }
        
        else if (data.account.delegate.hasOwnProperty('username')) {
            table.addRow('delegate', data.account.delegate.username);
        }
    }
    
    return table;
}

function formatBalance(amount, symbol) {
    let balance = amount / 100000000;
    return symbol + balance;
} 

module.exports.showData = showData;
module.exports.getNode = getNode;