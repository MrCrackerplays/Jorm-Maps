/*
 the script mus be loaded after the map div is defined.
 otherwise this will not work (we would need a listener to
 wait for the DOM to be fully loaded).

 Just put the script tag below the map div.

 The source code below is the example from the leaflet start page.
 */

alert("god");

var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

const boundForHex = [
	[51.5, -0.1],
	[51.4, 0.0]
];

const hexOption = {
	type: "hexagon",
	pathStyleOption: {
		color: "blue"
	}
};

const partition = L.partition(hexOption);
// partition.setData(boundForHex);
// const layerGroup = partition.addTo(map);

L.marker([51.5, -0.09]).addTo(map)
		.bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
		.openPopup();