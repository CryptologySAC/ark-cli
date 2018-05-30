"use strict";
var Table = require('ascii-table');

var toolbox = () => {};

toolbox.getNode = (node) => {
    if(node) {
        let protocol = node.protocol ? node.protocol : 'http://';
        return `${protocol}${node.ip}:${node.port}`;
    } 
    return null;
}

/**
 * @dev Format the output and show it on the CLI.
 * @param {JSON} data The data to format.
 * @param {string} format How to format the output.
 **/
toolbox.showData = (data, format, node) => {
    format = format.toLowerCase().trim();
    switch(format) {
        case 'table':
            if (data.hasOwnProperty('account')) {
                let accountTable = accountData(data, node);
                console.log(accountTable.toString());
                
            }
            
            break;
        default:
            console.log(JSON.stringify(data));
    }
}

function accountData(data, node) {
    let table = new Table('Account');
    let symbol = '';
  
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
            table.addRow(item, "" + data.account[item]);
        }
    }
    if(data.hasOwnProperty('delegates' ) && data.delegates.hasOwnProperty('username')) {
        table.addRow('delegate', data.delegates[0].username);
    }
    
    return table;
    
}

function formatBalance(amount, symbol) {
    let balance = amount / 100000000;
    return symbol + balance;
} 

module.exports = toolbox;