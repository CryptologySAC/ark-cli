"use strict";

const arkjs = require('arkjs');
const toolbox = require('./utils.js');
const arkjsnetworks = require('arkjs/lib/networks.js');
const ARKAPI = require('./ark-api-v1.js');
const {URL} = require('url');


var ARKNetwork = ()=>{};

ARKNetwork.connect = (network, verbose, nodeURI) => {
    
    // In case we want to connect to a node we follow a different path
    if(nodeURI) {
        console.log(`Connecting to node ${nodeURI}`);
        return connectNodeURI(nodeURI, verbose);
    }
    
    // Connect to a network
    switch(network) {
        case "testnet":
        case "devnet" :
            network = 'testnet';
            break;
        case "mainnet":
        case "ark":
            network = 'ark';
		    break;
        default:
	}
	
    let selectedNetwork = arkjsnetworks[network];
    
    if (!selectedNetwork) {
        return Promise.reject(`Can't connect to ${network}: Network not found.`);
    }
        
    if(verbose) {
        console.log(`Connecting to ${selectedNetwork.name}`);  
    }
  
    return findPeer(selectedNetwork, verbose)
    .then((peer) => {
        return Promise.resolve(peer);
    })
    .catch((error) => {
        return Promise.reject(error);
    });
};


function findPeer(network, verbose) {
    
    let server = network.peers[Math.floor(Math.random()*1000)%network.peers.length];
    server = toolbox.getNode(server);
    
    let uri = server + "/api/peers";
    if(verbose){
        console.log(`Trying Peer: ${server}`);
    }
    
    let options = {
        uri: uri,
        headers: {
            nethash: network.nethash,
            version: '1.0.0',
            port:1
        },
        timeout: 500
    }; 
    return getFromNode(options)
    .then((peerList) => {
        
        // Select all peers that have a OK status and return the peer with the heighest block.
        let sortedPeers = peerList.peers;
        sortedPeers = sortedPeers.map((peer) => {
            if (peer.status==="OK") {
                peer.network = network;
                if(verbose) {
                    console.log(`Node found: ${peer.ip}:${peer.port}, height: ${peer.height}, delay: ${peer.delay}`);
                }
                return peer;
            }
        });
        
        if (sortedPeers.length === 0) {
            return Promise.reject('Error sorting peers.');
        }
        // Sort Nodes by height and delay
        sortedPeers.sort((a, b) => parseInt(b.height, 10) - parseInt(a.height, 10) || parseInt(a.delay, 10) - parseInt(b.delay,10));
        
        // Test if the selected node actually works
        
        return testNode(sortedPeers, verbose);   
    }).catch((error) => {
        return findPeer(network, verbose);
    }); 
}

var connectNodeURI = ((nodeURI, verbose) => {
    return ARKAPI.getNetworkFromNode(nodeURI, verbose)
    .then(results => {
        let uri = new URL(nodeURI);
        let peer = {
            protocol: `${uri.protocol}//`,
            ip: uri.hostname,
            port: uri.port,
            nethash: results.network.nethash,
            network: results.network
        };
        return Promise.resolve(peer);
    })
    .catch(error => {
        return Promise.reject(error);
    });
});

var testNode = (sortedPeers, verbose) => {
    let server = toolbox.getNode(sortedPeers[0]);
    let uri = `${server}/api/peers/version`;
    let options = {
        uri: uri,
        headers: {
            nethash: sortedPeers[0].network.nethash,
            version: '1.0.0',
            port:1
        },
        timeout: 1000
    }; 
    return getFromNode(options)
    .then((nodeStatus) => {
        if(verbose) {
            console.log(`Node selected: ${sortedPeers[0].ip}:${sortedPeers[0].port}, height: ${sortedPeers[0].height}, delay: ${sortedPeers[0].delay}`);
        }
        return Promise.resolve(sortedPeers[0], verbose);
    })
    .then((node, verbose) => {
        // Update network configuration
        let nodeURI = toolbox.getNode(node);
        return ARKAPI.getNetworkFromNode(nodeURI, verbose)
        .then(results =>{
            node.network = results.network;
            return Promise.resolve(node);
        })
        .catch(node => {
            // The node was tested previously, so should be ok without updated network info.
            return Promise.resolve(node);
        })
    })
    .catch((error) => {
        // try next node
        if (verbose){
            console.log(`${error}. Failed to connect. Trying next node.`);
            sortedPeers.shift();
            if(sortedPeers.length) {
                return testNode(sortedPeers, verbose); 
            }
            return Promise.reject();
        }
    });
}

var getFromNode = (options) => {
    
    return ARKAPI.getFromNode(options);
};

module.exports = ARKNetwork;