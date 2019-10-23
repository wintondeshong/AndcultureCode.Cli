/**************************************************************************************************
 * Imports
 **************************************************************************************************/

import echo       from "./echo";
import * as fs    from "fs";
import * as shell from "shelljs";


/**************************************************************************************************
 * Functions
 **************************************************************************************************/

// #region Dir commands

const dir = {
    /**
     * Deletes the directory provided it exists
     * @param {string} dir Relative or absolute path to directory
     */
    deleteIfExists(dir) {
        if (!fs.existsSync(dir)) {
            echo.message(`Directory '${dir}' does not exist. Nothing to delete.`);
            return;
        }

        shell.rm("-rf", dir);
        echo.success(`Directory '${dir}' successfully deleted`);
    },
    popd(dir = undefined) {
        shell.popd("-q", dir);
    },
    pushd(dir = undefined) {
        shell.pushd("-q", dir);
    }
}

// #endregion Dir commands


/**************************************************************************************************
 * Exports
 **************************************************************************************************/

export default dir;
