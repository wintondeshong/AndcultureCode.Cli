#!/usr/bin/env ts-node

/**************************************************************************************************
 * Imports
 **************************************************************************************************/

import dir        from "./dir";
import dotnetPath from "./dotnet-path";
import echo       from "./echo";
import formatters from "./formatters";
import * as shell from "shelljs";
import variables  from "./variables";


/**************************************************************************************************
 * Functions
 **************************************************************************************************/

const dotnetClean = {
    cmd() {
        return `dotnet clean ${dotnetPath.solutionDir()}`
    },
    description() {
        return `Clean the dotnet solution from the root of the project (via ${this.cmd()})`;
    },
    run() {
        dir.pushd(dotnetPath.solutionDir());

        // We clean 'bin' and 'obj' directories first incase they are preventing the SLN from building
        echo.message("Recursively deleting 'bin' directories...");
        const binDirs = shell.find(".").filter((e) => {
            if (e.startsWith(".git"))       { return false; } // If sln is on the root of repo, we must avoid cleaning .git
            if (e.includes("node_modules")) { return false; } // Disregard any in node_modules directories
            return e.match("bin");
        });
        if (binDirs.length > 0) {
            shell.rm("-rf", binDirs);
        }
        echo.success("'bin' directories deleted successfully!");

        echo.message("Recursively deleting 'obj' directories...");
        const objDirs = shell.find(".").filter((e) => {
            if (e.startsWith(".git"))       { return false; } // If sln is on the root of repo, we must avoid cleaning .git
            if (e.includes("node_modules")) { return false; } // Disregard any in node_modules directories
            return e.match("obj");
        });
        if (objDirs.length > 0) {
            shell.rm("-rf", objDirs);
        }
        echo.success("'obj' directory deleted successfully!");

        dir.popd();

        // Now we let the dotnet cli clean
        echo.message(`Running dotnet clean (via ${this.cmd()}) on the solution...`);

        let output = shell.exec(this.cmd(), { silent: true });
        shell.echo(formatters.dotnet(output));

        echo.success("Dotnet solution cleaned");
    },
}


/**************************************************************************************************
 * Exports
 **************************************************************************************************/

export default dotnetClean;