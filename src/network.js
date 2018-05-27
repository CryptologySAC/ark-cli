"use strict";

const arkjs = require('arkjs');
const toolbox = require('./utils.js');
const arkjsnetworks = require('arkjs/lib/networks.js');
const request = require('request-promise-native');

var ARKNetwork = ()=>{};
    
ARKNetwork.getFromNodeV1 = (options) => {
    
    return request(options)
    .then((body) => {
       
        body = JSON.parse(body);
        if ( !body.hasOwnProperty('success') || body.success === false) {
            return Promise.reject('Failed: ' + body.error);
        } 
        return Promise.resolve(body);
        
    }).catch(function(error){
        return Promise.reject(error);
    });
};

ARKNetwork.connect = (network, verbose) => {
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
        return Promise.reject("Can't connect to " +network + ": Network not found.");
    }
        
    if(verbose) {
        console.log('Connecting to '+ selectedNetwork.name);  
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
    
    let uri = server + '/api/peers';
    if(verbose){
        console.log("Trying Node: "+server);
    }
    
    let options = {
        uri: uri,
        headers: {
            nethash: network.nethash,
            version: '1.0.0',
            port:1
        },
        timeout: 1000
    }; 
    return getFromNode(options)
    .then((peerList) => {
        
        // Select all peers that have a OK status and return the peer with the heighest block.
        let sortedPeers = peerList.peers;
        sortedPeers = sortedPeers.map((peer) => {
            if (peer.status==="OK") {
                peer.nethash = network.nethash;
                peer.network = network;
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
        let server = toolbox.getNode(sortedPeers[0]);
        let uri = server + "/api/peers/version";
        let options = {
            uri: uri,
            headers: {
                nethash: network.nethash,
                version: '1.0.0',
                port:1
            },
            timeout: 1000
        }; 
        return getFromNode(options)
        .then((nodeStatus) => {
            if(verbose) {
                console.log("Node selected: " + sortedPeers[0].ip + ":" + sortedPeers[0].port + ", height: " 
                    + sortedPeers[0].height + ", delay: " + sortedPeers[0].delay);
            }
            return Promise.resolve(sortedPeers[0]);
        }).catch((error) => {
            return Promise.reject("Node not ok: " +error.toString());
        });
      
        
    }).catch((error) => {
        return findPeer(network, verbose);
    }); 
}


var getFromNode = (options) => {
    
    return ARKNetwork.getFromNodeV1(options);
};

module.exports = ARKNetwork;