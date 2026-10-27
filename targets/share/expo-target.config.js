/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: "share",
  name: "SimmerShare",
  displayName: "Simmer",
  icon: "../../assets/images/icon.png",
  frameworks: ["UIKit", "Social", "UniformTypeIdentifiers"],
  deploymentTarget: "15.1",
});
