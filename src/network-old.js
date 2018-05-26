"use strict";

var arkjs = require("arkjs");
var arkjsnetworks = require("arkjs/lib/networks.js");
var request = require('request-promise-native');

var ARKNetwork = function(){};
    
ARKNetwork.getFromNodeV1 = function(options){
    
    return request(options).then(function(body){
       
        body = JSON.parse(body);
        if ( !body.hasOwnProperty('success') || body.success === false) {
            return Promise.reject("Failed: " + body.error);
        } 
        return Promise.resolve(body);
        
    }).catch(function(error){
        return Promise.reject(error);
    });
};

ARKNetwork.connect = function(network, verbose) {
    let selectedNetwork = arkjsnetworks[network];
    
    if (!selectedNetwork) {
        return Promise.reject("Can't connect to " +network + ": Network not found.");
    }
        
    if(verbose) {
        console.log('Connecting to '+ selectedNetwork.name);  
    }
  
    return findPeer(selectedNetwork, verbose).then(function(peer) {
        return Promise.resolve(peer);
    })
    .catch(function(error){
        return Promise.reject(error);
    });
};

/**
 * @dev     Return the stats for network <network>
 * @param   {string} network The network to get the stats from
 * @param   {boolean} verbose Show logs or not.
 * @return  network stats
 */ 
ARKNetwork.netstats = function(network, verbose) {
        
    connect(network, verbose).then(function(node) {
        console.log('Do the netstats thing on node: ' +node.ip+":"+node.port);
    })
    .catch(function(error){
        console.log(error);
    });
    
};

/**
 * @dev     Return the status for address <address> on network <network>
 * @param   {string} network The network to get the account status from
 * @param   {string} account The account to get the status off
 * @param   {string} format How toformat the output
 * @param   {boolean} verbose Show logs or not.
 * @return  account status
 */ 
ARKNetwork.accountStatus = function(network, address, format, verbose) {
        
    connect(network, verbose).then(function(node) {
        return getAccountStatus(address, node, format, verbose).then(function(account) {
            showAccountStatus(account, format);
            return Promise.resolve();
        }).catch(function(error) {
            return Promise.reject(error);
        });
    })
    .catch(function(error){
        console.log(error);
    });
};

function showAccountStatus(account,format) {
     switch(format) {
        case 'pretty':
            
            break;
        default:
            console.log(JSON.stringify(account));
    }
    
    
}

function getAccountStatus(address, node, verbose) {
    if (verbose) { console.log("Retrieving account status.");}
    let url = 'http://' + node.ip+":"+node.port + '/api/accounts?address=' + address;
    let options = {
        uri: url,
        headers: {
            nethash: node.nethash,
            version: '1.0.0',
            port:1
        },
        timeout: 1000
    };   
    return getFromNode(url, options).then(function(result) {
       
       return getDelegate(result.account, node, verbose)
      
    }).catch(function(error) {
        return Promise.reject(error);
    });
}

function getDelegate(account, node, verbose) {
    if(verbose) { console.log("Retrieving vote status"); }
    let url = 'http://' + node.ip+":"+node.port + '/api/accounts/delegates?address='+account.address;
    let options = {
        uri: url,
        headers: {
            nethash: node.nethash,
            version: '1.0.0',
            port: node.port,
        },
        timeout: 1000
    }; 
    return getFromNode(url, options).then(function(delegate){
        account.delegate = delegate.delegates[0].username;
        console.log("Delegate: "+JSON.stringify(delegate.delegates[0]));
        return Promise.resolve(account);
        
    }).catch(function(error){
        // No delegate was found, but we still have valid account information
        console.log(error);
        return Promise.resolve(account);
    });
    
}

function connect(network, verbose) {
    let selectedNetwork = arkjsnetworks[network];
    
    if (!selectedNetwork) {
        return Promise.reject("Can't connect to " +network + ": Network not found.");
    }
        
    if(verbose) {
        console.log('Connecting to '+ selectedNetwork.name);  
    }
  
    return findPeer(selectedNetwork, verbose).then(function(peer) {
        return Promise.resolve(peer);
    })
    .catch(function(error){
        return Promise.reject(error);
    });
}

function findPeer(network, verbose) {
    
    let server = network.peers[Math.floor(Math.random()*1000)%network.peers.length];
    server = server.ip + ":" + server.port;
    
    let url = 'http://' + server + '/api/peers';
    if(verbose){console.log("Trying Node: "+server);}
    
    let options = {
        uri: url,
        headers: {
            nethash: network.nethash,
            version: '1.0.0',
            port:1
        },
        timeout: 1000
    }; 
    return getFromNode(url, options).then(function(peerList) {
        
        // Select all peers that have a OK status and return the peer with the heighest block.
        let sortedPeers = peerList.peers;
        sortedPeers = sortedPeers.map(function(peer){
            if (peer.status==="OK") {
                peer.nethash = network.nethash;
                if(verbose) {
                    console.log("Node found: " + peer.ip + ":" + peer.port + ", height: " + peer.height + ", delay: " + peer.delay);
                }
                return peer;
            }
        });
        
        if (sortedPeers.length === 0) {
            return Promise.reject("Error sorting peers.");
        }
        // Sort Nodes by height and delay
        sortedPeers.sort((a, b) => parseInt(b.height, 10) - parseInt(a.height, 10) || parseInt(a.delay, 10) - parseInt(b.delay,10));
        
        // Test if the selected node actually works
        let url = "http://" + sortedPeers[0].ip + ":" + sortedPeers[0].port + "/api/peers/version";
        let options = {
            uri: url,
            headers: {
                nethash: network.nethash,
                version: '1.0.0',
                port:1
            },
            timeout: 1000
        }; 
        return getFromNode(url, options).then(function(nodeStatus) {
            if(verbose) {
                console.log("Node selected: " + sortedPeers[0].ip + ":" + sortedPeers[0].port + ", height: " 
                    + sortedPeers[0].height + ", delay: " + sortedPeers[0].delay);
            }
            return Promise.resolve(sortedPeers[0]);
        }).catch(function(error) {
            return Promise.reject("Node not ok: " +error.toString());
        });
      
        
    }).catch(function(error) {
        return findPeer(network, verbose);
    }); 
}


var getFromNode = function(uri, options){
    
    return request(options).then(function(body){
       
        body = JSON.parse(body);
         if ( !body.hasOwnProperty('success') || body.success === false) {
            return Promise.reject("Failed: " + body.error);
        } 
        return Promise.resolve(body);
        
    }).catch(function(error){
        return Promise.reject(error);
    });
};

module.exports = ARKNetwork;