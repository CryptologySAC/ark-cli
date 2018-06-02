"use strict";

//const arkjs = require('arkjs');
const toolbox = require('./utils.js');
const ARKAPI = require('./ark-api-v1.js');
const {URL} = require('url');
const mainnetPeers = require("../ark-peers/mainnet.json");
const devnetPeers = require("../ark-peers/devnet.json");

async function connectBlockchain(network="mainnet", nodeURI=false, verbose=false){
    
    try {
   
        // In case we want to connect to a specific node.
        if(nodeURI) {
            
            // If the uri isn't valid this will throw an error.
            let uri = new URL(nodeURI);
            
            if(verbose) {
                console.log(`Trying to connect to node ${nodeURI}`);
            }
            return await connectNodeURI(uri, verbose);
        }

    
        // Connect to a network
        // TODO put this in a separate config and enable sidechains to be added.
        let networks = {
            "devnet": {"peers":devnetPeers, "name":"devnet"},
            "mainnet": {"peers":mainnetPeers, "name":"mainnet"}
        };
        let selectedNetwork = networks[network] ? networks[network] : false;
    
        if (!selectedNetwork) {
            throw `Couldn't connect to ${network}: Network not known to Ark-Cli.`;
        }
        
        if(verbose) {
            console.log(`Trying to connect to ${network}`);  
        }
  
        return await selectPeer(selectedNetwork, verbose);
    }
    catch(error) {
        if(verbose){
            console.log(`Failed connecting to ${network}.`);
        }
        throw error;
    }
}

async function selectPeer(network, verbose) {

    if(verbose){
        let server = toolbox.getNode(network.peers[0]);
        console.log(`Polling peer: ${server} for active nodes.`);
    }
    
    try {
        let peerList = await ARKAPI.getActiveNodes(network);
        
        // Select all peers that have a OK status and return the peer with the heighest block/lowest delay.
        let sortedPeers = peerList.peers;
        sortedPeers = sortedPeers.map((peer) => {
            if (peer.status==="OK") {
                peer.network = network;
                if(verbose) {
                    console.log(`Active node discoverred: ${peer.ip}:${peer.port}, height: ${peer.height}, delay: ${peer.delay}`);
                }
            return peer;
            }
        });
        
        if (sortedPeers.length === 0) {
            throw 'Error sorting peers.';
        }
        
        // Sort Nodes by height and delay
        sortedPeers.sort((a, b) => parseInt(b.height, 10) - parseInt(a.height, 10));// || parseInt(a.delay, 10) - parseInt(b.delay,10));
        
        // Test if the selected node actually works
        return await testNode(sortedPeers, verbose);
    }
    catch(error) {
        // Try next seed peer, if any.
        network.peers.shift();
        if (network.peers.length) {
            return await selectPeer(network, verbose);
        }
        throw "Network currently unavailable.";
    } 
}

async function connectNodeURI(uri, verbose){
    try {
        let node = {'network': uri};
        let networkConfig = await ARKAPI.getNetworkConfigFromNode(node, verbose);
        let peer = {
            protocol: `${uri.protocol}//`,
            ip: uri.hostname,
            port: uri.port,
            network: networkConfig
        };
        return peer;
    }
    catch(error) {
        throw error;
    }
}

async function testNode(sortedPeers, verbose) {
    let peer = sortedPeers[0];
    let server = toolbox.getNode(peer);
    let uri = `${server}/api/peers/version`;
    let options = {
        uri: uri,
        headers: {
            nethash: "none",
            version: '1.0.0',
            port:1
        },
        timeout: 5000
    }; 
    
    try {
        let version = await ARKAPI.getFromNode(options);
        peer.version = version.version;
        peer.build = version.build;

        // Update network configuration
        peer.network = await ARKAPI.getNetworkConfigFromNode(peer);
        
        if(verbose) {
            console.log(`Node selected: ${peer.ip}:${peer.port}, height: ${peer.height}, delay: ${peer.delay}`);
        }
        
        return peer;
        
    }
    catch(error) {
        
        // try next node
        sortedPeers.shift();
        if(sortedPeers.length) {
            return testNode(sortedPeers, verbose); 
        }
        
        throw error;
    }
}

module.exports.connectBlockchain = connectBlockchain;