window.onload = function () {
    var width, height, svg, path,
        years = [],
        colors, defColor, getColor,
        currentYear = "1980",
        playing = false,
        slider;

    function init() {
        setMap();
    }

    function setMap() {
        width = 818, height = 600;

        svg = d3.select('#map').append('svg')
            .attr('width', width)
            .attr('height', height);

        colors = [
            '#a50026',
            '#d73027',
            '#f46d43',
            '#fdae61',
            '#fee08b',
            '#fff4d6'];
        defColor = "#EFEFFF";
        getColor = d3.scale.quantize().domain([100,0]).range(colors);

        var miller = d3.geo.miller()
          .scale(130)
          .translate([width / 2, height / 2])
          .precision(.1);

        path = d3.geo.path().projection(miller);

        loadData();
    }

    function loadData() {
        queue()
          .defer(d3.json, "https://raw.githubusercontent.com/FrontenderMagazine/d3js-map-visualization/master/src/data/topoworld.json")
            .defer(d3.csv, "https://raw.githubusercontent.com/TBywater/MyFiles/master/nzholidayau2.csv")
          .await(processData);
    }

    function addLegend() {
        var lw = 200, lh = 10,  // legend width, height
            lpad = 10,  // legend padding
            lcw = lw / 10;  // legend category width

        var legend = svg.append("g")
            .attr(
                "transform",
                "translate(" + (width+(lpad-width)) + "," + (height-(lh+lpad)) + ")");

        legend.append("rect")
            .attr("width", lw)
            .attr("height", lh)
            .style("fill", "white");

        var lcolors = legend.append("g")
            .style("fill", defColor);

        for (i = 0; i < 10; i++) { 
            lcolors.append("rect")
                .attr("height", 10)
                .attr("width", lcw)
                .attr("x", i * lcw)
                .style("fill", colors[i]);
        }
    }

    function addSlider() {
        // Add year indicator
        svg.append("text")
            .attr("id", "year")
            .attr("transform", "translate(409,550)")
            .text(currentYear);
        // Add slider button
        var btn = svg.append("g").attr("class", "button").attr("id", "play")
            .attr("transform", "translate(225,565)")
            .attr("onmouseup", animateMap);
        btn.append("rect")
            .attr("x", 20).attr("y", 1)
            .attr("rx", 5).attr("ry", 5)
            .attr("width", 39)
            .attr("height", 20)
            .style("fill", "#234c75");
        btn.append("text")
            .attr("x", 25)
            .attr("y", 16)
            .style("fill", "white")
            .text("Play");
        
        // Initialize slider
        var formatter = d3.format("04d");
        var tickFormatter = function(d) {
            return formatter(d);
        }

        slider = d3.slider().min('1980').max('2016')
            .tickValues(['1980','1982','1984','1986','1988','1990','1992','1994','1996','1998','2000','2002','2004','2006','2008','2010','2012','2014','2016'])
            .stepValues(d3.range(1980,2016))
            .tickFormat(tickFormatter);

        svg.append("g")
            .attr("width", 300)
            .attr("id", "slider")
            .attr("transform", "translate(273,545)");
        // Render the slider in the div
        d3.select('#slider').call(slider);
        var dragBehaviour = d3.behavior.drag();
        
        dragBehaviour.on("drag", function(d){
            var pos = d3.event.x;
            slider.move(pos+25);
            currentYear = slider.value();
            sequenceMap();
            d3.select("#year").text(currentYear);
        });

        svg.selectAll(".dragger").call(dragBehaviour);
    }

    function processData(error, worldMap, countryData) {
        var world = topojson.feature(worldMap, worldMap.objects.world);
        
        var countries = world.features;
        for (var i in countries) {
            for (var j in countryData) {
                if (countries[i].id == countryData[j].ISO3166) {
                    for(var k in countryData[j]) {
                        if (k != 'Country' && k != 'ISO3166') {
                            if (years.indexOf(k) == -1) { 
                                years.push(k);
                            }
                            countries[i].properties[k] = Number(countryData[j][k])
                        }
                    }
                    break;
                }
            }
        }

        drawMap(world);
    }

    function drawMap(world) {
        var map = svg.append("g");
        map.selectAll(".country")
          .data(world.features)
              .enter().append("path")
          .attr("class", "country")
          .attr("d", path);

        sequenceMap();

        addLegend();
        addSlider();
    }

    function animateMap() {
        var timer;
        d3.select('#play').on('click', function() {
            if (playing == false) {
                timer = setInterval(function() {
                    if (currentYear < years[years.length-1]) {
                        currentYear = (parseInt(currentYear) + 1).toString()
                    } else {
                        currentYear = years[0];
                    }
                    sequenceMap();
                    slider.setValue(currentYear);
                    d3.select("#year").text(currentYear);
                }, 1000);
            
                d3.select(this).select('text').text('Stop');
                playing = true;
            } else {
                clearInterval(timer);
                d3.select(this).select('text').text('Play');
                playing = false;
            }
        });
    }

    function sequenceMap() {
        d3.selectAll('.country')
            .style('fill', function(d) {
                color = getColor(d.properties[currentYear]);
                return color ? color : defColor;
            });
    }

    init();
document.getElementById("print").innerHTML = timer;
};