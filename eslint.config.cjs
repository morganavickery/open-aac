/**
 * eslint.config.cjs — tiny shim that re-uses the legacy .eslintrc.cjs config
 * so `eslint` (v9+) finds a config file without a full migration to flat configs.
 */
module.exports = {
  ...require('./.eslintrc.cjs')
};
