#!/usr/bin/env ts-node

/**************************************************************************************************
 * Imports
 **************************************************************************************************/

import dotnetClean     from "./dotnet-clean";
import dotnetPath      from "./dotnet-path";
import dotnetRestore   from "./dotnet-restore";
import echo            from "./echo";
import * as formatters from "./formatters";
import * as shell      from "shelljs";


/**************************************************************************************************
 * Functions
 **************************************************************************************************/

const dotnetBuild = {
    cmd() {
        return `dotnet build ${dotnetPath.solutionPath()} --no-restore`;
    },
    description() {
        return `Builds the dotnet project (via ${this.cmd()})`;
    },
    run(clean, restore) {

        dotnetPath.solutionPathOrExit();

        if (clean) {
            dotnetClean.run();
        }

        if (restore) {
            dotnetRestore.run();
        }

        echo.message(`Building solution (via ${this.cmd()})...`);

        let output = shell.exec(this.cmd(), { silent: true });

        shell.echo(formatters.dotnet(output));
    },
};


/**************************************************************************************************
 * Exports
 **************************************************************************************************/

export default dotnetBuild;