/*jslint browser: true*/
/*global d3*/


//Referred to US Chloropleth code from the textbook

//Width and height
var w = 750;
var h = 600;
var margin = {top: 20, right: 80, bottom: 30, left: 50};

//Define map projection
var projection = d3.geoMercator()
                       .rotate([0, 0])
                        .center([8.3, 46.8])
                        .scale(10000)
                        .translate([w / 2 + 60, h / 2 -20]);
                        //.precision(.1);
                        


//Define path generator
var path = d3.geoPath()
                 .projection(projection);

//Define threshold scale to sort data values into buckets of color
var color = d3.scaleThreshold(d3.schemeBlues[9]);
                    //Colors derived from ColorBrewer, by Cynthia Brewer, and included in
                    //https://github.com/d3/d3-scale-chromatic


//Create SVG element
var svg = d3.select("body")
            .append("svg")
            .attr("width", w + margin.left + margin.right)
            .attr("height", h + margin.top + margin.bottom);




//for each line, returns the canton(state), its population and area and the values in the columns
function rowConverter(data) {
   return{ //return all the data for each canton in the data file
        canton: data.Canton,
        population : +data.Population,
        area : +data.Area
   }
}

//Load in population data
//https://www.bfs.admin.ch/bfs/en/home/statistics/catalogues-databases/data.assetdetail.12087876.html
//Area data from:
//http://swiss-government-politics.all-about-switzerland.info/swiss-federal-states-cantons.html
d3.csv("Switzerland.csv", rowConverter).then(function(data){
    
    console.log("csv")
    
     var dom = [];
        var min =  d3.min(data, function(d) { return d.population/d.area ; });
        var max = d3.max(data, function(d) { return d.population/d.area ; });
    
    
    var d = d3.scalePow()
        .exponent(2.40)
        .domain([0, 10])
        .range([min, max])
        
        for (var i = 1; i <=9; i++) {
            dom.push(d(i));
            console.log(d(i));
        }
    
    color.domain([25, 50, 100, 200, 400, 800, 1600, 3200])
    

    //color.domain(dom);

    //Set input domain for color scale
//    color.domain([
//        d3.min(data, function(d) { return d.population/d.area ; }), 
//        d3.max(data, function(d) { return d.population/d.area ; })
//    ]);
    
    
    
//    console.log("min " + d3.min(data, function(d) { return d.population; }))
//    console.log("max " + d3.max(data, function(d) { return d.population/d.area; }))
//    
    
    console.log("color " +color.range())
    console.log(data);
    

    //Load in GeoJSON data
    d3.json("Switzerland1.json").then(function(json){
        
        console.log("json")

        //Merge the ag. data and GeoJSON
        //Loop through once for each ag. data value
        for (var i = 0; i < data.length; i++) {

            //Grab canton/state name
            var dataState = data[i].canton;

            //Grab data value, and convert from string to float
            var dataValue = parseFloat(data[i].population) / parseFloat(data[i].area) ;

            //Find the corresponding state inside the GeoJSON
            for (var j = 0; j < json.features.length; j++) {

                var jsonState = json.features[j].properties.NAME_1;
//                console.log("data " + dataState);
//                console.log("json " + jsonState);

                if (dataState == jsonState) {
                    
//                    console.log("data " + dataState);

                    //Copy the data value into the JSON
                    json.features[j].properties.value = dataValue;
                    
                    //console.log(json.features[j].properties.NAME_1 + " " + json.features[j].properties.value )

                    //Stop looking through the JSON
                    break;

                }
            }		
        }
        
        
        
        
        var features = json.features;
        
        
        features.forEach(function(feature) {
           if(feature.geometry.type == "MultiPolygon") {
             feature.geometry.coordinates.forEach(function(polygon) {
                 //console.log("multi " + feature.properties.NAME_1);

               polygon.forEach(function(ring) {
                 ring.reverse();
                 //console.log(ring); 
               })
             })
           }
           else if (feature.geometry.type == "Polygon") {
               //console.log("poly " + feature.properties.NAME_1);
             feature.geometry.coordinates.forEach(function(ring) {
               ring.reverse();
               
             })  
           }
         })
        



        //Bind data and create one path per GeoJSON feature
        svg.selectAll("path")
           .data(features)
           .attr("class", "canton-boundary")
           .enter()
           .append("path")
           .attr("d", path)
           .attr("stroke", "black")
           .attr("stroke-width", 0.5)
           .style("fill", function(d) {
                //Get data value
                var value = d.properties.value;
            
             console.log(d.properties.NAME_1 + " " + value);

                if (value) {
                    //If value exists…
                    return color(value);
                } else {
                    //If value is undefined…
                    return "#ccc";
                }
           });
        
       
        
       
        var x = d3.scaleSqrt()
            .domain([0, 4500])
            .rangeRound([440, 950]);

        var g = svg.append("g")
            .attr("class", "key")
            .attr("transform", "translate(-150,550)");

        g.selectAll("rect")
          .data(color.range().map(function(d) {
              d = color.invertExtent(d);
              if (d[0] == null) d[0] = x.domain()[0];
              if (d[1] == null) d[1] = x.domain()[1];
              return d;
            }))
          .enter().append("rect")
            .attr("height", 8)
            .attr("x", function(d) { return x(d[0]); })
            .attr("width", function(d) { return x(d[1]) - x(d[0]); })
            .attr("fill", function(d) { return color(d[0]); });

        g.append("text")
            .attr("class", "caption")
            .attr("x", x.range()[0])
            .attr("y", -6)
            .attr("fill", "#000")
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text("Population per square kilometer");

        g.call(d3.axisBottom(x)
            .tickSize(13)
            .tickValues(color.domain()))
          .select(".domain")
            .remove();

        
        
       
    });

});


