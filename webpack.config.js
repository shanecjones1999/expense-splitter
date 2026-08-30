module.exports = function (options) {
  return {
    ...options,
    plugins: options.plugins.filter(
      (plugin) => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin',
    ),
  };
};
