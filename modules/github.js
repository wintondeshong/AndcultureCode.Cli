// -----------------------------------------------------------------------------------------
// #region Imports
// -----------------------------------------------------------------------------------------

const { createNetrcAuth } = require("octokit-auth-netrc");
const { Octokit } = require("@octokit/rest");
const { StringUtils } = require("andculturecode-javascript-core");
const constants = require("./constants");
const echo = require("./echo");
const formatters = require("./formatters");
const fs = require("fs");
const git = require("./git");
const js = require("./js");
const os = require("os");
const shell = require("shelljs");
const upath = require("upath");
const userPrompt = require("./user-prompt");

// #endregion Imports

// -----------------------------------------------------------------------------------------
// #region Constants
// -----------------------------------------------------------------------------------------

const { ANDCULTURE, ANDCULTURE_CODE } = constants;
const { yellow } = formatters;
const API_DOMAIN = "api.github.com";

// #endregion Constants

// -----------------------------------------------------------------------------------------
// #region Private Variables
// -----------------------------------------------------------------------------------------

let _currentUser = null;
let _prompt = null;
let _token = null;

// #endregion Private Variables

// -----------------------------------------------------------------------------------------
// #region Public Members
// -----------------------------------------------------------------------------------------

const github = {
    // -----------------------------------------------------------------------------------------
    // #region Public Properties
    // -----------------------------------------------------------------------------------------

    andcultureOrg: ANDCULTURE_CODE,
    apiPullsRouteParam: "pulls",
    apiRepositoriesRouteParam: "repos",
    apiReviewsRouteParam: "reviews",
    apiRootUrl: `https://${API_DOMAIN}`,
    apiTopicsRouteParam: "topics",
    configAuthConfigPath: upath.join(os.homedir(), ".netrc"), // Path to octokit-auth-netrc configuration
    configAuthDocsUrl:
        "https://docs.github.com/en/free-pro-team@latest/github/authenticating-to-github/creating-a-personal-access-token",
    configAuthTokenUrl: "https://github.com/settings/tokens/new",

    // #endregion Public Properties

    // -----------------------------------------------------------------------------------------
    // #region Public Methods
    // -----------------------------------------------------------------------------------------

    /**
     * Adds a topic to all AndcultureCode repositories
     *
     * @param {string} topic Topic to be added
     */
    async addTopicToAllRepositories(topic) {
        if (StringUtils.isEmpty(topic)) {
            echo.error("Topic name is required");
            return;
        }

        const andcultureRepos = await this.repositoriesByAndculture();
        const repoNames = andcultureRepos.map((e) => e.name);

        // Safe guard against accidental command runs
        await _promptUpdateAllRepos(
            `add the topic '${topic}'`,
            repoNames.length
        );

        await js.asyncForEach(repoNames, async (repo) => {
            await this.addTopicToRepository(topic, this.andcultureOrg, repo);
        });
    },

    /**
     * Adds a topic to given repository
     *
     * @param {string} topic Topic to be added
     * @param {string} owner user or organization name owning the repo
     * @param {string} repoName short name of repository (excluding user/organization)
     */
    async addTopicToRepository(topic, owner, repoName) {
        if (!_validateTopicInputOrExit(topic, owner, repoName)) {
            return null;
        }

        const updateFunction = (existingTopics) => [...existingTopics, topic];

        const updateResult = await _updateTopicsForRepo(
            updateFunction,
            owner,
            repoName
        );

        _outputUpdateTopicResult(repoName, updateResult);
        return updateResult;
    },

    /**
     * Sets login token for github api
     * @param {string} token github personal access token
     */
    configureToken(token) {
        const contents = _getConfigContents(token);

        if (!fs.existsSync(this.configAuthConfigPath)) {
            fs.writeFileSync(this.configAuthConfigPath, contents, {
                flag: "w",
            });
            return;
        }

        fs.appendFileSync(this.configAuthConfigPath, contents);
    },

    description() {
        return `Helpful github operations used at ${ANDCULTURE}`;
    },

    /**
     * Retrieves list of pull requests for a repository
     * @param {string} owner user or organization name owning the repo
     * @param {string} repoName name of repository
     * @param {string} state all, closed, open
     */
    async getPullRequests(owner, repoName, state) {
        if (!_validateInputOrExit(owner, repoName)) {
            return null;
        }

        state = StringUtils.isEmpty(state) ? "all" : state;

        try {
            const response = await _client().pulls.list({
                owner: owner,
                repo: repoName,
                state,
            });
            _throwIfApiError(response);

            return response.data;
        } catch (e) {
            echo.error(
                `Error retrieving pull requests for ${owner}/${repoName} - ${e}`
            );
            return null;
        }
    },

    /**
     * Retrieves list of reviews for a pull request
     * @param {string} owner user or organization name owning the repo
     * @param {string} repoName name of repository
     * @param {number} number pull request number
     */
    async getPullRequestReviews(owner, repoName, number) {
        if (!_validateInputOrExit(owner, repoName)) {
            return null;
        }

        try {
            const response = await _client().pulls.listReviews({
                owner: owner,
                repo: repoName,
                pull_number: number,
            });
            _throwIfApiError(response);

            return response.data;
        } catch (e) {
            echo.error(
                `Error retrieving reviews for ${owner}/${repoName}/pulls/${number} - ${e}`
            );
            return null;
        }
    },

    /**
     * Retrieves a repository
     * @param {string} owner user or organization name owning the repo
     * @param {string} repoName short name of repository (excluding user/organization)
     */
    async getRepo(owner, repoName) {
        try {
            const response = await _client().repos.get({
                owner: owner,
                repo: repoName,
            });
            _throwIfApiError(response);

            return response.data;
        } catch (e) {
            echo.error(
                `Error retrieving repository for ${owner}/${repoName} - ${e}`
            );
            return null;
        }
    },

    /**
     * Forks a given repository for the current authenticated user
     *
     * While the github API asychronously forks the repo, our wrapper tries its best to wait for it
     * @param {string} ownerName User or organization that owns the repo being forked
     * @param {string} repoName The 'short' name of the repo (excludes the owner/user/organization)
     */
    async fork(ownerName, repoName) {
        if (!(await _verifyTokenFor("fork"))) {
            return null;
        }

        // Initiate creation of fork with Github
        let fork = null;
        try {
            const response = await _client().repos.createFork({
                owner: ownerName,
                repo: repoName,
            });
            _throwIfApiError(response);
            fork = response.data;
        } catch (e) {
            echo.error(e);
            return false;
        }

        // Poll github to see when it has completed (waits maximum of 5 minutes)
        echo.message(
            `Forking '${fork.name}'. Can take up to 5 minutes. Please wait...`
        );

        const isForkCreated = async (elapsed) => {
            echo.message(` - Looking for fork (${elapsed / 1000}s)...`);

            if ((await this.getRepo(fork.owner.login, fork.name)) == null) {
                return false;
            }

            echo.success(` - Fork of '${fork.name}' created successfully`);

            return true;
        };

        await js.waitFor(isForkCreated, 10000, 60000, function timeout() {
            echo.error(
                "Fork creation timed out, please contact github support"
            );
        });

        return false; // never found it!
    },

    /**
     * Retrieves user information of the current authenticated user
     */
    async getCurrentUser() {
        if (_currentUser != null) {
            return _currentUser;
        }

        if (!(await _verifyTokenFor("get current user"))) {
            return null;
        }

        try {
            const response = await _client().users.getAuthenticated();
            _throwIfApiError(response, true, "get current user");
            _currentUser = response.data;
        } catch (e) {
            echo.error(e);
        }

        return _currentUser;
    },

    /**
     * Retrieves github auth token
     */
    async getToken() {
        if (_token != null) {
            return _token;
        }

        if (!(await this.isTokenConfigured())) {
            const token = await this.promptForToken();
            this.configureToken(token);
        }

        _token = await _getTokenFromConfig();

        return _token;
    },

    async isTokenConfigured() {
        return (await _getTokenFromConfig()) != null;
    },

    /**
     * Requests user's github personal access token
     */
    async promptForToken() {
        echo.headerError("Github authentication is not currently configured");
        echo.message(`See instructions: ${this.configAuthDocsUrl}`);

        git.openWebBrowser(this.configAuthTokenUrl);

        _prompt = userPrompt.getPrompt();

        return await _prompt.questionAsync(
            "Please enter personal access token (with repo permissions): "
        );
    },

    /**
     * Lists all AndcultureCode repositories for the given username
     *
     * @param {string} username optional username - if not supplied, retrieves from AndcultureCode organization account
     * @param {function} filter optional filter function to perform on result set
     */
    async repositories(username, filter) {
        if (username == null) {
            return null;
        }

        try {
            return await _list(
                _client().repos.listForUser,
                { username },
                filter
            );
        } catch (error) {
            echo.error(
                `There was an error listing repositories by user ${username}: ${error}`
            );
            return null;
        }
    },

    /**
     * Removes a topic from all AndcultureCode repositories
     *
     * @param {string} topic Topic to be removed
     */
    async removeTopicFromAllRepositories(topic) {
        if (StringUtils.isEmpty(topic)) {
            echo.error("Topic name is required");
            return;
        }

        const andcultureRepos = await this.repositoriesByAndculture();
        const repoNames = andcultureRepos.map((e) => e.name);

        // Safe guard against accidental command runs
        await _promptUpdateAllRepos(
            `remove the topic '${topic}'`,
            repoNames.length
        );

        await js.asyncForEach(repoNames, async (repo) => {
            await this.removeTopicFromRepository(
                topic,
                this.andcultureOrg,
                repo
            );
        });
    },

    /**
     * Removes a topic from a given repository
     *
     * @param {string} topic Topic to be removed
     * @param {string} owner user or organization name owning the repo
     * @param {string} repoName short name of repository (excluding user/organization)
     */
    async removeTopicFromRepository(topic, owner, repoName) {
        if (!_validateTopicInputOrExit(topic, owner, repoName)) {
            return null;
        }

        const updateFunction = (existingTopics) =>
            existingTopics.filter((existingTopic) => existingTopic !== topic);

        const updateResult = await _updateTopicsForRepo(
            updateFunction,
            owner,
            repoName
        );

        _outputUpdateTopicResult(repoName, updateResult);
        return updateResult;
    },

    /**
     * Lists all andculture organization repositories
     * @param {string} username optional username of user account. if null, returns main andculture
     * organization repositories
     */
    async repositoriesByAndculture(username) {
        const fn =
            username == null
                ? this.repositoriesByOrganization
                : this.repositories;
        const name = username == null ? this.andcultureOrg : username;
        return await fn(name, _filterReposByAndcultureOrg);
    },

    /**
     * Lists all repositories for a given organization
     * @param {string} org name of organization. if null, set to andculture organization
     * @param {function} filter optional filter function to perform on result set
     */
    async repositoriesByOrganization(org, filter) {
        if (org == null) {
            org = this.andcultureOrg;
        }

        const options = {
            org,
            type: "public",
        };

        try {
            return await _list(_client().repos.listForOrg, options, filter);
        } catch (error) {
            echo.error(
                `There was an error listing repositories by organization ${org}: ${error}`
            );
            return null;
        }
    },

    /**
     * Returns the topics for a specific repository
     *
     * @param {string} ownerName User or organization that owns the repo
     * @param {string} repoName The 'short' name of the repo (excludes the owner/user/organization)
     * @returns {string[] | undefined} Array of topics related to the repository
     */
    async topicsForRepository(owner, repoName) {
        const actionText = "list topics";
        if (StringUtils.isEmpty(owner) || StringUtils.isEmpty(repoName)) {
            echo.error(
                `Owner and repository name are required to ${actionText}.`
            );
            return;
        }

        try {
            const response = await _client().repos.getAllTopics({
                owner: owner,
                repo: repoName,
            });

            _throwIfApiError(response, true, actionText);

            return response.data.names;
        } catch (error) {
            echo.error(
                `There was an error attempting to ${actionText} for repository ${repoName} by owner ${owner}: ${error}`
            );
            return;
        }
    },

    // #endregion Public Methods
};

// #endregion Public Members

// -----------------------------------------------------------------------------------------
// #region Private Functions
// -----------------------------------------------------------------------------------------

const _client = () => {
    const options = {};

    if (StringUtils.hasValue(_token)) {
        options.auth = _token;
    }

    return new Octokit(options);
};

const _filterReposByAndcultureOrg = (repos) =>
    repos.filter((r) => r.name.startsWith(github.andcultureOrg));

const _getConfigContents = (token) => `
machine ${API_DOMAIN}
    login ${token}
`;

const _getTokenFromConfig = async () => {
    try {
        const auth = createNetrcAuth();
        const result = await auth();
        return result != null ? result.token : null;
    } catch (error) {
        return null;
    }
};

/**
 * Retrieves all records for a given list command, accounting for pagination
 * @param {object} command
 * @param {object} options
 * @param {(results: object[]) => object[]} filter optional filter function to perform on result set
 */
const _list = async (command, options, filter) => {
    options.per_page = 100; // github api max

    let results = [];

    await _client()
        .paginate(command, options)
        .then((response) => {
            results = results.concat(response);
            return response;
        });

    if (filter != null) {
        results = filter(results);
    }

    return results;
};

/**
 * Outputs information for a topic update operation
 *
 * @param {string} repoName short name of repository (excluding user/organization)
 * @param {string[] | undefined} result Result to concatenate topic names from
 */
const _outputUpdateTopicResult = (repoName, result) => {
    // If nothing came back from the update, an error message should already have been displayed.
    if (result == null) {
        return;
    }

    echo.success(`Updated topics for ${repoName}`);
    echo.message(result.join(", "));
};

/**
 * Prompts the user to confirm an action affecting multiple repositories to prevent accidental changes
 *
 * @param {string} actionText Text representing the action to be performed on all repos
 * @param {number} repoCount Number of repos that will be affected by the change
 */
const _promptUpdateAllRepos = (actionText, repoCount) =>
    userPrompt.confirmOrExit(
        `Are you sure you want to ${actionText} for ${yellow(repoCount)} ${
            github.andcultureOrg
        } repos?`
    );

/**
 * Throws an error if provided github api response isn't successful
 * @param {OctokitResponse} response API response object
 * @param {boolean} expectData In addition to a successful response, we expect data on the result
 * @param {string} actionText text explaining what authentication required action is being attempted
 */
const _throwIfApiError = (response, expectData, actionText) => {
    const data = response.data;
    const status = response.status;

    // HTTP OK (200), Created (201) or Accepted (202) are considered successful
    if (status >= 200 && status <= 202 && (!expectData || data != null)) {
        return;
    }

    throw new Error(
        `Failed to ${actionText} - Status: ${status}, Data: ${JSON.stringify(
            data
        )}`
    );
};

/**
 * Updates the set of topics for a given repository based on the given updater function.
 *
 * @param {(existingTopics: string[]) => string[]} updateFunc Manipulation function to be run on the
 * existing topic list for a repo.
 * @param {string} owner user or organization name owning the repo
 * @param {string} repoName short name of repository (excluding user/organization)
 */
const _updateTopicsForRepo = async (updateFunc, owner, repoName) => {
    const actionText = "update topics";
    if (!(await _verifyTokenFor(actionText))) {
        return;
    }

    const existingTopics = await github.topicsForRepository(owner, repoName);
    if (existingTopics == null) {
        return;
    }

    const updatedTopics = updateFunc(existingTopics);
    try {
        const response = await _client().repos.replaceAllTopics({
            owner: owner,
            repo: repoName,
            names: updatedTopics,
        });

        _throwIfApiError(response, true, actionText);

        return response.data.names;
    } catch (error) {
        echo.error(`Failed to ${actionText} for repo ${repoName}: ${error}`);
        return null;
    }
};

/**
 * Validates standard user input
 *
 * @param {string} owner user or organization name owning the repo
 * @param {string} repoName short name of repository (excluding user/organization)
 */
const _validateInputOrExit = (owner, repoName) => {
    if (StringUtils.hasValue(owner) && StringUtils.hasValue(repoName)) {
        return true;
    }

    echo.error("Owner and repository name must be provided");
    shell.exit(1);
    return false;
};

/**
 * Validates user input for updating topics
 *
 * @param {string} topic Topic to be updated
 * @param {string} owner user or organization name owning the repo
 * @param {string} repoName short name of repository (excluding user/organization)
 */
const _validateTopicInputOrExit = (topic, owner, repoName) => {
    if (_validateInputOrExit(owner, repoName) && StringUtils.hasValue(topic)) {
        return true;
    }

    echo.error("Topic must be provided");
    shell.exit(1);
    return false;
};

/**
 * Attempts to retrieve authentication token if it isn't configured
 * @param {string} actionText text explaining what authentication required action is being attempted
 */
const _verifyTokenFor = async (actionText) => {
    const token = await github.getToken();

    if (StringUtils.hasValue(token)) {
        return true;
    }

    echo.error(`Failed to ${actionText} - authentication is not configured`);

    return null;
};

// #endregion Private Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

module.exports = github;

// #endregion Exports
