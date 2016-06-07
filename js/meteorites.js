var alldata = [],           // loaded data from CSV
    workingdata = [],       // filtered data
    meteoriteTypes = [],    // filtered type of meteorites
    currentZoom = 1,
    initialYear = 0,
    finalYear = 0;

// using d3, we select the html element with "map" id and append an svg tag
// where d3 will be adding svg items to render the map
var svg = d3.select('#map')
    .append('svg')
    .attr('id', 'svg')
    .style('width', setting.svgWidth)
    .style('height', setting.svgHeight)

// get the width from the screen (so remove the 'px' at the end)
setting.mapWidth = svg.style("width").replace('px', '');
// calculate the height based on the weight, preserverving the ratio (make it an int)
setting.mapHeight = parseInt(parseFloat(setting.mapWidth) * parseFloat(setting.mapImageRatio));


// set the svg size to use the whole browser view
svg
    .attr('width', setting.mapWidth)
    .attr('height', setting.mapHeight)
    .attr("xmlns", "http://www.w3.org/2000/svg")

// this method will let us project from longitude and latitude to pixel coordinates
var projection = d3.geo.equirectangular()
    .scale(setting.projectionScale)
    .translate([setting.mapWidth / 2, setting.mapHeight / 2])

// a path to append the worldmap polygons to
var path = d3.geo.path()
    .projection(projection);

// definiton of the zoom and pan behavior
var zoom = d3.behavior.zoom()
    .on("zoom", function () {

        // store the current scale, it will be useful
        // to repaint some elements without scaling them
        // e.g. map contours, meteorite points.
        currentZoom = zoom.scale();

        // zoom and pan
        g.attr("transform", "translate(" +
            d3.event.translate.join(",") + ")scale(" + d3.event.scale + ")");

        // restore the worldmap contours width, so they don't
        // get wider when zooming in
        g.selectAll("path")
            .style("stroke-width", function (d) {
                var nStrokeWidth = $(this).css("stroke-width").replace("px", "");
                nStrokeWidth = nStrokeWidth != 0 ? 1 : nStrokeWidth;
                return nStrokeWidth / currentZoom + "px";
            })

        // restore the meteorites' width, so they don't
        // get wider when zooming in
        g.selectAll("circle")
            .attr('r', 3 / currentZoom)
    });
svg.call(zoom)

// create an element group where we will be adding items
var g = svg.append("g")
    .call(zoom);

// load the json file with the map polygons and add css styling
d3.json("data/worldmap.json", function (error, world) {
    if (error) throw error;

    // append a group with "countries" id and set the data from the json info
    // also set the style (using css attributes)
    g.append("g")
        .attr("id", "countries")
        .selectAll("path")
        .data(topojson.feature(world, world.objects.countries).features)
        .enter().append("path")
        .attr("d", path)
        .style('stroke', '#8a7842')
        .style('fill', '#c2b280')
        .style('stroke-width', '1px')

    // load the meteorites data
    loadData();
});

// --- load the data set
function loadData() {
    workingdata = [];
    d3.csv(setting.dataFile, function (data) {
        data = data.map(initItem);
        for (key in data) alldata.push(data[key])
        alldata.sort(compareYear);
        workingdata = alldata.slice(0);
        initialYear = parseInt(workingdata[0].YEAR);
        finalYear = parseInt(workingdata[workingdata.length - 1].YEAR);

        hideLoading();
        displayData();
    });
}

// display the meteorites
function displayData() {
    // Year data label
    var yearInfo = g.append('text')
        .text('')
        .attr({
            x: 20, y: 450,
            'font-family': 'sans-serif', 'font-size': '50px',
            'font-weight': 'bold', 'fill': 'rgba(0,0,0,0.5'
        })

    // Create a group for the Meteorite elements:
    gDataPoints = g.append('g')
        .attr('id', 'datapoints')


    // add a white filled circle for each meteorite
    gDataPoints.selectAll('circle')
        .data(workingdata)
        .enter()
        .append('circle')
        .style('fill', 'white')
        .style('opacity', 0.3)
        .attr('cx', function (d) {
            // convert longitude and latitude coordinates into pixel coordinates
            return projection([d.longitude, d.latitude])[0];
        })
        .attr('cy', function (d) {
            // convert longitude and latitude coordinates into pixel coordinates
            return projection([d.longitude, d.latitude])[1];
        })
        .attr('r', 0 / currentZoom)     // we start with a nil radius
        .transition()                   // and will animate...
        .delay(function (d, i) {        // delay each meteorite based on its row number
            return i * 10;
        })
        .attr('r', 3 / currentZoom)     // after the delay, increase the radius.
        .each('end', function (d) {	// and display the year text
            yearInfo.text('Year: ' + d.YEAR);
        })
}


// Transform the data set into the structure we will be working with
function initItem(d) {
    d.latitude = parseFloat(d['COORDINATE']);
    d.longitude = parseFloat(d['COORDINA_1']);
    d.YEAR = parseInt(d['YEAR']);
    return d;
}

// sort meteorite elements by year
function compareYear(a, b) {
    if (a.YEAR < b.YEAR)
        return -1;
    else if (a.YEAR > b.YEAR)
        return 1;
    else
        return 0;
}

function hideLoading() {
    $(".loading").hide();
    $("body").css({"background-color": "#c2dfff"});
    $(".map").show();
}