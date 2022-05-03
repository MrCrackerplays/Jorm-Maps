# Jorm Maps
A project to display the DnD westmarches world of Jorm using the [LeafletJS](https://leafletjs.com/) library.

Though made specifically for the world of Jorm, it can easily be reused for any other world by editing the locations.json file. Likewise to add/edit existing locations just edit the locations.json file. (Fork and pull request or ask to become a contributor to directly push changes)

# Locations.json
The [JSON](https://www.json.org/json-en.html) file which is used to load all marker and image location data.

## Structure
The base of Locations.json is made of key-value pairs for Planes.
```JSON
{
	"Jorm": {...},
	"Shadowfell": {...},
	...
}
```

### Plane
A Plane is made of key-value pairs for Places.
```JSON
"Plane": {
	"Dod'Estrin": {...},
	"Wizard Tower": {...},
	...
}
```

### Place
A Place has 3 optional objects: `image`, `images`, `marker`. Where images will be ignored if an image object has also been supplied.
```JSON
"Place 1": {
	"images": {...},
	"marker": {...}
},
"Place 2": {
	"image": {...}
}
```

### Images
An Images object is made of key-value pairs for Image objects where the key is the floor at which the image is located.
```JSON
"images": {
	"-5": {...},
	"0": {...},
	"3": {...},
	...
}
```

### Image
An Image has a meta object containing meta data about where the image is located and optionally options that are passed to the leaflet constructor for the image.
```JSON
"image": {
	"meta": {...},
	"opacity": 1,
	...
}
```

### Marker
A Marker has a meta object containing meta data about where the marker is located and optionally options that are passed to the leaflet constructor for the marker.
```JSON
"marker": {
	"meta": {...},
	"attribution": "A brain",
	...
}
