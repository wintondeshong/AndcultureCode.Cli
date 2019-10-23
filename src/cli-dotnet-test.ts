#!/usr/bin/env node

/**************************************************************************************************
 * Imports
 **************************************************************************************************/

import commands        from "./_modules/commands";
import dir             from "./_modules/dir";
import dotnetClean     from "./_modules/dotnet-clean";
import dotnetPath      from "./_modules/dotnet-path";
import echo            from "./_modules/echo";
import * as formatters from "./_modules/formatters";
import * as program    from "commander";
import * as shell      from "shelljs";


/**************************************************************************************************
 * Commands
 **************************************************************************************************/

// #region Commands

const dotnetTest = {
    cmds: {
        dotnetTest:       "dotnet test",
        dotnetTestFilter: "dotnet test --filter",
    },
    descriptionClean() {
        return "Skips the clean step before running the dotnet test runner (used in conjunction with a project flag)";
    },
    description(testDirectory) {
        return `Runs dotnet test runner on the ${dotnetPath.solutionPath()} solution (via ${this.cmds.dotnetTest})`;
    },
    runBySolution() {
        if (program.clean) {
            dotnetClean.run();
        }

        dotnetPath.solutionPathOrExit();
        const solutionDir = dotnetPath.solutionDir();

        dir.pushd(solutionDir);

        let cmd     = this.cmds.dotnetTest;
        let message = `Running all tests in the ${dotnetPath.solutionPath()} solution... via (${cmd})`;

        if (program.args.length > 0) {
            const filter = program.args;
            message = `Running tests in the ${dotnetPath.solutionPath()} solution that match the xunit filter of '${filter}' via (${this.cmds.dotnetTestFilter})`;
            cmd = `${this.cmds.dotnetTestFilter} ${filter}`;
        }

        if (program.coverage) {
            cmd += " -p:CollectCoverage=true -p:CoverletOutputFormat=opencover";
        }

        echo.message(message);

        const result = shell.exec(cmd, { silent: true, async: false });

        shell.echo(formatters.dotnet(result.stdout));
        shell.echo(formatters.dotnet(result.stderr));

        dir.popd();

        if (result.code !== 0) {
            echo.headerError("One or many test projects failed to compile or pass tests");
            shell.exit(result.code);
        }
    },
};

// #endregion Commands


/**************************************************************************************************
 * Entrypoint / Command router
 **************************************************************************************************/

// #region Entrypoint / Command router

program
    .usage("option")
    .description(commands.dotnetTest.description)
    .option("-c, --clean", dotnetTest.descriptionClean())
    .option("--coverage",  "Additionally run tests with code coverage via coverlet")
    .parse(process.argv);

dotnetTest.runBySolution();

// #endregion Entrypoint / Command router