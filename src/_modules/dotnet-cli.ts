#!/usr/bin/env ts-node

/**************************************************************************************************
 * Imports
 **************************************************************************************************/

import dir                    from "./dir";
import echo                   from "./echo";
import * as shell             from "shelljs";
import dotnetBuild            from "./dotnet-build";
import dotnetPath             from "./dotnet-path";
import { red, tabbedNewLine}  from "./formatters";
import * as path              from "path";


/**************************************************************************************************
 * Functions
 **************************************************************************************************/

const dotnetCli = {
    cmd() {
        if (!dotnetPath.cliPath()) return "";
        return `dotnet ${path.basename(dotnetPath.cliPath())}`;
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

        dir.pushd(dotnetPath.cliDir());

        // Dynamically find the latest dotnet core bin so that upgrades won't break this command
        const fullCommand = `${this.cmd()} ${args}`;
        echo.success(`Full command:` + fullCommand);
        shell.exec(fullCommand);

        dir.popd();
    },
};


/**************************************************************************************************
 * Exports
 **************************************************************************************************/

export default dotnetCli;