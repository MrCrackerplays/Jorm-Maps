/**
* Author: Igo Brilhante
* Date: 17/10/2013

* Implementation based on this very nice post http://www.redblobgames.com/grids/hexagons/

*/

var H = {
    /**
    * Create the pointy top hexagon
    */
    phexagon: function( center, size, id_x, id_y ){
					let coordinates = [];
                    for(let i =0; i < 6; i++){
						let angle_deg = 60 * i - 30
						let angle_rad = Math.PI / 180 * angle_deg
						let x_i = center[0] + size * Math.cos(angle_rad)
						let y_i = center[1] + size * Math.sin(angle_rad)
						// if (i == 0)
						//     coordinates.push([x_i, y_i])
						// else
						coordinates.push([x_i, y_i])
                    }
                    coordinates.push(coordinates[0]);

                    return {
                        'type':'Feature',
                        'geometry':{
                            'type':'Polygon',coordinates: [coordinates]
                        },
                        'properties':{'id': id_x+','+id_y, 'x':id_x, 'y':id_y}
                    }
                },
	/**
	* Create the flat top hexagon
	*/
	fhexagon: function( center, size, id_x, id_y ){
					let coordinates = [];
					for(let i =0; i < 6; i++){
						let angle_rad = 2 * Math.PI / 6 * i
						let x_i = center[0] + size * Math.cos(angle_rad)
						let y_i = center[1] + size * Math.sin(angle_rad)
						// if (i == 0)
						//     coordinates.push([x_i, y_i])
						// else
						coordinates.push([x_i, y_i])
					}
					coordinates.push(coordinates[0]);

					return {
						'type':'Feature',
						'geometry':{
							'type':'Polygon',coordinates: [coordinates]
						},
						'properties':{'id': id_x+','+id_y, 'x':id_x, 'y':id_y}
					}
				},

    /**
    * Create the pointy top hexagonal grid
    */
	phexagonalGrid: function( center, cols, lines, size, coordinate_offset_x, coordinate_offset_y){

		let features = [];

		let width = Math.sqrt(3) * size;

		let height = size*2;
		let horiz = width;

		for(let k=0; k<lines;k++){
			let vert = 3/4 * height * k;
			let offset = 0.0;

			if( k % 2 == 1){
				offset = 1/2*horiz;
			}

			for(let l =0; l< cols;l++){
				let newCenter = [(center[0] + offset) + (horiz * l), (center[1]) + (vert) ]
				features.push(this.phexagon(newCenter, size, k + coordinate_offset_x, 2 * (l + coordinate_offset_y) + ((k + coordinate_offset_x) & 1)));
			}
		}
		// console.log("created grid of size", features.length);
        return {'type':'FeatureCollection','features':features};
	},

    /**
    * Create the flat top hexagonal grid
    */
	fhexagonalGrid: function( center, cols, lines, size, coordinate_offset_x, coordinate_offset_y){

		let features = [];

		let width = size*2;

		let height = Math.sqrt(3)/2*width;
		let vert = height;

		for(let k=0; k<cols;k++){
			let horiz = 3/4 * width * k;
			let offset = 0.0;

			if( k % 2 == 1){
				offset = 1/2*vert;
			}

			for(let l =0; l< lines;l++){
				let newCenter = [(center[0]) + (horiz), (center[1] + offset) + (vert * l) ]
				features.push(this.fhexagon(newCenter, size, k + coordinate_offset_x, 2 * (l + coordinate_offset_y) + ((k + coordinate_offset_x) & 1)));
			}
		}
		// console.log("created grid of size", features.length);
        return {'type':'FeatureCollection','features':features};
	},


	//these functions are all based on the same page that igo used for his hexagonalGrid and hexagon
	doubleheight_to_cubed: function(hex) {
		let q = hex.col;
		let r = (hex.row - hex.col) / 2;
		return {"q": q, "r": r, "s": -q-r};
	},

	cubed_to_doubleheight: function(hex) {
		let col = hex.q;
		let row = 2 * hex.r + hex.q;
		return {"col": col, "row": row};
	},

	doubleheight_to_axial: function(hex) {
		let q = hex.col;
		let r = (hex.row - hex.col) / 2;
		return {"q": q, "r": r};
	},

	axial_to_doubleheight: function(hex) {
		let col = hex.q;
		let row = 2 * hex.r + hex.q;
		return {"col": col, "row": row};
	},



	doublewidth_to_cubed: function(hex) {
		let q = (hex.col - hex.row) / 2;
		let r = hex.row;
		return {"q": q, "r": r, "s": -q-r};
	},

	cubed_to_doublewidth: function(hex) {
		let col = 2 * hex.q + hex.r;
		let row = hex.r;
		return {"col": col, "row": row};
	},

	doublewidth_to_axial: function(hex) {
		let q = (hex.col - hex.row) / 2;
		let r = hex.row;
		return {"q": q, "r": r};
	},

	axial_to_doublewidth: function(hex) {
		let col = 2 * hex.q + hex.r;
		let row = hex.r;
		return {"col": col, "row": row};
	},



	cube_to_axial: function(cube) {
		let q = cube.q;
		let r = cube.r;
		return {"q": q, "r": r};
	},

	axial_to_cube: function(hex) {
		let q = hex.q;
		let r = hex.r;
		let s = -q-r;
		return {"q": q, "r": r, "s": s};
	},

	doubleheight_add: function(hex, diff) {
		return {"col": hex.col + diff.col, "row": hex.row + diff.row};
	},
	
	doubleheight_neighbor: function(hex, direction) {
		const doubleheight_direction_vectors = [
			{"col": 1, "row": 1}, {"col": 1, "row": -1}, 
			{"col": 0, "row": -2}, {"col": -1, "row": -1}, 
			{"col": -1, "row": 1}, {"col": 0, "row": 2}, 
		];
		let vec = doubleheight_direction_vectors[direction];
		return this.doubleheight_add(hex, vec);
	},

	doublewidth_add: function(hex, diff) {
		return {"col": hex.col + diff.col, "row": hex.row + diff.row};
	},
	
	doublewidth_neighbor: function(hex, direction) {
		const doublewidth_direction_vectors = [
			{"col": 2, "row": 0}, {"col": 1, "row": -1}, 
			{"col": -1, "row": -1}, {"col": -2, "row": 0}, 
			{"col": -1, "row": 1}, {"col": 1, "row": 1}, 
		];
		let vec = doublewidth_direction_vectors[direction];
		return this.doublewidth_add(hex, vec);
	},

	doubleheight_distance: function(a, b) {
		let dcol = Math.abs(a.col - b.col);
		let drow = Math.abs(a.row - b.row);
		return dcol + Math.max(0, (drow - dcol)/2);
	},

	doublewidth_distance: function(a, b) {
		let dcol = Math.abs(a.col - b.col);
		let drow = Math.abs(a.row - b.row);
		return drow + Math.max(0, (dcol-drow)/2);
	},

	doubleheight_to_pixel: function(hex) {
		let x = HEX_SIDE_LEN * 3/2 * hex.col;
		let y = HEX_SIDE_LEN * Math.sqrt(3)/2 * hex.row;
		return {"x": x, "y": y};
	},

	doublewidth_to_pixel: function(hex) {
		let x = HEX_SIDE_LEN * Math.sqrt(3)/2 * hex.col;
		let y = HEX_SIDE_LEN * 3/2 * hex.row;
		return {"x": x, "y": y};
	},

	pixel_to_flat_hex: function(point) {
		let q = ( 2.0/3 * point.x) / HEX_SIDE_LEN;
		let r = (-1.0/3 * point.x + Math.sqrt(3)/3 * point.y) / HEX_SIDE_LEN;
		return this.axial_round({"q": q, "r": r});
	},

	pixel_to_pointy_hex: function(point) {
		let q = ( Math.sqrt(3)/3 * point.x - 1.0/3 * point.y) / HEX_SIDE_LEN;
		let r = (2.0/3 * point.y) / HEX_SIDE_LEN;
		return this.axial_round({"q": q, "r": r});
	},

	axial_round: function(hex) {
		return this.cube_to_axial(this.cube_round(this.axial_to_cube(hex)));
	},

	cube_round: function(frac) {
		let q = Math.round(frac.q)
		let r = Math.round(frac.r)
		let s = Math.round(frac.s)

		let q_diff = Math.abs(q - frac.q)
		let r_diff = Math.abs(r - frac.r)
		let s_diff = Math.abs(s - frac.s)

		if (q_diff > r_diff && q_diff > s_diff)
			q = -r-s
		else if (r_diff > s_diff)
			r = -q-s
		else
			s = -q-r
		return {"q": q, "r": r, "s": s};
	},
}

