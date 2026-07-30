function readPackage(pkg) {
  if (pkg.name === "pg" && pkg.optionalDependencies) {
    delete pkg.optionalDependencies["pg-native"];
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};