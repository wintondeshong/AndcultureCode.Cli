#!/usr/bin/env ts-node

/**************************************************************************************************
 * Imports
 **************************************************************************************************/

import dir        from "./dir";
import dotnetPath from "./dotnet-path";
import echo       from "./echo";
import * as shell from "shelljs";


/**************************************************************************************************
 * Functions
 **************************************************************************************************/

const dotnetRestore = {
    cmd: "dotnet restore",
    description() {
        return `Restore the dotnet solution from the root of the project (via ${this.cmd})`;
    },
    run() {
        dir.pushd(dotnetPath.solutionDir());
        echo.message(`Restoring nuget packages (via ${this.cmd})...`);
        shell.exec(this.cmd);
        echo.success("Dotnet solution restored")
        dir.popd();
    },
};


/**************************************************************************************************
 * Exports
 **************************************************************************************************/

export default dotnetRestore;