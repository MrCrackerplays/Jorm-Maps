const bounds = [[0, 0], [2560, 2560]];
var factorx = 0.125
var factory = 0.125
L.CRS.dod = L.extend({}, L.CRS.Simple, {
	projection: L.Projection.LonLat,
	transformation: new L.Transformation(factorx, 0, -factory, 0),
	// Changing the transformation is the key part, everything else is the same.
	// By specifying a factor, you specify what distance in meters one pixel occupies (as it still is CRS.Simple in all other regards).
	// In this case, I have a tile layer with 256px pieces, so Leaflet thinks it's only 256 meters wide.
	// I know the map is supposed to be 2048x2048 meters, so I specify a factor of 0.125 to multiply in both directions.
	// In the actual project, I compute all that from the gdal2tiles tilemapresources.xml, 
	// which gives the necessary information about tilesizes, total bounds and units-per-pixel at different levels.


	// Scale, zoom and distance are entirely unchanged from CRS.Simple
	scale: function (zoom) {
		return Math.pow(2, zoom);
	},

	zoom: function (scale) {
		return Math.log(scale) / Math.LN2;
	},

	distance: function (latlng1, latlng2) {
		var dx = latlng2.lng - latlng1.lng,
			dy = latlng2.lat - latlng1.lat;

		return Math.sqrt(dx * dx + dy * dy);
	},
	infinite: false
});
const map = L.map("map", {
	crs: L.CRS.dod
});
// const maplink = "0/{-y}/{x}.png";
const image = L.tileLayer("{z}/{y}/{x}.png", { tileSize: L.point(256, 256) }).addTo(map);
map.setView([500, 500], 0);
// L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
// 	attribution:
// 		'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
// }).addTo(map);

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

const scale = L.control.scale({ updateWhenIdle: true }).addTo(map);

// function testHexUpdate() {
//   setInterval(function() {
//     const bound2 = boundForHex.map(e => [
//       e[0] + Math.random(),
//       e[1] - Math.random()
//     ]);
//     p.setData(bound2);
//   }, 1000);
// }
