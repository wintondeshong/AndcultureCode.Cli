#!/usr/bin/env ts-node

/**************************************************************************************************
 * Imports
 **************************************************************************************************/

import commands     from "./_modules/commands";
import * as program from "commander";
import migration    from "./_modules/migration";


/**************************************************************************************************
 * Variables
 **************************************************************************************************/

const modes = migration.modes();


/**************************************************************************************************
 * Entrypoint / Command router
 **************************************************************************************************/

// #region Entrypoint / Command router

program
    .usage("option")
    .description(commands.migration.description)
    .option("-a, --add",     migration.description(modes.ADD))
    .option("-d, --delete",  migration.description(modes.DELETE))
    .option("-r, --run",     migration.description(modes.RUN))
    .parse(process.argv);

if (program.add) {
    migration
        .mode(modes.ADD)
        .migrationName(program.args)
        .run();
}

if (program.delete) {
    migration
        .mode(modes.DELETE)
        .migrationName(program.args)
        .run();
}

if (program.run) {
    migration
        .mode(modes.RUN)
        .migrationName(program.args)
        .run();
}

if (process.argv.slice(2).length === 0) { program.help(); }

// #endregion Entrypoint / Command router
