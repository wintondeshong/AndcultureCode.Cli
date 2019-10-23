#!/usr/bin/env ts-node

/**************************************************************************************************
 * Imports
 **************************************************************************************************/

import commands      from "./_modules/commands";
import echo          from "./_modules/echo";
import file          from "./_modules/file";
import * as path     from "path";
import * as program  from "commander";
import * as shell    from "shelljs";
import * as upath    from "upath";


/**************************************************************************************************
 * Commands
 **************************************************************************************************/

// #region Install commands

const install = {
    cmds: {
        installGlobally: "npm install --global and-cli"
    },
    description() {
        return "Configures development machine with global npm, project-specific and developer and-cli tools";
    },
    run() {
        // Global npm package
        echo.message("Installing and-cli as global npm tool...");
        shell.exec(this.cmds.installGlobally);
        echo.success("Successfully installed globally");
        echo.newLine();

        // Project-specific alias
        echo.message("Configuring project-specific `and-cli` bash alias...");
        const projectAlias = "alias and-cli='npx and-cli'";

        if (shell.cat(file.bashFile()).grep(projectAlias).stdout.length > 1) {
            echo.success("and-cli bash alias already installed");
        } else {
            shell.echo("").toEnd(file.bashFile());
            shell.echo("# and-cli project-level alias").toEnd(file.bashFile());
            shell.echo(projectAlias).toEnd(file.bashFile());
            echo.success("Successfully installed and-cli bash alias");
        }
        echo.newLine();

        // Developer alias
        echo.message("Configuring cli development `and-cli-dev` bash alias...");
        const pathToCli      = upath.toUnix(path.join(shell.pwd().toString(), "src", "cli.ts"));
        const developerAlias = `alias and-cli-dev='${pathToCli}'`;

        if (shell.cat(file.bashFile()).grep(developerAlias).stdout.length > 1) {
            echo.success("and-cli-dev bash alias already installed");
        } else {
            shell.echo("").toEnd(file.bashFile());
            shell.echo("# and-cli global development alias pointing to your fork of the repository").toEnd(file.bashFile());
            shell.echo(developerAlias).toEnd(file.bashFile());
            echo.success("Successfully installed and-cli-dev alias");
        }

        // Reload shell
        echo.newLine();
        echo.success("Install successful. Reload your shell for changes to take effect");
    },
}

// #endregion Install commands


/**************************************************************************************************
 * Entrypoint / Command router
 **************************************************************************************************/

// #region Entrypoint / Command router

program
    .usage("option(s)")
    .description(commands.install.description)
    .parse(process.argv);

// If no options are passed in, performs installation steps
if (process.argv.slice(2).length === 0) { install.run(); }

// #endregion Entrypoint / Command router