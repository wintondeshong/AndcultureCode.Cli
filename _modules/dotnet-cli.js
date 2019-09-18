#!/usr/bin/env node

/**************************************************************************************************
 * Imports
 **************************************************************************************************/

const dir         = require("./dir");
const echo        = require("./echo");
const shell       = require("shelljs");
const dotnetBuild = require("./dotnet-build");
const dotnetPath  = require("./dotnet-path");
const formatters  = require("./formatters");

const { red, tabbedNewLine } = formatters;


/**************************************************************************************************
 * Functions
 **************************************************************************************************/

const dotnetCli = {
    cmd() {
        return `dotnet ${dotnetPath.cliPath()}`;
    },
    description() {
        return `Shortcut that forwards any/all LMS Dotnet Cli commands to be run in the correct location in the project (via ${this.cmd()}) ` +
        tabbedNewLine(red("NOTE: ") + "Arguments need to be wrapped in quotes, ie \"test database migrate\"");
    },
    run(args) {
        const cliDir = dotnetPath.cliDir();

        // Build dotnet project if the *Cli.dll is not found
        if (cliDir === undefined || cliDir === null) {
            echo.warn("No Cli.dll found. Building project");
            dotnetBuild.run(true, true);
        }

        // dir.pushd(dotnetPath.cliDir());

        // // Dynamically find the latest dotnet core bin so that upgrades won't break this command
        // const fullCommand = `${this.cmd()} ${args}`;
        // echo.success(`Full command:` + fullCommand);
        // shell.exec(fullCommand);

        // dir.popd();
    },
};


/**************************************************************************************************
 * Exports
 **************************************************************************************************/

module.exports = dotnetCli;