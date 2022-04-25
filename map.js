const METER_PER_MILE = 1609.344;
const METER_PER_FOOT = 0.3048;
const METER = 1;
const FOOT_PIXEL_MODIFIER = METER / METER_PER_FOOT; //transform the default length (1 meter) of a single pixel to 1 foot
const TARGET_ZOOM = 22;
const TWO_POW = Math.pow(2, TARGET_ZOOM);
const TARGET_PIXEL_LENGTH = 256 / TWO_POW; //how many pixels long we want our target to be
const FOOT_PER_TARGET = 5; //how many feet long we want our target to be
//this means that at zoom level 22 our target of 5 feet will be 256 pixels long, which would be 1 tile assuming tiles are 256x256px
const SCALE_MODIFIER = TARGET_PIXEL_LENGTH * FOOT_PIXEL_MODIFIER / FOOT_PER_TARGET;
L.CRS.dod = L.extend({}, L.CRS.Simple, {
	projection: L.extend( L.Projection.LonLat, {
		bounds: L.bounds([0, 0], [METER_PER_FOOT * 5 * TWO_POW , METER_PER_FOOT * 5 * TWO_POW])
	}),
	transformation: new L.Transformation(SCALE_MODIFIER, 0, SCALE_MODIFIER, 0),
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

let oef = true;
function style(feature) {
	if (oef) {
		console.log(feature);
		oef = false;
	}
	return {
		fillColor: 'transparent',
		weight: 1,
		opacity: 1,
		color: 'darkgrey',
		dashArray: '0',
		fillOpacity: 0.5
	};
}

function highlightFeature(e) {
	var layer = e.target;

	layer.setStyle({
		weight: map.getZoom() == 2 ? 1 : 2,
		color: '#666',
		fillOpacity: 0.7
	});

	if (!L.Browser.ie && !L.Browser.opera) {
		layer.bringToFront();
	}
}

function resetHighlight(e) {
	hexGrid[0].resetStyle(e.target);
}

function click(e) {
	console.log(e.target)
	popup = L.popup()
					.setLatLng(e.latlng)
					.setContent("Hexagon ID: "+e.target.feature.properties.id+"<br/>"+e.latlng)
					.openOn(map);
}

function onEachFeature(feature, layer) {
	layer.on({
		mouseover: highlightFeature,
		mouseout: resetHighlight,
		click: click
	});
}

// let move_end_call = undefined;
function onMoveEnd() {
	// move_end_call = setTimeout(function () {
	if (map.getZoom() != prevZoom) {
		updateLocations();
		prevZoom = map.getZoom();
	}
	// }, 850);
}

let move_call = undefined;
let grid_holder = L.layerGroup();
function onMove() {
	clearTimeout(move_call);
	map.removeLayer(grid_holder);
	move_call = setTimeout(function () {
		updateGrid();
		if (map.getZoom() >= 2 && map.getZoom() < 8)
			map.addLayer(grid_holder);
	}, 650);
}
function updateGrid() {
	// if (map.getZoom() >= 9) {
	// 	if (map.hasLayer(townimage) == false)
	// 		map.addLayer(townimage);
	// } else if (map.hasLayer(townimage)) {
	// 	map.removeLayer(townimage);
	// }
	if (map.getZoom() >= 2 && map.getZoom() < 8) {
		for (let i = 0; i < CLUSTER_COLUMNS * CLUSTER_ROWS; i++) {
			if (map.getBounds().intersects(hexGrid[i].getBounds())) {
				if (grid_holder.hasLayer(hexGrid[i]) == false) grid_holder.addLayer(hexGrid[i]);
			} else
				if (grid_holder.hasLayer(hexGrid[i])) grid_holder.removeLayer(hexGrid[i]);
		}
	}
}

function toggleDebug() {
	if (document.getElementById("debugGrid").checked)
		map.addLayer(debugCoordsGrid);
	else
		map.removeLayer(debugCoordsGrid);
}

function updateSidebar() {
	if (localStorage.getItem("sidebar-hidden") == "true") {
		document.getElementById("map").style.setProperty("transition-delay", "1ms");
		document.body.style.setProperty("--sidebar-offset", "0px");
	} else {
		document.getElementById("map").style.removeProperty("transition-delay");
		document.body.style.removeProperty("--sidebar-offset");
	}
}








var map = L.map('map', {
	crs: L.CRS.dod,
	center: [2815244.0985, 3137180.0985],
	preferCanvas: true,
	inertiaMaxSpeed: 3000,
	zoom: 17,
	maxZoom: TARGET_ZOOM,
	maxBoundsViscosity: 1.0
});
map.setMaxBounds(L.latLngBounds(L.latLng(L.CRS.dod.projection.bounds.min.x - 500000, L.CRS.dod.projection.bounds.min.y - 500000),
	L.latLng(L.CRS.dod.projection.bounds.max.x + 500000, L.CRS.dod.projection.bounds.max.y + 500000)));
const scale = L.control.scale({ updateWhenIdle: true }).addTo(map);

L.GridLayer.DebugCoords = L.GridLayer.extend({
	createTile: function (coords, done) {
		var tile = document.createElement("div");
		var text = document.createTextNode([coords.x, coords.y, coords.z].join(', '));
		tile.appendChild(text);

		tile.classList.add("debug-tile");
		if ((coords.x + coords.y) % 2 == 0) {
			if (coords.x % 2 == 0)
				tile.classList.add("beppie");
			else
				tile.classList.add("beppoe");
		}

		setTimeout(function () {
			done(null, tile); // Syntax is 'done(error, tile)'
		}, 500 + Math.random() * 1500);

		return tile;
	}
});
L.gridLayer.debugCoords = function (opts) {
	return new L.GridLayer.DebugCoords(opts);
};
var debugCoordsGrid = L.gridLayer.debugCoords({tileSize: 256, zIndex:100});



const ROOT_3 = Math.sqrt(3);
const HEX_SIDE_LEN = METER_PER_MILE * 24 / ROOT_3;
const WORLD_WIDTH = map.options.crs.projection.bounds.max.x - map.options.crs.projection.bounds.min.x;
const WORLD_HEIGHT = map.options.crs.projection.bounds.max.y - map.options.crs.projection.bounds.min.y;
const TOTAL_COLUMNS = Math.ceil(WORLD_WIDTH / (HEX_SIDE_LEN * 1.5));
const TOTAL_ROWS = Math.ceil(WORLD_HEIGHT / (HEX_SIDE_LEN * ROOT_3));
const CLUSTER_SIZE = 8;
const CLUSTER_COLUMNS = TOTAL_COLUMNS < CLUSTER_SIZE * 2 ? 1 : CLUSTER_SIZE;
const CLUSTER_ROWS = TOTAL_ROWS < CLUSTER_SIZE * 2 ? 1 : CLUSTER_SIZE;
const COLUMNS = Math.floor(TOTAL_COLUMNS / CLUSTER_COLUMNS);
const ROWS = Math.floor(TOTAL_ROWS / CLUSTER_ROWS);
const ORIGIN_HEX_CENTER = [map.options.crs.projection.bounds.min.x, map.options.crs.projection.bounds.min.y];
var hexGrid = [];
for (let i = 0; i < CLUSTER_COLUMNS; i++) {
	const local_columns = i == CLUSTER_SIZE - 1 ? COLUMNS + (TOTAL_COLUMNS % CLUSTER_COLUMNS) : COLUMNS;
	for (let j = 0; j < CLUSTER_ROWS; j++) {
		const local_rows = j == CLUSTER_SIZE - 1 ? ROWS + (TOTAL_ROWS % CLUSTER_ROWS) : ROWS;
		hexGrid[j + i * CLUSTER_ROWS] = L.geoJson(H.hexagonalGrid([ORIGIN_HEX_CENTER[0] + (i * COLUMNS * 1.5 * HEX_SIDE_LEN),
							ORIGIN_HEX_CENTER[1] + (j * ROWS * ROOT_3 * HEX_SIDE_LEN)],
						local_columns, local_rows, HEX_SIDE_LEN, COLUMNS * i, ROWS * j), {
							style: style,
							onEachFeature: onEachFeature
		});
	}
}

const LOCATIONS_JSON_URL = "locations.json";



// var testlayer = L.tileLayer.fallback('jorma{z}.png', {
// 	maxZoom: TARGET_ZOOM,
// 	maxNativeZoom: TARGET_ZOOM,
// 	tileSize: 256});
// map.addLayer(testlayer);

// var locations;
// async function loadLocations() {
// 	const response = await fetch('locations.json');
// 	locations = await response.json();
// }
// var testimage = L.imageOverlay("SpireView.png", [[2779385.856, 2715847.996], [3611172.864, 3676271.300]],{
// 	opacity: 0.98,
// 	pane: 'tilePane'
// }).addTo(map);
// var townimage = L.imageOverlay("DodEstrin.jpg", [[2815148.954, 3137025.904], [2815409.254, 3137373.376]],{
// 	opacity: 0.98,
// 	pane: 'tilePane'
// });
document.getElementById("map").addEventListener('transitionend', function(e) {
	map.invalidateSize();
});

var locations;
var markers = {};
var images = {};

var markerCluster = L.markerClusterGroup({});
markerCluster.addTo(map);
var imageLayer = L.layerGroup([]);
imageLayer.addTo(map);
function updateMarker(marker, name) {
	if (map.getZoom() >= marker.meta.layers.min && map.getZoom() <= marker.meta.layers.max)
		markerCluster.addLayer(markers[name]);
	else
		markerCluster.removeLayer(markers[name]);
}
function updateImage(image, name) {
	if (map.getZoom() >= image.meta.layers.min && map.getZoom() <= image.meta.layers.max)
		imageLayer.addLayer(images[name]);
	else
		imageLayer.removeLayer(images[name]);
}

function getCorners(location) {
	//https://github.com/publiclab/Leaflet.DistortableImage#corners
	if (location.corners)
		return [L.latLng(location.corners[0]),
		L.latLng(location.corners[1]),
		L.latLng(location.corners[2]),
		L.latLng(location.corners[3])];
	if (location.bounds)
		return [L.latLng(location.bounds[0][0], location.bounds[0][1]),
		L.latLng(location.bounds[0][0], location.bounds[1][1]),
		L.latLng(location.bounds[1][0], location.bounds[0][1]),
		L.latLng(location.bounds[1][0], location.bounds[1][1])];
	console.warn("Not able to get corners based on location data");
	return [L.latLng(0, 0), L.latLng(0, 0), L.latLng(0, 0), L.latLng(0, 0)];
}

function getCoordinates(location) {
	if (location.latlng)
		return (L.latLng(location.latlng));
	console.warn("Not able to get coordinates based on location data");
	return (L.latLng(0, 0));
}

function loadImages() {
	for (let loc in locations) {
		if (locations[loc].image) {
			let options = {};
			for (let opt in locations[loc].image)
				if (opt != "meta")
					options[opt] = locations[loc].image[opt];
			// options.corners = getCorners(locations[loc].image.meta.location);
			// options.actions = [];
			// images[loc] = L.distortableImageOverlay(locations[loc].image.meta.file, options);
			images[loc] = L.imageOverlay(locations[loc].image.meta.file, locations[loc].image.meta.location.bounds, options);
		}
	}
}

function loadMarkers() {
	for (let loc in locations) {
		if (locations[loc].marker) {
			let options = {};
			for (let opt in locations[loc].marker)
				if (opt != "meta")
					options[opt] = locations[loc].marker[opt];
			markers[loc] = L.marker(getCoordinates(locations[loc].marker.meta.location), options);
			if (locations[loc].marker.meta.click.jump_zoom)
				markers[loc].on('click', function(e) {
					map.flyTo(getCoordinates(locations[loc].marker.meta.location), locations[loc].marker.meta.click.jump_zoom);
				});
			markers[loc].bindPopup("Oh hey, look it's " + loc + "!");
			markers[loc].on('mouseover', function(e) {
				this.openPopup();
			});
			markers[loc].on('mouseout', function(e) {
				this.closePopup();
			});
		}
	}
}

function updateLocations() {
	for (let loc in locations){
		if (locations[loc].marker)
			updateMarker(locations[loc].marker, loc)
		if (locations[loc].image)
			updateImage(locations[loc].image, loc)
	}
}

var prevZoom = map.getZoom();
async function main() {
	const response = await fetch(LOCATIONS_JSON_URL);
	locations = await response.json();
	loadImages();
	loadMarkers();
	updateLocations();
	updateGrid();
	if (document.getElementById("debugGrid").checked)
		map.addLayer(debugCoordsGrid);
	map.addLayer(grid_holder);
	map.on('move', onMove);
	map.on('move', onMoveEnd);
	map.on('click', function(e) {
		console.log("Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng)
	});
	console.log(map.distance(map.unproject([0, 0]), map.unproject([0, 100])) / METER_PER_FOOT);

	document.getElementById("hide-sidebar").addEventListener("click", function () {
		if (localStorage.getItem("sidebar-hidden") == "true")
			localStorage.setItem("sidebar-hidden", "false");
		else
			localStorage.setItem("sidebar-hidden", "true");
		updateSidebar();
	});
	updateSidebar();
}

main();