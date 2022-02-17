const bounds = [[0,0], [100,100]];
const map = L.map("map", {
  crs: L.CRS.Simple
});
const maplink = "https://lh3.googleusercontent.com/fife/AAWUweV8lqN7QmiWV4iGg6y78a0KtITqMaPxkthLkle_Up4u-ZH_c6F8-x6L344rn4QbE3PXqxD4Va3iaeGV82ux0CvxqO6O5hKdDAq3s--Wz3PtbbtlBgA7My8PavLzS_fdG3Z8cD_cahPGk8angn_ZMIqQSZyRAWxGCGI0qvQTyzGJ9xtKARpFqY7jCSVLD9aevuJO41Tzh23T-e_lZmmhGpNS5jXtH10kax0XCkvDYrsiEmFHLXxu1OLIJ4oT7ySKxQ0VAXx2y9Ps32GozonKYBVvfgz0QvsWMBPhMRLSTAu8UcgUzGiq-jkJwOAC1j0M7kFkYfHNAmW6G8KPs1tCJXdHCgRH0xLR9GgTgaoNOMe245HKH-q8VckPyjCq7eKaUFVSrcJpbWjJR2Y85dF4P9ST3BVGfQCblry2NdyFXRHBaiH9O1rlXEr1yHwMKxMpkZKYvjn-567WgatGldAHEUSldiYwvvc7xQuQKTmk4TOFpqz8dYshYeO9QhE4z-1qSsoSfIXPE9_Pt9XnJfyNOoVzJUVruvvBY7lGJwrelMe7AKlJm0XPy8S3xixCBAEpxqUd6r9fWB2Qy2FF61H-R58LHMpk9cqC7IRLCKlTnhMv8lWZ99uR9ZsIj_mwujNQTlFs2xTA0jLaphscs4uv0s4maZeOVmPjmtyABX6UQ82IL2XcVBIu1CW_qiGgw_MxIXdhYCJjr0FfXJbHqB0TAUo88rR8h3sRGbM=w1280-h864";
const image = L.imageOverlay(maplink, bounds).addTo(map);
map.setView([50, 50], 0);
// L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
//   attribution:
//     '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
//   }).addTo(map);

const boundForHex = [
  [5, 5],
  [10, 10]
];

const hexOption = {
  type: "hexagon",
  pathStyleOption: {
    // color: "blue"
  }
};

const partition = L.partition(hexOption);
partition.setData(boundForHex);
const layerGroup = partition.addTo(map);

const scale = L.control.scale({  }).addTo(map);

// function testHexUpdate() {
//   setInterval(function() {
//     const bound2 = boundForHex.map(e => [
//       e[0] + Math.random(),
//       e[1] - Math.random()
//     ]);
//     p.setData(bound2);
//   }, 1000);
// }
