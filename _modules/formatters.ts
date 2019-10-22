/**************************************************************************************************
 * Imports
 **************************************************************************************************/

import { colors, symbols } from "./variables";
import * as shell          from "shelljs";


/**************************************************************************************************
 * Functions
 **************************************************************************************************/

// #region Color formatters

const red    = (message: string) => `${colors.red}${message}${colors.clear}`;
const yellow = (message: string) => `${colors.yellow}${message}${colors.clear}`;
const purple = (message: string) => `${colors.purple}${message}${colors.clear}`;
const white  = (message: string) => `${colors.white}${message}${colors.clear}`;
const green  = (message: string) => `${colors.green}${message}${colors.clear}`;

// #endregion Color formatters

// #region Dotnet formatters

const dotnet = (output, toConsole = false) => {
    // NOTE: Temporarily parsing output due to shelljs.exec not preserving colored output correctly
    // See https://github.com/shelljs/shelljs/issues/86 for more info

    output = output
        .replace(new RegExp(/(warning [A-Z]+[0-9]+:)/g), this.yellow("$&"))
        .replace(new RegExp(/(error [A-Z]+[0-9]+:)/g),   this.red("$&"))
        .replace(new RegExp(/([0-9]+ Warning\(s\))/g),   this.yellow("$&"))
        .replace(new RegExp(/([0-9]+ Error\(s\))/g),     this.red("$&"))
        .replace(new RegExp(/(Build FAILED\.)/g),        this.red("$&"))
        .replace(new RegExp(/(\[[0-9:]+ WRN\])/g),       this.yellow("$&"))
        .replace(new RegExp(/(\[[0-9:]+ FTL\])/g),       this.red("$&"))
        .replace(new RegExp(/(\[[0-9:]+ ERR\])/g),       this.red("$&"))
        .replace(new RegExp(/(Failed: [0-9]+.)/,  "g"),  this.red("$&"))
        .replace(new RegExp(/(Passed: [0-9]+.)/,  "g"),  this.green("$&"))
        .replace(new RegExp(/(Skipped: [0-9]+.)/,  "g"), this.yellow("$&"))
        .replace(new RegExp(/(Test Run Successful.)/,  "g"),  this.green("$&"))
        .trim();

    if (toConsole) {
        shell.echo(output);
    }

    return output;
};

// #endregion Dotnet formatters

// #region Spacing formatters

const tab           = (message, times = 3) => "\t".repeat(times) + message;
const tabbedNewLine = (message, times = 3) => "\n" + this.tab(message, times);

// #endregion Spacing formatters

// #region Jest formatters

const jest = (output, toConsole = false) => {
    // NOTE: Temporarily parsing output due to shelljs.exec not preserving colored output correctly
    // See https://github.com/shelljs/shelljs/issues/86 for more info
    output = output
        .replace(new RegExp(/(Expected:)/,      "g"), this.green("$&"))
        .replace(new RegExp(/([0-9]* failed)/,  "g"), this.red("$&"))
        .replace(new RegExp(/([0-9]* passed)/,  "g"), this.green("$&"))
        .replace(new RegExp(/(Received:)/,      "g"), this.red("$&"))
        .replace(new RegExp(/([0-9]* skipped)/, "g"), this.yellow("$&"))
        .replace(new RegExp(/(PASS)/,           "g"), this.green("$&"))
        .replace(new RegExp(/(FAIL)/,           "g"), this.red("$&"))
        .replace(new RegExp(symbols.checkmark,  "g"), this.green(symbols.checkmark))
        .replace(new RegExp(symbols.o,          "g"), this.yellow(symbols.o))
        .replace(new RegExp(symbols.x,          "g"), this.red(symbols.x));

    if (toConsole) {
        shell.echo(output);
    }

    return output;
};

// #endregion Jest formatters

// #region Npm formatters

const npm = (output, toConsole = false) => {
    // NOTE: Temporarily parsing output due to shelljs.exec not preserving colored output correctly
    // See https://github.com/shelljs/shelljs/issues/86 for more info
    output = output
        .replace(new RegExp(/(npm )/,                                                                            "g"), this.purple("$&"))
        .replace(new RegExp(/(WARN)/,                                                                            "g"), this.yellow("$&"))
        .replace(new RegExp(/([0-9]+ high)/,                                                                     "g"), this.red("$&"))
        .replace(new RegExp(/([0-9]+ moderate)/,                                                                 "g"), this.yellow("$&"))
        .replace(new RegExp(/([0-9]+ low)/,                                                                      "g"), this.yellow("$&"))
        .replace(new RegExp(/(Testing binary)/,                                                                  "g"), this.green("$&"))
        .replace(new RegExp(/(Binary is fine)/,                                                                  "g"), this.green("$&"))
        .replace(new RegExp(/(added [0-9]+ package[s]*)( and updated [0-9]+ package[s]*)* (in [0-9]+.[0-9]*s)/,  "g"), this.green("$&"))
        .replace(new RegExp(/(up to date in [0-9]+.[0-9]*s)/,                                                    "g"), this.green("$&"));

    if (toConsole) {
        shell.echo(output);
    }

    return output;
};

// #endregion Npm formatters


/**************************************************************************************************
 * Exports
 **************************************************************************************************/

export {
    dotnet,
    green,
    jest,
    npm,
    purple,
    red,
    tab,
    tabbedNewLine,
    yellow,
    white,
};
