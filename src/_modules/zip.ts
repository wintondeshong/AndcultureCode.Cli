/**************************************************************************************************
 * Imports
 **************************************************************************************************/

import archiver from "archiver";
import echo     from "./echo";
import * as fs  from "fs";


/**************************************************************************************************
 * Functions
 **************************************************************************************************/

const zip = {

    /**
     * File source and destination descriptor
     * @typedef {Object} InputDirectory
     * @property {string} source - Relative or absolute path to directory
     * @property {string} [destination] - Relative path to directory within output zip. If not supplied, source is used.
     */

    /**
     * File source and destination descriptor
     * @typedef {Object} InputFile
     * @property {string} source - Relative or absolute path to file
     * @property {string} [destination] - Relative path to file within output zip. If not supplied, source is used.
     */

    /**
     * Creates a new zip archive comprised of the supplied file(s) and/ or director(ies)
     * @param {InputDirectory[]} inputDirectories - Directories to include in the zip
     * @param {InputFile[]} inputFiles - Files to include in the zip
     * @param {string} outputPath - Relative or absolute file path of final zip archive
     */
    create(inputDirectories, inputFiles, outputPath) {
        return new Promise((resolve, reject) => {
            echo.message(`Creating zip '${outputPath}'...`);

            if (inputDirectories === undefined || inputDirectories === null) {
                inputDirectories = [];
            }

            if (inputFiles === undefined || inputFiles === null) {
                inputFiles = [];
            }

            const archive         = archiver("zip");
            const output          = fs.createWriteStream(outputPath);
            const rejectWithError = (error) => {
                echo.error(` - Failed creating zip - ${error}`);
                reject(error);
            };

            output.on("close", () => {
                echo.success(` - Finished creating zip '${outputPath}' -- ${archive.pointer()} total bytes`);
                resolve();
            });

            archive.on("warning", (err) => {
                if (err.code === "ENOENT") { return; }
                rejectWithError(err);
            });

            // good practice to catch this error explicitly
            archive.on("error", (err) => rejectWithError(err));

            archive.pipe(output);

            // add directories
            inputDirectories.forEach((inputDirectory) => {
                const destination = inputDirectory.destination ? inputDirectory.destination : inputDirectory.source;
                archive.directory(inputDirectory.source, destination);
            });

            // add files
            inputFiles.forEach((inputFile) => {
                const destination = inputFile.destination ? inputFile.destination : inputFile.source;
                archive.file(inputFile.source, { name: destination });
            });

            archive.finalize();
        });
    },
};


/**************************************************************************************************
 * Exports
 **************************************************************************************************/

export default zip;