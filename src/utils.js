"use strict";
var toolbox = () => {};

toolbox.getNode = (node) => {
    if(node) {
        let protocol = node.protocol ? node.protocol : 'http://';
        return protocol + node.ip + ':' + node.port;
    } 
    return null;
}

/**
 * @dev Format the output and show it on the CLI.
 * @param {JSON} data The data to format.
 * @param {string} format How to format the output.
 **/
toolbox.showData = (data, format) => {
    format = format.toLowerCase().trim();
    switch(format) {
        case 'table':
            
            break;
        default:
            console.log(JSON.stringify(data));
    }
}
module.exports = toolbox;