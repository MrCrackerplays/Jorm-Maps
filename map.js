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

function style(feature) {
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

function onMoveEnd() {
	if (map.getZoom() != prevZoom) {
		updateLocations();
		prevZoom = map.getZoom();
	}
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

function isExternalLink(url) {
	const tmp = document.createElement('a');
	tmp.href = url;
	return tmp.host !== window.location.host;
};

function updateSidebar() {
	if (localStorage.getItem("sidebar-hidden") === "true")
		document.getElementById("toggle-sidebar").checked = true;
	else
		document.getElementById("toggle-sidebar").checked = false;
}

function updateFloor() {
	let val = document.getElementById("floorSlider").value;
	let old_floor = localStorage.getItem("floor-level");
	if (old_floor != null)
		old_floor = parseInt(old_floor);
	localStorage.setItem("floor-level", val);
	document.getElementById("floorOutput").value = val;
	for (let loc in locations) {
		if (locations[loc].images != undefined) {
			let floor = getClosestFloor(locations[loc].images);
			if (floor == undefined)
				continue;
			if (old_floor != null)
				imageLayer.removeLayer(images[loc][old_floor]);
			imageLayer.addLayer(images[loc][floor]);
		}
	}
}

function getClosestFloor(place_images) {
	// if (images != undefined) { //TODO: FIX THIS TO REFERENCE THE RIGHT GROUP OF IMAGES, AND LET THE FLOOR CHANGING UPDATE THAT GROUP OF IMAGES
	let slider = document.getElementById("floorSlider");
	let max = parseInt(slider.getAttribute("max"));
	let min = parseInt(slider.getAttribute("min"));
	let current = parseInt(slider.value);
	let found = undefined;
	for (let i = current; i <= max; i++)
		if (place_images[i] != undefined)
			found = i;
	if (found == undefined)
		for (let i = current; i >= min; i--)
			if (place_images[i] != undefined)
				found = i;
	return found;
}


function updateMarker(marker, name) {
	if (map.getZoom() >= marker.meta.layers.min && map.getZoom() <= marker.meta.layers.max)
		markerCluster.addLayer(markers[name]);
	else
		markerCluster.removeLayer(markers[name]);
}
function updateImage(image, name) {
	let layer = Array.isArray(images[name]) ? images[name][getClosestFloor(locations[name].images)] : images[name];
	if (map.getZoom() >= image.meta.layers.min && map.getZoom() <= image.meta.layers.max)
		imageLayer.addLayer(layer);
	else
		imageLayer.removeLayer(layer);
}

function rotatePoint(pivot, angle_radians, point) {
	const s = Math.sin(angle_radians);
	const c = Math.cos(angle_radians);
	let rotated = [point[0] - pivot[0], point[1] - pivot[1]];
	let xnew = rotated[1] * c - rotated[0] * s;
	let ynew = rotated[1] * s + rotated[0] * c;
	rotated[1] = xnew + pivot[1];
	rotated[0] = ynew + pivot[0];
	return rotated;
}

function getBounds(location, name) {
	if (location.bounds != undefined)
		return [L.latLng(location.bounds[0][0], location.bounds[0][1]),
		L.latLng(location.bounds[1][0], location.bounds[1][1])];
	if (location.width != undefined && location.height != undefined && (location.topleft != undefined || location.center != undefined)) {
		let width = calculateLength(location.width);
		let height = calculateLength(location.height);
		let topleft;
		if (location.center != undefined) {
			let middle = getCoordinates(location.center, name, false);
			middle = [middle.lat, middle.lng];
			topleft = [middle[0] - (height / 2), middle[1] - (width / 2)];
			if (location.rotation != undefined)
				topleft = rotatePoint(middle, 33 * (Math.PI / 180), topleft);
		} else {
			topleft = location.topleft;
		}
		return [L.latLng(topleft),
		L.latLng(topleft[0] + height, topleft[1] + width)];
	}
	console.error("Not able to get corners based on location data");
	return [L.latLng(0, 0), L.latLng(0, 0)];
}

function getDistancePerHour() {
	const FOOT_PER_MINUTE_TO_MILE_PER_HOUR = 0.01; // 400ft->4mile 300ft->3mile 200ft->2mile according to PHB travel pace
	const FOOT_PER_MINUTE = 300;//should be changeable by user
	const MILE_PER_HOUR = FOOT_PER_MINUTE * FOOT_PER_MINUTE_TO_MILE_PER_HOUR;
	return MILE_PER_HOUR;
}

function getDistancePerDay() {
	const TRAVEL_HOURS_PER_DAY = 8;//should be changeable by user
	const MILE_PER_HOUR = getDistancePerHour();
	const TRAVEL_MILES_PER_DAY = MILE_PER_HOUR * TRAVEL_HOURS_PER_DAY;
	return TRAVEL_MILES_PER_DAY;
}

function calculateLength(distance) {
	if (distance.meter != undefined)
		return distance.meter;
	if (distance.feet != undefined)
		return distance.feet * METER_PER_FOOT;
	if (distance.tiles != undefined)
		return distance.tiles * 5 * METER_PER_FOOT;
	if (distance.kilometers != undefined)
		return distance.kilometers * 1000;
	if (distance.mile != undefined)
		return distance.mile * METER_PER_MILE;
	if (distance.duration != undefined) {
		if (distance.duration.days != undefined)
			return METER_PER_MILE * getDistancePerDay() * distance.duration.days;
		if (distance.duration.hours != undefined)
			return METER_PER_MILE * getDistancePerHour() * distance.duration.hours;
		if (distance.duration.hour_timestamp != undefined) {
			const timeArray = distance.duration.hour_timestamp.split(":");
			return METER_PER_MILE * getDistancePerHour() * (parseInt(timeArray[0]) + parseInt(timeArray[1]) / 60);
		}
	}
	return undefined;
}

function getDegreesFromCompass(compass) {
	if (compass == "N")
		return 0;
	if (compass == "NNE")
		return 22.5;
	if (compass == "NE")
		return 45;
	if (compass == "ENE")
		return 67.5;
	if (compass == "E")
		return 90;
	if (compass == "ESE")
		return 112.5;
	if (compass == "SE")
		return 135;
	if (compass == "SSE")
		return 157.5;
	if (compass == "S")
		return 180;
	if (compass == "SSW")
		return 202.5;
	if (compass == "SW")
		return 225;
	if (compass == "WSW")
		return 247.5;
	if (compass == "W")
		return 270;
	if (compass == "WNW")
		return 292.5;
	if (compass == "NW")
		return 315;
	if (compass == "NNW")
		return 337.5;
	return undefined;
}

function calculateAngle(direction) {
	if (direction.degrees != undefined)
		return direction.degrees - 90;
	if (direction.radians != undefined)
		return (direction.radians * 180 / Math.PI) - 90;
	if (direction.compass != undefined)
		return getDegreesFromCompass(direction.compass) - 90;
	return undefined;
}

function getStartCoordinates(origin, name) {
	if (origin.latlng != undefined)
		return L.latLng(origin.latlng);
	if (origin.location != undefined && origin.location != name)
		return getCoordinates(locations[origin.location].marker.meta.location, origin.location);
	return undefined;
}

function calculateCoordinates(distance, direction, origin, name) {
	let length = calculateLength(distance);
	let angle = calculateAngle(direction);
	let start = getStartCoordinates(origin, name);
	if (length != undefined && angle != undefined && start != undefined)
		return L.latLng(start.lat + Math.sin(angle*Math.PI/180) * length, start.lng + Math.cos(angle*Math.PI/180) * length);
	console.error("Not able to get " + (length ? "" : "length ") + (angle ? "" : "angle ") + (start ? "" : "start ") + "based on location data for", name);
	return L.latLng(0, 0);
}

function offsetCoordinates(origin, offset, name) {
	let start = getStartCoordinates(origin, name);
	start = L.latLng(start.lat + calculateLength(offset.lat), start.lng + calculateLength(offset.lng));
	return start;
}

let coordinates = {};
let resolving = [];
function getCoordinates(location, name, for_marker = true) {
	if (for_marker && coordinates[name])
		return coordinates[name];
	let result = L.latLng(0, 0);
	if (resolving.includes(name)) {
		console.error("Circular reference for", name);
		return result;
	}
	resolving.push(name);
	if (location.latlng != undefined)
		result = L.latLng(location.latlng);
	else if (location.origin != undefined && location.offset != undefined)
		result = offsetCoordinates(location.origin, location.offset, name);
	else if (location.distance != undefined && location.direction != undefined && location.origin != undefined)
		result = calculateCoordinates(location.distance, location.direction, location.origin, name);
	else
		console.error("Not able to get coordinates based on location data for", name);
	if (for_marker)
		coordinates[name] = result;
	resolving.splice(resolving.indexOf(name), 1);
	return result;
}

function loadImages() {
	for (let loc in locations) {
		if (locations[loc].image != undefined) {
			let options = {};
			for (let opt in locations[loc].image)
				if (opt != "meta")
					options[opt] = locations[loc].image[opt];
			let bounds = getBounds(locations[loc].image.meta.location, loc);
			if (!isExternalLink(locations[loc].image.meta.file))
				locations[loc].image.meta.file = "images/" + locations[loc].image.meta.file;
			if (locations[loc].image.meta.location.rotation != undefined) {
				options.rotation = locations[loc].image.meta.location.rotation;
				images[loc] = L.rotateImageOverlay(locations[loc].image.meta.file, bounds, options);
			} else {
				images[loc] = L.imageOverlay(locations[loc].image.meta.file, bounds, options);
			}
		} else if (locations[loc].images != undefined) {
			images[loc] = [];
			for (let i = 0; i < locations[loc].images.length; i++) {//TODO:FIX THIS MY DUDE
				let options = {};
				for (let opt in locations[loc].images[i])
					if (opt != "meta")
						options[opt] = locations[loc].images[i][opt];
				let bounds = getBounds(locations[loc].images[i].meta.location, loc);
				if (!isExternalLink(locations[loc].images[i].meta.file))
					locations[loc].images[i].meta.file = "images/" + locations[loc].images[i].meta.file;
				if (locations[loc].images[i].meta.location.rotation != undefined) {
					options.rotation = locations[loc].images[i].meta.location.rotation;
					images[loc][i] = L.rotateImageOverlay(locations[loc].images[i].meta.file, bounds, options);
				} else {
					images[loc][i] = L.imageOverlay(locations[loc].images[i].meta.file, bounds, options);
				}
			}
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
				markers[loc] = L.marker(getCoordinates(locations[loc].marker.meta.location, loc), options);
			if (locations[loc].marker.meta.click.jump_zoom)
				markers[loc].on('click', function(e) {
					map.flyTo(getCoordinates(locations[loc].marker.meta.location, loc), locations[loc].marker.meta.click.jump_zoom);
				});
			markers[loc].bindTooltip(loc, {});
		}
	}
}

function updateLocations() {
	for (let loc in locations){
		if (locations[loc].marker != undefined)
			updateMarker(locations[loc].marker, loc)
		if (locations[loc].image != undefined)
			updateImage(locations[loc].image, loc)
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

L.rotateImageOverlay = function(url, bounds, options) {
	return new L.RotateImageOverlay(url, bounds, options);
};
// A quick extension to allow image layer rotation.
L.RotateImageOverlay = L.ImageOverlay.extend({
	options: {rotation: 0},
	_animateZoom: function(e){
		L.ImageOverlay.prototype._animateZoom.call(this, e);
		var img = this._image;
		img.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.rotation + 'deg)';
	},
	_reset: function(){
		L.ImageOverlay.prototype._reset.call(this);
		var img = this._image;
		img.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.rotation + 'deg)';
	}
});


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


document.getElementById("toggle-sidebar").addEventListener("change", function () {
	localStorage.setItem("sidebar-hidden", this.checked.toString());
	updateSidebar();
});
document.querySelector(".toggle-sidebar-label").addEventListener("keydown", (e) => {
	if (e.code === "Space" || e.code === "Enter")
		e.target.click();
});

document.getElementById("map").addEventListener('transitionend', function(e) {
	map.invalidateSize();
});

document.getElementById("map").addEventListener("keydown", (e) => {
	if (e.code === "Space" || e.code === "Enter")
		e.target.click();
}, true);

var locations;
var markers = {};
var images = {};

var markerCluster = L.markerClusterGroup({});
markerCluster.addTo(map);
var imageLayer = L.layerGroup([]);
imageLayer.addTo(map);

var prevZoom = map.getZoom();
let floor_level = localStorage.getItem("floor-level");
if (floor_level) {
	document.getElementById("floorSlider").value = parseInt(floor_level);
	document.getElementById("floorOutput").value = parseInt(floor_level);
}
updateSidebar();
let relative = "Dod'Estrin";
async function map_main() {
	const response = await fetch(LOCATIONS_JSON_URL);
	locations = await response.json();
	loadMarkers();
	loadImages();
	updateLocations();
	updateGrid();
	if (document.getElementById("debugGrid").checked)
		map.addLayer(debugCoordsGrid);
	map.addLayer(grid_holder);
	map.on('move', onMove);
	map.on('moveend', onMoveEnd);
	map.on('click', function(e) {
		console.log("Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng)
		console.log("Offset from", relative, "lat:", e.latlng.lat - markers[relative]._latlng.lat, "lng:", e.latlng.lng - markers[relative]._latlng.lng)
		console.log("Angle from", relative, ":", 90 + Math.atan2(e.latlng.lat - markers[relative]._latlng.lat, e.latlng.lng - markers[relative]._latlng.lng) * 180 / Math.PI, "distance:", map.distance(e.latlng, markers[relative]._latlng))
	});
}

map_main();