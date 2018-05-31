"use strict";

//const arkjs = require('arkjs');
const toolbox = require('./utils.js');
const ARKAPI = require('./ark-api-v1.js');
const {URL} = require('url');
const mainnetPeers = require("../ark-peers/mainnet.json");
const devnetPeers = require("../ark-peers/devnet.json");

async function connect(network="mainnet", nodeURI=false, verbose=false) {
    
    try {
   
        // In case we want to connect to a specific node.
        if(nodeURI) {
            
            // If the uri isn't valid this will throw an error.
            new URL(nodeURI);
            
            if(verbose) {
                console.log(`Connecting to node ${nodeURI}`);
            }
        
            return await connectNodeURI(nodeURI, verbose);
        }
    
        // We're connecting to a network.
        let selectedNetwork = false;
    
        // Connect to a network
        switch(network) {
            case "testnet":
            case "devnet" :
                selectedNetwork = {name:"devnet", peers:devnetPeers};
                break;
            case "mainnet":
            case "ark":
                selectedNetwork = {name:"mainnet", peers:mainnetPeers};
    		    break;
            default:
    	}

    
        if (!selectedNetwork) {
            throw `Couldn't connect to ${network}: Network not configured.`;
        }
        
        if(verbose) {
            console.log(`Trying to connect to ${selectedNetwork.name}`);  
        }
  
        return await findPeer(selectedNetwork, verbose);
    }
    catch(error) {
        if(verbose){
            console.log("Failed connecting to the network.");
        }
        throw error;
    }
}

async function findPeer(network, verbose) {
    
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
    
    let peerList = await ARKAPI.getFromNode(options);
        
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
    try {    
        let node = await testNode(sortedPeers, verbose);
        return node;
    }
    catch(error) {
        let node =  await findPeer(network, verbose);
        return node;
    } 
}

async function connectNodeURI(nodeURI, verbose){
    try {
        let networkConfig = await ARKAPI.getNetworkFromNode(nodeURI, verbose);
        let uri = new URL(nodeURI);
        let peer = {
            protocol: `${uri.protocol}//`,
            ip: uri.hostname,
            port: uri.port,
            nethash: networkConfig.network.nethash,
            network: networkConfig.network
        };
        return Promise.resolve(peer);
    }
    catch(error) {
        return Promise.reject(error);
    }
}

async function testNode(sortedPeers, verbose) {
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
    return await ARKAPI.getFromNode(options)
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
        });
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

module.exports.connect = connect;