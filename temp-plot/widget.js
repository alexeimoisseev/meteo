define(['d3', 'angular', 'text!temp-plot/widget.html'], function(d3, angular, template) {
    "use strict";
    function TemperaturePlot(element, data, DayInfo) {
        var self = this,
            opts = {margin: {left: 40, right: 20, top: 40, bottom: 70}, width: 580, height: 300};
        this.svg = d3.select(element).append("svg").attr("width", opts.width + opts.margin.left + opts.margin.right)
            .attr("height", opts.height + opts.margin.top + opts.margin.bottom);
        this.plot = this.svg.append("g").attr("transform", "translate(" + opts.margin.left + "," + opts.margin.top + ")");
        this.data = this.mapData(data);
        var tempBounds = d3.extent(this.data, function(d) { return d.temp; });
        var x = d3.time.scale().range([0, opts.width]).domain(d3.extent(this.data, function(d) { return d.time; })),
            y = d3.scale.linear().range([opts.height, 0]).domain(tempBounds).nice();

        var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat("");
        var yAxis = d3.svg.axis().scale(y).orient("left");

        this.plot.append("g").attr("class", "x axis").attr("transform", "translate(0," + opts.height + ")").call(xAxis);
        this.plot.append("g").attr("class", "y axis").call(yAxis)
            .append("text")
            .attr("x", -10)
            .attr('y', -20)
            .attr("dy", ".25em")
            .text("°C");
        var tickInterval = x.range()[1]/x.ticks().length;
        this.plot.selectAll('.x.axis .tick').append('switch').append('foreignObject').attr({
            y: 6,
            x: -tickInterval/2,
            width: tickInterval,
            height: 60
        }).append('xhtml:body').attr('xmlns', "http://www.w3.org/1999/xhtml").each(function(d) {
            new DayInfo(this, d, self.findDataByDate(d));
        });
        this.plot.selectAll('.x.axis .tick switch').append('text').text('fail');
        this.plot.selectAll('.x.axis .tick').append('title').text(function(d) {
            return self.findDataByDate(d).weather.description;
        });

        if(tempBounds[0]*tempBounds[1] < 0) {
            this.plot.append('line').attr({
                x1: x.range()[0], y1: y(0),
                x2: x.range()[1], y2: y(0)
            });    
        }

        var line = d3.svg.line()
            .x(function(d) {
                return x(d.time);
            })
            .y(y(tempBounds[1]));

        this.createGradient('pathFill', this.getColorStops(tempBounds[0], tempBounds[1]));
        var path = this.plot.append("path")
            .datum(this.data)
            .attr("class", "line").style('stroke', 'url(#pathFill)')
            .attr("d", line);

        line.y(function(d) {
            return y(d.temp);
        });
        path.transition().duration(1000).attr('d', line);
    }
    TemperaturePlot.prototype.mapData = function(rawData) {
        return rawData.list.map(function(d) {
            return {
                weather: d.weather[0],
                time: d.dt*1000,
                temp: d.main.temp
            };
        });
    };
    TemperaturePlot.prototype.findDataByDate = function(date) {
        var result;
        this.data.some(function(d) {
            return d.time > date.valueOf() && (result = d);
        });
        //noinspection JSUnusedAssignment
        return result;
    };
    TemperaturePlot.prototype.colors = ['#ec1000', '#ffa59d', '#2b78d8'];
    TemperaturePlot.prototype.getColorStops = function(min, max) {
        if(max*min>0) {
            return [this.getColor(max), this.getColor(min)];
        }
        else {
            return [this.getColor(max), this.getColor(0), this.getColor(min)];
        }
    };
    TemperaturePlot.prototype.getColor = function(temp) {
        if(temp > 0) {
            return d3.interpolateRgb(this.colors[0], this.colors[1])(temp/100);
        }
        else {
            return d3.interpolateRgb(this.colors[2], this.colors[1])(-temp/100);
        }
    };
    TemperaturePlot.prototype.createGradient = function(name, stops) {
        var gradient = this.svg.append("svg:defs").append("svg:linearGradient")
            .attr("id", name)
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%")
            .attr("spreadMethod", "pad");
        stops.forEach(function(stop, index) {
            gradient.append("svg:stop")
                .attr("offset", (index/(stops.length-1)*100)+"%")
                .attr("stop-color", stop)
                .attr("stop-opacity", 1);
        });
    };
    return {
        className:'plot',
        controller: function($scope, $compile, $element, weather) {
            function DayInfo(element, time, data) {
                element.innerHTML = this.template;
                var scope = $scope.$new();
                angular.extend(scope, {
                    temp: data.temp,
                    time: time,
                    cloudIcon: weather.getCloudIcon(data.weather.id, data.time)
                });
                $compile(element)(scope);
            }
            DayInfo.prototype.template = template;

            weather.load().then(function(data) {
                $scope.plot = new TemperaturePlot($element[0], data, DayInfo);
            });
        }
    };
});
