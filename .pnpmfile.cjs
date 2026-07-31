function readPackage(pkg) {
  if (pkg.name === "pg") {
    if (pkg.peerDependencies?.["pg-native"]) {
      console.log(">>> STRIPPING pg-native peerDependency from:", pkg.name, pkg.version);
      delete pkg.peerDependencies["pg-native"];
    }
    if (pkg.peerDependenciesMeta?.["pg-native"]) {
      delete pkg.peerDependenciesMeta["pg-native"];
    }
    if (pkg.optionalDependencies?.["pg-native"]) {
      delete pkg.optionalDependencies["pg-native"];
    }
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};