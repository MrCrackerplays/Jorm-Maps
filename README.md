# Jorm Maps
A project to display the DnD westmarches world of Jorm using the [LeafletJS](https://leafletjs.com/) library.

Though made specifically for the world of Jorm, it can easily be reused for any other world by editing the locations.json file. Likewise to add/edit existing locations just edit the locations.json file. (Fork and pull request or ask to become a contributor to directly push changes)

# Locations.json
The [JSON](https://www.json.org/json-en.html) file which is used to load all marker and image data.

## Structure
The base of Locations.json is made of key-value pairs for [Planes](#plane).
```JSON
{
	"Jorm": {...},
	"Shadowfell": {...},
	...
}
```

### Plane
A Plane is made of key-value pairs for [Places](#place).
```JSON
"Plane": {
	"Dod'Estrin": {...},
	"Wizard Tower": {...},
	...
}
```

### Place
A Place has 3 optional objects: [`image`](#image), [`images`](#images), [`marker`](#marker). Where `images` will be ignored if an `image` object has also been supplied.
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
An Images object is made of key-value pairs for [Image objects](#image) where the key is the floor at which the image is located.
```JSON
"images": {
	"-5": {...},
	"0": {...},
	"3": {...},
	...
}
```

### Image
An Image has a required [`meta`](#image-meta) object containing meta data about where the image is located and optionally options that are passed to the leaflet constructor for the image.
```JSON
"image": {
	"meta": {...},
	"opacity": 1,
	...
}
```

#### Image Meta
Image metadata has 3 required objects: [`position`](#image-position), [`layers`](#layers), `file`. Where `file` is a string which is the link to the image to be shown, if the image is local then it'll be found relative to the images folder.
```JSON
"meta": {
	"position": {...},
	"file": "DodEstrin.jpg",
	"layers": {...}
}
```

#### Image Position
An image position has an optional `rotation` which is how many degrees the image will be rotated and a required boundaries representation which can be either `bounds`, which is a 2 long array of [latlng](#latlng)'s which define the top-left latlng and bottom-right latlng of the boundaries, or a combination of a `width` [length](#length), a `height` [length](#length), and either a `center` [location](#location) or `topleft` latlng (if both are defined the `center` will take precedent).
```JSON
"position": {
	"bounds": [[33, 33], [44, 44]]
}
//
"position": {
	"rotation": 33,
	"width": {...},
	"height": {...},
	"center": {...}
}
//
"position": {
	"width": {...},
	"height": {...},
	"topleft": {...}
}
```

### Marker
A Marker has a required [`meta`](#marker-meta) object containing meta data about where the marker is located and optionally options that are passed to the leaflet constructor for the marker.
```JSON
"marker": {
	"meta": {...},
	"attribution": "A brain",
	...
}
```

#### Marker Meta
Marker metadata has an optional object [`click`](#click) and 2 required objects: [`location`](#location), [`layers`](#layers).
```JSON
"meta": {
	"location": {...},
	"click": {...},
	"layers": {...}
}
```

#### Click
A Click object has an optional `jump_zoom` number which specifies what at zoomlevel will be zoomed to when the marker is clicked. (Currently that's the only click option but it's an object for future possible additional options)
```JSON
"click": {
	"jump_zoom": 13
}
```

### Layers
Layers has 2 required numbers `min`, `max` which define the range from what layer until what layer (inclusive) the marker/image is visible.
```JSON
"layers": {
	"min": 13,
	"max": 19
}
```

### Location
A Location is an object that resolves to a latlng which can be using one of 3 ways: 1. [`latlng`](#latlng), 2. [`origin`](#origin) and [`offset`](#offset), 3. [`origin`](#origin), `distance` [length](#length), and [`direction`](#direction). They have precedence in that order and are all required for their respective ways.
```JSON
//1
"location": {
	"latlng": [200, 30]
}
//2
"location": {
	"origin": {...},
	"offset": {...}
}
//3
"location": {
	"origin": {...},
	"direction": {...},
	"distance": {...}
}
```

### Latlng
A Latlng is a number array of 2 numbers representing a Latitude and Longitude, in that order.
```JSON
"latlng": [42, 420]
```

### Length
A Length is a representation of a distance, either by specifying the length itself, via `meter`, `feet`, `tiles`, `kilometers`, and  `mile`, or by specifying a [`duration`](#duration). (Taking precedence in that order)
```JSON
"length": {
	"meter": 10
}
//...
"length": {
	"duration": {...}
}
```

#### Duration
A Duration is a distance as specified by the travel duration in a number `days`, number `hours`, or special `hour_timestamp`. Assuming a travel speed of 3 mile/hour or 24 miles per day (As per the Travel Pace table in the 5e PHB).
```JSON
//10 and a half days of travel
"duration": {
	"days": 10.5
}
//4 and a half hours of travel
"duration": {
	"hours": 4.5
}
//1 hour and 20 minutes of travel
"duration": {
	"hour_timestamp": "1:20"
}
```

### Origin
An Origin is a relative point of reference which resolves to a [latlng](#latlng) using either `latlng` or a `location` which is the name of a [Place](#place) (specifically the place's marker will be used for getting its location, so if it doesn't have a marker it cannot be used as an origin) with optionally a [Plane](#plane)'s name to specify what plane that place is on if it's not on the same Plane the currently being assigned to location is.
```JSON
"origin": {
	"latlng": [60, 90]
}
//
"origin": {
	"location": "Dod'Estrin",
	"plane": "Jorm"
}
```

### Offset
An Offset has a `lat` [Length](#length) and a `lng` [Length](#length) which specify how far offset from the origin the latitude and longitude will be.
```JSON
"offset": {
	"lat": {...},
	"lng": {...}
}
```

### Direction
A Direction has an angle in `degrees`, `radians`, or a `compass` string. (Presedence in that order).
```JSON
"direction": {
	"degrees": 50.41
}
//
"direction": {
	"radians": 2.1
}
//
"direction": {
	"compass": "SSW"
}
```
