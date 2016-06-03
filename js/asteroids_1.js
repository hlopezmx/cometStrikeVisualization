var alldata = [],           // loaded data from CSV
    workingdata = [],       // filtered data
    currentZoom =1;


var svg = d3.select('#map')
    .append('svg')
    .attr('id', 'svg')
    .attr('width', setting.svgWidth)
    .attr('height', setting.svgHeight)


// get the width from the screen (so remove the 'px' at the end)
setting.mapWidth = svg.style("width").replace('px', '');
// calculate the height based on the weight, preserverving the ratio (make it an int)
setting.mapHeight = parseInt(parseFloat(setting.mapWidth) * parseFloat(setting.mapImageRatio));

svg
    .attr('width', setting.mapWidth)
    .attr('height', setting.mapHeight)
    .attr("xmlns", "http://www.w3.org/2000/svg")


var projection = d3.geo.equirectangular()
    .scale(setting.projectionScale)
    .translate([setting.mapWidth / 2, setting.mapHeight / 2])

var path = d3.geo.path()
    .projection(projection);

// zoom and pan
var zoom = d3.behavior.zoom()
    .on("zoom", function () {
        currentZoom = zoom.scale();
        g.attr("transform", "translate(" +
            d3.event.translate.join(",") + ")scale(" + d3.event.scale + ")");


        g.selectAll("path")
            .style("stroke-width", function (d) {
                var nStrokeWidth = $(this).css("stroke-width").replace("px", "");
                nStrokeWidth = nStrokeWidth != 0 ? 1 : nStrokeWidth;
                return nStrokeWidth / currentZoom + "px";
            })

        g.selectAll("#country-borders")
            .style('stroke-width', 0.2 / currentZoom + "px")

    });
svg.call(zoom)


var g = svg.append("g")
    .call(zoom);


// the map
d3.json("data/world-50m.json", function (error, world) {
    if (error) throw error;
    g.append("g")
        .attr("id", "countries")
        .selectAll("path")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter().append("path")
        .attr("d", path)
        .style('stroke', '#8a7842')
        .style('fill', '#c2b280')
        .style('stroke-width', '1px')


    loadData();
});

function loadData() {
    // --- load the data set
    workingdata = [];
    d3.csv(setting.dataFile, function (data) {

        data = data.map(initItem);

        for (key in data) {
            alldata.push(data[key])
        }

        workingdata = alldata.slice(0);
        console.log(workingdata);
        /*
         bDataLoaded = true;

         $(".loading").hide();
         $(".container").show();

         setting.connectionRefresh = 10000 / data.length;
         // start animations
         animationsManager(true);


         */
        displayData();
    });
}

function displayData() {
    // Destiny points:
    gDataPoints = g.append('g')
        .attr('id', 'datapoints')

    gDataPoints.selectAll("circle")
        .data(workingdata)
        .enter()
        .append("circle")
        //.attr("class", "target")
        .style('fill', 'white')
        .style('opacity', 0.3)
        .attr("cx", function (d) {
            return projection([d.longitude, d.latitude])[0];
        })
        .attr("cy", function (d) {
            return projection([d.longitude, d.latitude])[1];
        })
        .attr("r", 3 / currentZoom)


}

/***
 * Transform the data set into the structure we will be working with
 * @param d
 * @returns {*}
 */
function initItem(d) {

    d.latitude = parseFloat(d['COORDINATE']);
    d.longitude = parseFloat(d['COORDINA_1']);

    return d;
}
