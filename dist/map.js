//disable inputs while loading
let inputElements = [];
inputElements.push(document.getElementById("floorSlider"), document.getElementById("debugGrid"),
	document.getElementById("movementSpeed"), document.getElementById("travelDuration"),
	document.getElementById("toggleMeasuring"), document.getElementById("relativeLocation"),
	document.getElementById("relativePlane"), document.getElementById("searchLocation"),
	document.getElementById("searchPlane"), document.getElementById("searchButton"));
for (let element in inputElements) {
	inputElements[element].disabled = true;
}

const FLAT_TOP = localStorage.getItem("flat-top") === "true"

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
	projection: L.extend(L.Projection.LonLat, {
		bounds: L.bounds([0, 0], [METER_PER_FOOT * 5 * TWO_POW, METER_PER_FOOT * 5 * TWO_POW])
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

function styleHex(feature) {
	return {
		fillColor: 'transparent',
		weight: 1,
		opacity: 1,
		dashArray: '0',
		fillOpacity: 0.5,
		color: HEX_COLOR
	};
}

function highlightHex(e) {
	var layer = e.target;

	layer.setStyle({
		weight: map.getZoom() == 2 ? 1 : 2,
		fillOpacity: 0.7,
		color: HEX_HIGHLIGHT
	});

	if (!L.Browser.ie && !L.Browser.opera) {
		layer.bringToFront();
	}
}

function resetHexHighlight(e) {
	hexGrid[0].resetStyle(e.target);
}

function onEachHex(feature, layer) {
	layer.on({
		mouseover: highlightHex,
		mouseout: resetHexHighlight
	});
}

function onMoveEnd() {
	// if (map.getZoom() != prevZoom) {
	updateLocations();
	// 	prevZoom = map.getZoom();
	// }
}

let move_call = undefined;
let grid_holder = L.layerGroup();
function onMove() {
	clearTimeout(move_call);
	map.removeLayer(grid_holder);
	const minbound = 2 + countJumps(24, HEX_TO_HEX_MILES);
	move_call = setTimeout(function () {
		updateHexGrid();
		if (map.getZoom() >= minbound && map.getZoom() < minbound + 6)//FUUUU
			map.addLayer(grid_holder);
	}, 650);
}

function countJumps(num1, num2) {
	if (num1 == num2)
		return 0;
	if (num1 > num2) {
		let count = 0;
		while (num1 > num2) {
			num1 /= 2;
			count++;
		}
		return count;
	} else {
		let count = 0;
		while (num1 < num2) {
			num1 *= 2;
			count--;
		}
		return count;
	}
}

function updateHexGrid() {
	const minbound = 2 + countJumps(24, HEX_TO_HEX_MILES);
	if (map.getZoom() >= minbound && map.getZoom() < (minbound + 6)) {
		for (let i = 0; i < CLUSTER_COLUMNS * CLUSTER_ROWS; i++) {
			if (map.getBounds().intersects(hexGrid[i].getBounds())) {
				if (grid_holder.hasLayer(hexGrid[i]) == false) grid_holder.addLayer(hexGrid[i]);
			} else
				if (grid_holder.hasLayer(hexGrid[i])) grid_holder.removeLayer(hexGrid[i]);
		}
	}
}

function toggleDebugGrid() {
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

function updateHexBox() {
	if (localStorage.getItem("flat-top") === "true")
		document.getElementById("toggle-hex-mode").checked = true;
	else
		document.getElementById("toggle-hex-mode").checked = false;
}

function updateHexToHex() {
	let hexdis = localStorage.getItem("hex-miles");
	if (hexdis)
		document.getElementById("hexToHex").value = hexdis;
	else
		document.getElementById("hexToHex").value = HEX_TO_HEX_MILES;
}

function updateHexColors() {
	let col = localStorage.getItem("hex-color");
	if (col)
		document.getElementById("hexColor").value = col;
	else
		document.getElementById("hexColor").value = HEX_COLOR;
	let hig = localStorage.getItem("hex-highlight");
	if (hig)
		document.getElementById("hexHighlightColor").value = hig;
	else
		document.getElementById("hexHighlightColor").value = HEX_HIGHLIGHT;
}

let planeLayers = {};
function updatePlane() {
	let radios = document.getElementsByName("plane");
	let val = undefined;
	let i;
	for (i = 0; val == undefined && i < radios.length; i++)
		if (radios[i].checked)
			val = radios[i].value;
	let old_val = localStorage.getItem("plane");
	if (old_val) {
		map.removeLayer(planeLayers[old_val].imageLayer);
		planeLayers[old_val].markerCluster.off();
		//this is to silence a warn message that always happens when removing a markerCluster from map for some reason
		//and I can't find the cause of it but the message is driving me insane, so I'm silencing it
		let original = console.warn;
		console.warn = function (msg) {
			if (msg != "listener not found")
				original(msg);
		}
		map.removeLayer(planeLayers[old_val].markerCluster);
		console.warn = original;
	}
	if (val != undefined) {
		localStorage.setItem("plane", val);
		current_plane = val;
		locations = planeLayers[current_plane].locations;
		map.addLayer(planeLayers[current_plane].imageLayer);
		map.addLayer(planeLayers[current_plane].markerCluster);
		updateLocations();
		let floor_level = localStorage.getItem("floor-level");
		for (let loc in locations)
			if (planeLayers[current_plane].locations[loc].image == undefined && planeLayers[current_plane].locations[loc].images != undefined)
				for (let layer in planeLayers[current_plane].locations[loc].images)
					if (layer != getClosestFloor(locations[loc].images))
						planeLayers[current_plane].imageLayer.removeLayer(planeLayers[current_plane].images[loc][layer]);
	}
}

//this might break if the user changes the zoom level while the map is in the middle of updating the layers
//but that's such a difficult edgecase to even test that it's a non-issue
function updateFloor() {
	let val = document.getElementById("floorSlider").value;
	let old_val = parseInt(localStorage.getItem("floor-level"));
	localStorage.setItem("floor-level", val);
	document.getElementById("floorOutput").value = val;
	for (let loc in locations) {
		if (locations[loc].images != undefined) {
			let old_floor = getClosestFloor(locations[loc].images, old_val);
			let floor = getClosestFloor(locations[loc].images);
			if (floor == undefined)
				continue;
			if (old_floor != null && planeLayers[current_plane].images[loc][old_floor] != undefined && planeLayers[current_plane].imageLayer.hasLayer(planeLayers[current_plane].images[loc][old_floor]))
				planeLayers[current_plane].imageLayer.removeLayer(planeLayers[current_plane].images[loc][old_floor]);
			planeLayers[current_plane].imageLayer.addLayer(planeLayers[current_plane].images[loc][floor]);
		}
	}
}

function getClosestFloor(place_images, current = NaN) {
	let slider = document.getElementById("floorSlider");
	let max = parseInt(slider.getAttribute("max"));
	let min = parseInt(slider.getAttribute("min"));
	if (isNaN(current))
		current = parseInt(slider.value);
	let found = undefined;
	for (let i = current; found == undefined && i <= max; i++)
		if (place_images[i.toString()] != undefined)
			found = i.toString();
	for (let i = current; found == undefined && i >= min; i--)
		if (place_images[i.toString()] != undefined)
			found = i.toString();
	return found;
}

function updateMarker(marker, name) {
	setTimeout(() => {
		if (map.getZoom() >= marker.meta.layers.min && map.getZoom() <= marker.meta.layers.max)
			planeLayers[current_plane].markerCluster.addLayer(planeLayers[current_plane].markers[name]);
		else
			planeLayers[current_plane].markerCluster.removeLayer(planeLayers[current_plane].markers[name]);
	}, 300);
	//timeout because the event fires during the cluster animation, causing the the marker to become invisible in some situations
}

function updateImage(image, name, bounds) {
	let layer = locations[name].image == undefined && locations[name].images != undefined ? planeLayers[current_plane].images[name][getClosestFloor(locations[name].images)] : planeLayers[current_plane].images[name];
	if (bounds.intersects(layer.getBounds()) && map.getZoom() >= image.meta.layers.min && map.getZoom() <= image.meta.layers.max)
		planeLayers[current_plane].imageLayer.addLayer(layer);
	else
		planeLayers[current_plane].imageLayer.removeLayer(layer);
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

function getImageBounds(position, name, plane) {
	if (position.bounds != undefined)
		return [L.latLng(position.bounds[0][0], position.bounds[0][1]),
	L.latLng(position.bounds[1][0], position.bounds[1][1])];
	if (position.width != undefined && position.height != undefined && (position.topleft != undefined || position.center != undefined)) {
		let width = calculateLength(position.width);
		let height = calculateLength(position.height);
		let topleft;
		if (position.center != undefined) {
			let middle = getCoordinates(position.center, name, { "for_marker": "false", "plane": plane });
			middle = [middle.lat, middle.lng];
			topleft = [middle[0] - (height / 2), middle[1] - (width / 2)];
			if (position.rotation != undefined)
				topleft = rotatePoint(middle, position.rotation * (Math.PI / 180), topleft);
		} else {
			topleft = position.topleft;
		}
		return [L.latLng(topleft),
		L.latLng(topleft[0] + height, topleft[1] + width)];
	}
	console.error("Not able to get corners based on location data");
	return [L.latLng(0, 0), L.latLng(0, 0)];
}

function getDistancePerHour(speed) {
	const FOOT_PER_MINUTE_TO_MILE_PER_HOUR = 0.01; // 400ft->4mile 300ft->3mile 200ft->2mile according to PHB travel pace
	const FOOT_PER_MINUTE = speed * 10;
	const MILE_PER_HOUR = FOOT_PER_MINUTE * FOOT_PER_MINUTE_TO_MILE_PER_HOUR;
	return MILE_PER_HOUR;
}

function getDistancePerDay(duration, speed) {
	const TRAVEL_HOURS_PER_DAY = duration;
	const MILE_PER_HOUR = getDistancePerHour(speed);
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
			return METER_PER_MILE * getDistancePerDay(8, 30) * distance.duration.days;
		if (distance.duration.hours != undefined)
			return METER_PER_MILE * getDistancePerHour(30) * distance.duration.hours;
		if (distance.duration.hour_timestamp != undefined) {
			const timeArray = distance.duration.hour_timestamp.split(":");
			return METER_PER_MILE * getDistancePerHour(30) * (parseInt(timeArray[0]) + parseInt(timeArray[1]) / 60);
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

function getStartCoordinates(origin, name, plane) {
	if (origin.latlng != undefined)
		return L.latLng(origin.latlng);
	if (origin.plane != undefined)
		plane = origin.plane;
	if (origin.location != undefined)
		return getCoordinates(planeLayers[plane].locations[origin.location].marker.meta.location, origin.location, { "plane": plane });
	return undefined;
}

function calculateCoordinates(distance, direction, origin, name, plane) {
	let length = calculateLength(distance);
	let angle = calculateAngle(direction);
	let start = getStartCoordinates(origin, name, plane);
	if (length != undefined && angle != undefined && start != undefined)
		return L.latLng(start.lat + Math.sin(angle * Math.PI / 180) * length, start.lng + Math.cos(angle * Math.PI / 180) * length);
	console.error("Not able to get " + (length ? "" : "length ") + (angle ? "" : "angle ") + (start ? "" : "start ") + "based on location data for", name);
	return L.latLng(0, 0);
}

function offsetCoordinates(origin, offset, name, plane) {
	let start = getStartCoordinates(origin, name, plane);
	start = L.latLng(start.lat + calculateLength(offset.lat), start.lng + calculateLength(offset.lng));
	return start;
}

let coordinates = {};
let resolving = [];
function getCoordinates(location, name, optional = { "for_marker": "true", "plane": current_plane }) {
	if (optional.for_marker == undefined)
		optional.for_marker = "true";
	if (optional.plane == undefined)
		optional.plane = current_plane;
	if (JSON.parse(optional.for_marker.toLowerCase()) && coordinates[optional.plane] && coordinates[optional.plane][name])
		return coordinates[optional.plane][name];
	let result = L.latLng(0, 0);
	if (resolving.includes(name)) {
		console.error("Circular reference for", name);
		return result;
	}
	resolving.push(name);
	if (location.latlng != undefined)
		result = L.latLng(location.latlng);
	else if (location.origin != undefined && location.offset != undefined)
		result = offsetCoordinates(location.origin, location.offset, name, optional.plane);
	else if (location.distance != undefined && location.direction != undefined && location.origin != undefined)
		result = calculateCoordinates(location.distance, location.direction, location.origin, name, optional.plane);
	else
		console.error("Not able to get coordinates based on location data for", name);
	if (JSON.parse(optional.for_marker.toLowerCase())) {
		if (coordinates[optional.plane] == undefined)
			coordinates[optional.plane] = {};
		coordinates[optional.plane][name] = result;
	}
	resolving.splice(resolving.indexOf(name), 1);
	return result;
}

function loadImages(plane) {
	for (let loc in locations) {
		if (locations[loc].image != undefined) {
			let options = {};
			for (let opt in locations[loc].image)
				if (opt != "meta")
					options[opt] = locations[loc].image[opt];
			let bounds = getImageBounds(locations[loc].image.meta.position, loc, plane);
			if (!isExternalLink(locations[loc].image.meta.file))
				locations[loc].image.meta.file = "images/" + locations[loc].image.meta.file;
			if (locations[loc].image.meta.position.rotation != undefined) {
				options.rotation = locations[loc].image.meta.position.rotation;
				planeLayers[plane].images[loc] = L.rotateImageOverlay(locations[loc].image.meta.file, bounds, options);
			} else {
				planeLayers[plane].images[loc] = L.imageOverlay(locations[loc].image.meta.file, bounds, options);
			}
		} else if (locations[loc].images != undefined) {
			planeLayers[plane].images[loc] = [];
			for (let index in locations[loc].images) {
				let options = {};
				for (let opt in locations[loc].images[index])
					if (opt != "meta")
						options[opt] = locations[loc].images[index][opt];
				let bounds = getImageBounds(locations[loc].images[index].meta.position, loc, plane);
				if (!isExternalLink(locations[loc].images[index].meta.file))
					locations[loc].images[index].meta.file = "images/" + locations[loc].images[index].meta.file;
				if (locations[loc].images[index].meta.position.rotation != undefined) {
					options.rotation = locations[loc].images[index].meta.position.rotation;
					planeLayers[plane].images[loc][index] = L.rotateImageOverlay(locations[loc].images[index].meta.file, bounds, options);
				} else {
					planeLayers[plane].images[loc][index] = L.imageOverlay(locations[loc].images[index].meta.file, bounds, options);
				}
			}
		}
	}
}

function loadMarkers(plane) {
	for (let loc in locations) {
		if (locations[loc].marker) {
			let options = {};
			for (let opt in locations[loc].marker)
				if (opt != "meta")
					options[opt] = locations[loc].marker[opt];
			planeLayers[plane].markers[loc] = L.marker(getCoordinates(locations[loc].marker.meta.location, loc, { "plane": plane }), options);
			if (locations[loc].marker.meta.click != undefined && locations[loc].marker.meta.click.jump_zoom != undefined)
				planeLayers[plane].markers[loc].on('click', function (e) {
					map.flyTo(getCoordinates(locations[loc].marker.meta.location, loc, { "plane": plane }), locations[loc].marker.meta.click.jump_zoom);
				});
			planeLayers[plane].markers[loc].bindTooltip(loc, {});
		}
	}
}

function updateLocations() {
	const bounds = map.getBounds().pad(0.2);
	for (let loc in locations) {
		if (locations[loc].marker != undefined)
			updateMarker(locations[loc].marker, loc);
		if (locations[loc].image != undefined)
			updateImage(locations[loc].image, loc, bounds);
		else if (locations[loc].images != undefined) {
			let floor = getClosestFloor(locations[loc].images);
			if (floor != undefined)
				updateImage(locations[loc].images[floor], loc, bounds);
		}
	}
}

function calculateRelativePosition(latlng) {
	let relativeLocation = document.getElementById("relativeLocation").value;
	let relativePlane = document.getElementById("relativePlane").value;
	let offsetLat = NaN;
	let offsetLng = NaN;
	let dist = NaN;
	let angle = NaN;
	if (planeLayers[relativePlane] != undefined) {
		if (planeLayers[relativePlane].markers[relativeLocation] != undefined) {
			offsetLat = latlng.lat - planeLayers[relativePlane].markers[relativeLocation]._latlng.lat;
			offsetLng = latlng.lng - planeLayers[relativePlane].markers[relativeLocation]._latlng.lng;
			angle = (360 + 90 + Math.atan2(offsetLat, offsetLng) * 180 / Math.PI) % 360;
			dist = map.distance(latlng, planeLayers[relativePlane].markers[relativeLocation]._latlng);
			offsetLat = Math.round((offsetLat + Number.EPSILON) * 1000) / 1000;
			offsetLng = Math.round((offsetLng + Number.EPSILON) * 1000) / 1000;
			dist = Math.round((dist + Number.EPSILON) * 1000) / 1000;
			angle = Math.round((angle + Number.EPSILON) * 1000000) / 1000000;
			//more digits for angle due to precision being important for large distances
		} else
			offsetLat = "Location Not Found";
	} else
		offsetLat = "Plane Not Found";
	document.getElementById("clickLatitude").value = latlng.lat;
	document.getElementById("clickLongitude").value = latlng.lng;
	let hexcoords = (FLAT_TOP) ?
		H.axial_to_doubleheight(H.pixel_to_flat_hex({"x": latlng.lng, "y": latlng.lat}))
		:
		H.axial_to_doublewidth(H.pixel_to_pointy_hex({"x": latlng.lng, "y": latlng.lat}));
	document.getElementById("clickHexCoordinates").value = hexcoords.col + "," + hexcoords.row;
	document.getElementById("relativeLatitude").value = offsetLat;
	document.getElementById("relativeLongitude").value = offsetLng;
	document.getElementById("relativeAngle").value = angle;
	document.getElementById("relativeDistance").value = dist;
}

let checkMeasuringState = false
function checkMeasuring() {
	checkMeasuringState = document.getElementById("toggleMeasuring").checked;
	if (checkMeasuringState)
		map.addLayer(measurer);
	else
		map.removeLayer(measurer);
}

//inserted in the leaflet plotter code to get it called when markers are added/moved/removed
function updateDistances(test) {
	let dist = 0;
	let hexdist = 0;
	for (let i = 0; i < test.length; i++) {
		if (i > 0) {
			let curpos = (FLAT_TOP) ?
				H.axial_to_doubleheight(H.pixel_to_flat_hex({"x": test[i]._latlng.lng, "y": test[i]._latlng.lat}))
				:
				H.axial_to_doublewidth(H.pixel_to_pointy_hex({"x": test[i]._latlng.lng, "y": test[i]._latlng.lat}));
			let prevpos = (FLAT_TOP) ?
				H.axial_to_doubleheight(H.pixel_to_flat_hex({"x": test[i - 1]._latlng.lng, "y": test[i - 1]._latlng.lat}))
				:
				H.axial_to_doublewidth(H.pixel_to_pointy_hex({"x": test[i - 1]._latlng.lng, "y": test[i - 1]._latlng.lat}));
			dist += map.distance(test[i]._latlng, test[i - 1]._latlng);
			if (FLAT_TOP)
				hexdist += H.doubleheight_distance(curpos, prevpos);
			else
				hexdist += H.doublewidth_distance(curpos, prevpos);
		}
	}
	document.getElementById("meterDistance").value = Math.round((dist + Number.EPSILON) * 1000) / 1000;
	let hours = Number(document.getElementById("travelDuration").value);
	if (hours <= 0)
	hours = 8;
	let speed = Number(document.getElementById("movementSpeed").value);
	if (speed <= 0)
		speed = 30;
	document.getElementById("roundsDistance").value = Math.round(((dist / (METER_PER_FOOT * speed)) + Number.EPSILON) * 1000) / 1000;
	document.getElementById("hoursDistance").value = Math.round(((dist / (METER_PER_MILE * getDistancePerHour(speed))) + Number.EPSILON) * 1000) / 1000;
	document.getElementById("daysDistance").value = Math.round(((dist / (METER_PER_MILE * getDistancePerDay(hours, speed))) + Number.EPSILON) * 1000) / 1000;
	document.getElementById("hexDistance").value = hexdist;
}

let planeCount = 0;
function addPlaneInput(plane) {
	let planeInput = document.createElement("input");
	planeInput.type = "radio";
	planeInput.name = "plane";
	planeInput.value = plane;
	planeInput.id = "radio" + plane.replace(/\W/g, "-");
	planeInput.disabled = true;
	planeInput.setAttribute("oninput", "updatePlane();");
	let planeLabel = document.createElement("label");
	planeLabel.htmlFor = "radio" + plane.replace(/\W/g, "-");
	planeLabel.innerHTML = plane;
	let planeSection = document.getElementById("planeSection");
	if (planeCount != 0)
		planeSection.appendChild(document.createElement("br"));
	planeCount++;
	planeSection.appendChild(planeInput);
	planeSection.appendChild(planeLabel);
	inputElements.push(planeInput);
}

function addDatalistOptions() {
	let planeDatalist = document.getElementById("planesList");
	let locationDatalist = document.getElementById("locationsList");
	for (let plane in planeLayers) {
		let planeOption = document.createElement("option");
		planeOption.value = plane;
		planeDatalist.appendChild(planeOption);
		for (let loc in planeLayers[plane].locations) {
			if (planeLayers[plane].locations[loc]["marker"] == undefined)
				continue;
			let locationOption = document.createElement("option");
			locationOption.value = loc;
			locationDatalist.appendChild(locationOption);
		}
	}
}

function search() {
	let location = document.getElementById("searchLocation").value;
	let plane = document.getElementById("searchPlane").value;
	messagbox = document.getElementById("searchMessage");
	if (planeLayers[plane] == undefined || planeLayers[plane].markers[location] == undefined)
		messagbox.innerHTML = "Unable to find " + (planeLayers[plane] == undefined ? "plane" : "location") + ".";
	else {
		map.panTo(planeLayers[plane].markers[location]._latlng);
		messagbox.innerHTML = "";
		history.pushState({plane: plane, location: location}, null, "?plane=" + encodeURIComponent(plane) + "&location=" + encodeURIComponent(location));
	}
}





var map = L.map('map', {
	crs: L.CRS.dod,
	center: [2815244.0985, 3137180.0985],
	preferCanvas: true,
	inertiaMaxSpeed: 3000,
	zoom: 17,
	maxZoom: TARGET_ZOOM,
	maxBoundsViscosity: 1.0,
	zoomControl: false
});
map.setMaxBounds(L.latLngBounds(L.latLng(L.CRS.dod.projection.bounds.min.x - 500000, L.CRS.dod.projection.bounds.min.y - 500000),
	L.latLng(L.CRS.dod.projection.bounds.max.x + 500000, L.CRS.dod.projection.bounds.max.y + 500000)));
const scale = L.control.scale({ updateWhenIdle: true }).addTo(map);
const zoomButtons = L.control.zoom({position: "bottomright"}).addTo(map);

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

L.rotateImageOverlay = function (url, bounds, options) {
	return new L.RotateImageOverlay(url, bounds, options);
};
// A quick extension to allow image layer rotation.
L.RotateImageOverlay = L.ImageOverlay.extend({
	options: { rotation: 0 },
	_animateZoom: function (e) {
		L.ImageOverlay.prototype._animateZoom.call(this, e);
		var img = this._image;
		img.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.rotation + 'deg)';
	},
	_reset: function () {
		L.ImageOverlay.prototype._reset.call(this);
		var img = this._image;
		img.style[L.DomUtil.TRANSFORM] += ' rotate(' + this.options.rotation + 'deg)';
	}
});

function makeEven(numb) {
	if (numb % 2 == 1)
		return numb + 1;
	return numb;
}


var debugCoordsGrid = L.gridLayer.debugCoords({ tileSize: 256, zIndex: 100 });

var measurer = L.Polyline.Plotter().addTo(map);

const HEX_COLOR = localStorage.getItem("hex-color") || "#A9A9A9"
const HEX_HIGHLIGHT = localStorage.getItem("hex-highlight") || '#666666'
if (localStorage.getItem("hex-miles") !== null && Number(localStorage.getItem("hex-miles")) < 12)
	localStorage.removeItem("hex-miles");
const HEX_TO_HEX_MILES = (localStorage.getItem("hex-miles") === null || isNaN(Number(localStorage.getItem("hex-miles")))) ?
	24
	:
	Number(localStorage.getItem("hex-miles"));
const ROOT_3 = Math.sqrt(3);
const HEX_SIDE_LEN = METER_PER_MILE * HEX_TO_HEX_MILES / ROOT_3;
const WORLD_WIDTH = map.options.crs.projection.bounds.max.x - map.options.crs.projection.bounds.min.x;
const WORLD_HEIGHT = map.options.crs.projection.bounds.max.y - map.options.crs.projection.bounds.min.y;
const TOTAL_COLUMNS = makeEven((FLAT_TOP) ?
	Math.ceil(WORLD_WIDTH / (HEX_SIDE_LEN * 1.5))
	:
	Math.ceil(WORLD_WIDTH / (HEX_SIDE_LEN * ROOT_3)));
const TOTAL_ROWS = makeEven((FLAT_TOP) ?
	Math.ceil(WORLD_HEIGHT / (HEX_SIDE_LEN * ROOT_3))
	:
	Math.ceil(WORLD_HEIGHT / (HEX_SIDE_LEN * 1.5)));
const CLUSTER_SIZE = 8;
const CLUSTER_COLUMNS = TOTAL_COLUMNS < CLUSTER_SIZE * 2 ? 1 : CLUSTER_SIZE;
const CLUSTER_ROWS = TOTAL_ROWS < CLUSTER_SIZE * 2 ? 1 : CLUSTER_SIZE;
const COLUMNS = Math.floor(TOTAL_COLUMNS / CLUSTER_COLUMNS) + (Math.floor(TOTAL_COLUMNS / CLUSTER_COLUMNS) % 2 == 1 ? 1 : 0);
const ROWS = Math.floor(TOTAL_ROWS / CLUSTER_ROWS) + (Math.floor(TOTAL_ROWS / CLUSTER_ROWS) % 2 == 1 ? 1 : 0);
const ORIGIN_HEX_CENTER = [map.options.crs.projection.bounds.min.x, map.options.crs.projection.bounds.min.y];
var hexGrid = [];
for (let i = 0; i < CLUSTER_COLUMNS; i++) {
	const local_columns = i == CLUSTER_SIZE - 1 ? COLUMNS + (TOTAL_COLUMNS % CLUSTER_COLUMNS) : COLUMNS;
	for (let j = 0; j < CLUSTER_ROWS; j++) {
		const local_rows = j == CLUSTER_SIZE - 1 ? ROWS + (TOTAL_ROWS % CLUSTER_ROWS) : ROWS;
		hexGrid[j + i * CLUSTER_ROWS] = L.geoJson(
			(FLAT_TOP) ?
				H.fhexagonalGrid(
				[ORIGIN_HEX_CENTER[0] + (i * COLUMNS * 1.5 * HEX_SIDE_LEN),
				ORIGIN_HEX_CENTER[1] + (j * ROWS * ROOT_3 * HEX_SIDE_LEN)],
				local_columns, local_rows, HEX_SIDE_LEN, COLUMNS * i, ROWS * j)
			:
				H.phexagonalGrid(
				[ORIGIN_HEX_CENTER[0] + (i * COLUMNS * ROOT_3 * HEX_SIDE_LEN),
				ORIGIN_HEX_CENTER[1] + (j * ROWS * 1.5 * HEX_SIDE_LEN)],
				local_columns, local_rows, HEX_SIDE_LEN, COLUMNS * i, ROWS * j)
			,
			{
				style: styleHex,
				onEachFeature: onEachHex
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

document.getElementById("map").addEventListener('transitionend', function (e) {
	map.invalidateSize();
});

document.getElementById("map").addEventListener("keydown", (e) => {
	if (e.code === "Space" || e.code === "Enter")
		e.target.click();
}, true);

document.getElementById("searchLocation").addEventListener("keydown", (e) => {
	if (e.code === "Enter")
		search();
});
document.getElementById("searchPlane").addEventListener("keydown", (e) => {
	if (e.code === "Enter")
		search();
});

document.getElementById("toggle-hex-mode").addEventListener("change", function () {
	localStorage.setItem("flat-top", this.checked.toString());
	updateHexBox();
});

document.getElementById("hexToHex").addEventListener("change", function () {
	localStorage.setItem("hex-miles", this.value.toString());
	updateHexToHex();
});

document.getElementById("hexColor").addEventListener("change", function () {
	localStorage.setItem("hex-color", this.value.toString());
});

document.getElementById("hexHighlightColor").addEventListener("change", function () {
	localStorage.setItem("hex-highlight", this.value.toString());
});

document.getElementById("travelDuration").addEventListener("change", function () {
	if (map.hasLayer(measurer))
		updateDistances(measurer._lineMarkers);
});

document.getElementById("movementSpeed").addEventListener("change", function () {
	if (map.hasLayer(measurer))
		updateDistances(measurer._lineMarkers);
});

var locations = {};

var prevZoom = map.getZoom();
let floor_level = localStorage.getItem("floor-level");
if (floor_level) {
	document.getElementById("floorSlider").value = parseInt(floor_level);
	document.getElementById("floorOutput").value = parseInt(floor_level);
}

updateSidebar();
updateHexBox();
updateHexToHex();
updateHexColors();

let current_plane = localStorage.getItem("plane");
let json_response;
async function map_main() {
	const response = await fetch(LOCATIONS_JSON_URL);
	json_response = await response.json();
	for (let plane in json_response) {
		addPlaneInput(plane);
		planeLayers[plane] = {};
		planeLayers[plane].images = {};
		planeLayers[plane].markers = {};
		planeLayers[plane].locations = json_response[plane];
		planeLayers[plane].markerCluster = L.markerClusterGroup({ maxClusterRadius: 40 });
		planeLayers[plane].imageLayer = L.layerGroup([]);
		locations = planeLayers[plane].locations;
		loadMarkers(plane);
		loadImages(plane);
	}
	addDatalistOptions();
	let searchparams = new URLSearchParams(window.location.search);
	if (searchparams.has("plane") && searchparams.has("location")) {
		let location = searchparams.get("location");
		let plane = searchparams.get("plane");
		if (planeLayers[plane] != undefined && planeLayers[plane].markers[location] != undefined) {
			map.panTo(planeLayers[plane].markers[location]._latlng);
			current_plane = plane;
		} else {
			console.error("Invalid search parameter ", (planeLayers[plane] == undefined ? "plane [" + plane + "]" : "location [" + location + "]"));
		}
	}
	if (current_plane != undefined) {
		let radios = document.getElementsByName("plane");
		let found = false;
		for (let i = 0; found == false && i < radios.length; i++) {
			if (radios[i].value == current_plane) {
				radios[i].checked = true;
				found = true;
			}
		}
		if (found == false)
			current_plane = undefined;
	}
	if (current_plane == undefined) {
		let radios = document.getElementsByName("plane");
		if (radios.length > 0) {
			radios[0].checked = true;
			current_plane = radios[0].value;
			localStorage.setItem("plane", current_plane);
		} else {
			localStorage.removeItem("plane");
			console.error("No planes found! Unable to continue.");
			return;
		}
	}
	locations = planeLayers[current_plane].locations;
	planeLayers[current_plane].markerCluster.addTo(map);
	planeLayers[current_plane].imageLayer.addTo(map);
	updateLocations();
	updateHexGrid();
	if (document.getElementById("debugGrid").checked)
		map.addLayer(debugCoordsGrid);
	map.addLayer(grid_holder);
	map.on('move', onMove);
	map.on('moveend', onMoveEnd);
	map.on('click', function (e) {
		calculateRelativePosition(e.latlng);
	});
	document.getElementById("loader").classList.add("paused");
	checkMeasuring();
	//enable inputs again
	for (let element in inputElements) {
		inputElements[element].disabled = false;
	}
}

map_main();