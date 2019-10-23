#!/usr/bin/env node

/**************************************************************************************************
 * Imports
 **************************************************************************************************/

import * as program from "commander";
import * as shell   from "shelljs";


/**************************************************************************************************
 * Variables
 **************************************************************************************************/

const deployTypes = shell.ls(__dirname)
     .filter((file) => file.startsWith("cli-deploy-"))
     .map((file) => file.match(/cli-deploy-(.*)\.js/)[1]);


/**************************************************************************************************
 * Entrypoint / Command router
 **************************************************************************************************/

// #region Entrypoint / Command router

program.description("Runs deployments for various application types");

deployTypes.forEach((deployType) => {
    program.command(deployType, `Run deployments for ${deployType}`); // Note: Description is required
});

program.parse(process.argv);

// #endregion Entrypoint / Command router
