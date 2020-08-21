// -----------------------------------------------------------------------------------------
// #region Functions
// -----------------------------------------------------------------------------------------

/**
 *  Mocked version of the `psList` function exported from the `ps-list` module.
 */
const psList = jest.fn(() => []);

// #endregion Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

module.exports = psList;

// #endregion Exports
