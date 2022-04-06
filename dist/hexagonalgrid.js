/**
* Author: Igo Brilhante
* Date: 17/10/2013

* Implementation based on this very nice post http://www.redblobgames.com/grids/hexagons/

*/

var H = {
    /**
    * Create the hexagon
    */
    hexagon: function( center, size, id ){
                    coordinates = [];
                    for(var i =0; i < 6; i++){
                        angle = 2 * Math.PI / 6 * i
                        x_i = center[0] + size * Math.cos(angle)
                        y_i = center[1] + size * Math.sin(angle)
                        if (i == 0)
                            coordinates.push([x_i, y_i])
                        else
                            coordinates.push([x_i, y_i])
                    }
                    coordinates.push(coordinates[0]);

                    return {
                        'type':'Feature',
                        'geometry':{
                            'type':'Polygon',coordinates: [coordinates]
                        },
                        'properties':{'id': id}
                    }
                },

    /**
    * Create the hexagonal grid
    */
    hexagonalGrid: function( center, cols, lines, size ){

        var features = [];
        // features.push(this.hexagon(center, size));

        width = size*2;

        height = Math.sqrt(3)/2*width;
        vert = height;

        for(var k=0; k<cols;k++){
           horiz = 3/4 * width * k;
           var offset = 0.0;

           if( k % 2 == 1){
                offset = 1/2*vert;
           }

           for(var l =0; l< lines;l++){
                newCenter = [center[0] + horiz, (center[1] + offset) + (vert*l) ]
                features.push(this.hexagon(newCenter, size, k+','+l));
           }
        }
        return {'type':'FeatureCollection','features':features};
    }
}

