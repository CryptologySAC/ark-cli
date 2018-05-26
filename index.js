#!/usr/bin/env node
/**
 * @title       ARK Command Line Interface.
 * @dev         Interface with the ARK Blockchain from the command line.
 * @version     2018.05.24
 * @copyright   All rights reserved (c) 2018 Cryptology ltd, Hong Kong.
 * @license     MIT License
 * @author      Marc Schot, Cryptology ltd, Hong Kong.
 */ 

"use strict";

const app = require("./src/ark-cli.js");
app.parse(process.argv);