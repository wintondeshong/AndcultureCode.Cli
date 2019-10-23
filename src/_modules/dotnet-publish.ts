#!/usr/bin/env node

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

const dotnetPublish = {
    cmd(outputDirectory) {
        if (outputDirectory === undefined || outputDirectory === null) {
            return "dotnet publish";
        }

        return `dotnet publish -o "${outputDirectory}"`;
    },
    description() {
        return `Publishes the dotnet solution from the root of the project (via ${this.cmd()})`;
    },
    run(absoluteOutputDir) {

        echo.message(`Cleaning release directory '${absoluteOutputDir}'...`);
        shell.rm("-rf", absoluteOutputDir);
        echo.success(" - Successfully cleaned released directory");
        echo.newLine();

        dir.pushd(dotnetPath.solutionDir());
        echo.message(`Publishing dotnet solution (via ${this.cmd(absoluteOutputDir)})...`);

        if (shell.exec(this.cmd(absoluteOutputDir)).code !== 0) {
            echo.error("Failed to publish dotnet project");
            shell.exit(1);
        }

        echo.success(" - Dotnet solution published")
        dir.popd();
    },
};


/**************************************************************************************************
 * Exports
 **************************************************************************************************/

export default dotnetPublish;