PykCharts.oneD.pyramid = function (options) {
    var that = this;
    var theme = new PykCharts.Configuration.Theme({});

	this.execute = function () {
        that = new PykCharts.oneD.processInputs(that, options, "pyramid");

        if(that.mode === "default") {
           that.k.loading();
        }

        d3.json(options.data, function (e,data) {
			that.data = Array.groupBy(data);
            $(options.selector+" #chart-loader").remove();
			that.render();
		})
	};

    this.refresh = function () {
        d3.json (options.data, function (e,data) {
            that.data = data;
            that.optionalFeatures()
                    .createChart()
                    .label()
                    .ticks();
        });
    };

	this.render = function () {
		that.fillChart = new PykCharts.oneD.fillChart(that);
        that.mouseEvent1 = new PykCharts.oneD.mouseEvent(options);
        that.transitions = new PykCharts.Configuration.transition(that);
        that.border = new PykCharts.Configuration.border(that);

        if (that.mode === "default") {
            that.k.title();
            that.k.subtitle();
            var pyramid = that.optionalFeatures().svgContainer()
                .createChart()
                .label()
                .ticks();

            that.k.credits()
                .dataSource()
                .tooltip()
                .liveData(that);
                // [that.fullscreen]().fullScreen(that)

            that.mouseEvent = new PykCharts.Configuration.mouseEvent(that);

        } else if (that.mode === "infographics") {
            that.optionalFeatures().svgContainer()
                .createChart()
                .label();

            that.k.tooltip();
            that.mouseEvent = new PykCharts.Configuration.mouseEvent(that);
        }
	};

	this.percentageValues = function (data){
        var total = d3.sum(data, function (d){
            return d.weight;
        });
        var percentValues = data.map(function (d){
            return d.weight/total*100;
        });
        percentValues.sort(function(a,b){
            return b-a;
        });
        return percentValues;
    };
	this.pyramidLayout = function () {
        var data,
            size,
            coordinates;

        var pyramid = {
            data: function(d){
                if (d.length===0){

                } else {
                    data = d;
                }
                return this;
            },
            size: function(s){
                if (s.length!==2){

                } else {
                    size = s;
                }
                return this;
            },
            coordinates: function(c){
                var w = size[0];
                var h = size[1];
                var ratio = (w/2)/h;
                var percentValues = that.percentageValues(data);
                var coordinates = [];
                var area_of_triangle = (w * h) / 2;
                 function d3Sum (i) {
                    return d3.sum(percentValues,function (d, j){
                        if (j>=i) {
                            return d;
                        }
                    });
                }
                for (var i=0; i<data.length; i++){
                    var selectedPercentValues = d3Sum(i);
                    var area_of_element = selectedPercentValues/100 * area_of_triangle;
                    var height1 = Math.sqrt(area_of_element/ratio);
                    var base = 2 * ratio * height1;
                    var xwidth = (w-base)/2;
                    if (i===0){
                        coordinates[i] = {"values":[{"x":w/2,"y":0},{"x":xwidth,"y":height1},{"x":base+xwidth,"y":height1}]};
                    }else{
                        coordinates[i] = {"values":[coordinates[i-1].values[1],{"x":xwidth,"y":height1},{"x":base+xwidth,"y":height1},coordinates[i-1].values[2]]};
                    }
                }
                return coordinates;
            }
        };
        return pyramid;
    };

    this.optionalFeatures = function () {

    	var optional = {
            svgContainer :function () {
                $(options.selector).css("background-color",that.bg);

                that.svg = d3.select(options.selector)
                    .append('svg')
                    .attr("width", that.width +200)
                    .attr("height",that.height)
                    .attr("id","svgcontainer")
                    .attr("class","svgcontainer");

                that.group = that.svg.append("g")
                    .attr("id","pyrgrp");

                return this;
            },
        	createChart : function () {

        		that.chartData = that.optionalFeatures().clubData();
        		that.perValues = that.percentageValues(that.chartData);

        		var pyramid = that.pyramidLayout()
                    .data(that.chartData)
                    .size([that.width,that.height]);
                var total = d3.sum(that.chartData, function (d){
                    return d.weight;
                });
		        that.coordinates = pyramid.coordinates();
                that.coordinates[0].values[1] = that.coordinates[that.coordinates.length-1].values[1];
                that.coordinates[0].values[2] = that.coordinates[that.coordinates.length-1].values[2];
                var k = that.chartData.length-1,p = that.chartData.length-1,tooltipArray = [];
                for(i=0;i<that.chartData.length;i++){
                    if(i==0) {
                        tooltipArray[i] = that.chartData[i].tooltip || "<table class='PykCharts'><tr><th colspan='3'  class='tooltip-heading'>"+that.chartData[i].name+"</tr><tr><td class='tooltip-left-content'>"+that.k.appendUnits(that.chartData[i].weight)+"<td class='tooltip-right-content'>( "+((that.chartData[i].weight*100)/total).toFixed(2)+"% ) </tr></table>";
                    } else {
                        tooltipArray[i] = that.chartData[k].tooltip || "<table class='PykCharts'><tr><th colspan='3'  class='tooltip-heading'>"+that.chartData[k].name+"</tr><tr><td class='tooltip-left-content'>"+that.k.appendUnits(that.chartData[k].weight)+"<td class='tooltip-right-content'>( "+((that.chartData[k].weight*100)/total).toFixed(2)+"% ) </tr></table>";
                        k--;
                    }
                }
		        that.line = d3.svg.line()
                    .interpolate('linear-closed')
                    .x(function(d,i) { return d.x; })
                    .y(function(d,i) { return d.y; });

                var a = [{x:0,y:that.height},{x:that.width,y:that.height},{x:0,y:that.height},{x:that.width,y:that.height},{x:0,y:that.height},{x:that.width,y:that.height}]
                var k =that.chartData.length;
        
                var path =that.group.selectAll('.pyr-path')
                    .data(that.coordinates)
                path.enter()
                    .append('path')

                path.attr("class","pyr-path")
                    .attr('d',function(d) {return that.line(a);})
                    .attr("stroke",that.border.color())
                    .attr("stroke-width",that.border.width())
                   	.attr("fill",function (d,i) {
                        if(i===0) {
                            b = that.chartData[i];
                        }
                        else {
                            k--;
                            b = that.chartData[k];
                        }
                        return that.fillChart.chartColor(b);
                    })
        			.on("mouseover", function (d,i) {
                        that.mouseEvent1.highlight(options.selector +" "+".pyr-path",this);
                        that.mouseEvent.tooltipPosition(d);
                        that.mouseEvent.toolTextShow(tooltipArray[i]);
        			})
        			.on("mouseout", function (d) {
                        that.mouseEvent1.highlightHide(options.selector +" "+".pyr-path")
            			that.mouseEvent.tooltipHide(d);
        			})
        			.on("mousemove", function (d,i) {
                        that.mouseEvent.tooltipPosition(d);
        			})
                    .transition()
                    .duration(that.transitions.duration())
                    .attr('d',function (d){ return that.line(d.values); });

                path.exit().remove();
              
		        return this;
        	},
            label: function () {
                    var j = that.chartData.length;
                    var p = that.chartData.length;
                    var pyr_text = that.group.selectAll("text")
                        .data(that.coordinates)

                    pyr_text.enter()
                        .append("text")

                    pyr_text.attr("y",function (d,i) {
                            if(d.values.length === 4) {
                                return (((d.values[0].y-d.values[1].y)/2)+d.values[1].y) +2;
                            } else {
                                return (d.values[0].y + that.coordinates[that.coordinates.length-1].values[1].y)/2 + 10;
                            }
                        })
                        .attr("x", function (d,i) { return that.width/2;})
                        .text("")
                        .transition()
                        .delay(that.transitions.duration())
                    pyr_text.text(function (d,i) {
                            if(i===0) {
                                return that.k.appendUnits(that.chartData[i].weight);
                            }
                            else {
                                j--;
                                return that.k.appendUnits(that.chartData[j].weight);
                            }
                         })
                        .text(function (d,i) {
                            if(this.getBBox().width < (d.values[2].x - d.values[1].x) || this.getBBox().height < (d.values[1].y - d.values[0].y)) {
                                if(i===0) {
                                    return that.k.appendUnits(that.chartData[i].weight);
                                }else {
                                    p--;
                                    return that.k.appendUnits(that.chartData[p].weight);
                                }
                            }
                            else {
                                return "";
                            }
                        })
                        .attr("text-anchor","middle")
                        .attr("pointer-events","none")
                        .style("font-weight", that.label.weight)
                        .style("font-size", that.label.size)
                        .attr("fill", that.label.color)
                        .style("font-family", that.label.family);
                    pyr_text.exit().remove();
                return this;
            },
            ticks : function () {
                // if(PykCharts.boolean(that.enableTicks)) {

                var line = that.group.selectAll("pyr-ticks")
                    .data(that.coordinates);

                var n = that.chartData.length;

                line.enter()
                    .append("line")
                    .attr("class", "pyr-ticks");

                line.attr("x1", function (d,i) {
                       if (d.values.length === 3) {
                            return (d.values[0].x + that.coordinates[that.coordinates.length-1].values[2].x)/2 ;
                       } else {
                            return ((d.values[2].x + d.values[3].x)/2 );
                       }
                    })
                    .attr("y1", function (d,i) {
                        if(d.values.length === 4) {
                            return (((d.values[0].y-d.values[1].y)/2)+d.values[1].y) +2;
                        } else {
                            return (d.values[0].y + that.coordinates[that.coordinates.length-1].values[1].y)/2;
                        }
                    })
                    .attr("x2", function (d, i) {
                          if (d.values.length === 3) {
                            return (d.values[0].x + that.coordinates[that.coordinates.length-1].values[2].x)/2  ;
                       } else {
                            return ((d.values[2].x + d.values[3].x)/2 )  ;
                       }
                    })
                    .attr("y2", function (d, i) {
                         if(d.values.length === 4) {
                            return (((d.values[0].y-d.values[1].y)/2)+d.values[1].y) +2;
                        } else {
                            return (d.values[0].y + that.coordinates[that.coordinates.length-1].values[1].y)/2;
                        }
                    })
                    .attr("stroke-width", that.ticks.strokeWidth)
                    .attr("stroke",that.ticks.color)
                    .transition()
                    .duration(that.transitions.duration())
                    .attr("x2", function (d,i) {
                        if(Math.abs(d.values[0].y - d.values[1].y) > 15) {
                            if (d.values.length === 3) {
                                return (d.values[0].x + that.coordinates[that.coordinates.length-1].values[2].x)/2 + 20;
                            } else {
                                return ((d.values[2].x + d.values[3].x)/2 ) + 20;
                            }
                        } else {
                            if (d.values.length === 3) {
                                return (d.values[0].x + that.coordinates[that.coordinates.length-1].values[2].x)/2 ;
                            } else {
                                return ((d.values[2].x + d.values[3].x)/2 ) ;
                            }
                        }
                    });
                    // .attr("x2", function (d, i) {
                    //     if(( d.values[0].y - d.values[1].y) > 0) {
                    //         if (d.values.length === 3) {
                    //             return (d.values[0].x + that.coordinates[that.coordinates.length-1].values[2].x)/2 + 20;
                    //         } else {
                    //             return ((d.values[2].x + d.values[3].x)/2 ) + 20;
                    //         }
                    //     } else {
                    //         if (d.values.length === 3) {
                    //             return (d.values[0].x + that.coordinates[that.coordinates.length-1].values[2].x)/2  ;
                    //         } else {
                    //             return ((d.values[2].x + d.values[3].x)/2 ) ;
                    //         }
                    //     }
                    // });

                line.exit().remove();

                var ticks_label = that.group.selectAll(".ticks_label")
                        .data(that.coordinates);

                ticks_label.enter()
                    .append("text")
                    .attr("x",0)
                    .attr("y",0)
                    .attr("class","ticks_label");

                var x,y;
                var j = that.chartData.length;
                ticks_label.attr("transform",function (d) {
                    if (d.values.length === 3) {
                        x = ((d.values[0].x + that.coordinates[that.coordinates.length-1].values[2].x)/2) + 30;
                    } else {
                        x = ((d.values[2].x + d.values[3].x)/2 ) + 30;
                    }
                     if(d.values.length === 4) {
                            y= (((d.values[0].y-d.values[1].y)/2)+d.values[1].y) +2;
                        } else {
                            y =(d.values[0].y + that.coordinates[that.coordinates.length-1].values[1].y)/2;
                        }

                    return "translate(" + x + "," + (y + 5) + ")";
                });

                ticks_label
                .text("")
                .transition()
                .delay(that.transitions.duration())

                ticks_label.text(function (d,i) {
                    if(i===0) {
                        return that.chartData[i].name;
                    }
                    else {
                        n--;
                        return that.chartData[n].name;                    }
                })
                .text(function (d,i) {
                    if(i===0) {
                        if (this.getBBox().height < (d.values[1].y - d.values[0].y)) {
                            return that.chartData[i].name;

                        } else {
                            return "";
                        }
                    }
                    else {
                        if (this.getBBox().height < (d.values[0].y - d.values[1].y)) {
                             j--;
                            return that.chartData[j].name;
                        }
                        else {
                            return "";
                        }
                    }
                })
                .style("fill",that.ticks.color)
                .style("font-size",that.ticks.size)
                .style("font-family", that.ticks.family)
                .attr("text-anchor","start");

                ticks_label.exit().remove();

                // }
                return this;
            },
            clubData: function () {

            	if (PykCharts.boolean(that.clubData.enable)) {
            		that.displayData = [];
                    that.maximum_weight = _.map(that.data,function(num){ return num.weight; });
                    that.maximum_weight.sort(function(a,b){ return b-a; });
                    that.checkDuplicate = [];
                    var others_Slice = {"name":that.clubData.text,"color":that.clubData.color,"tooltip":that.clubData.tooltipText,"highlight":false};
                    var index;
                    var i;
                    that.getIndexByName = function(name){
                        for(i=0;i<that.data.length;i++)
                        {
                            if(that.data[i].name == name)
                                return i;
                        }
                    };

                    var reject = function (index) {
                        var result = _.reject(that.maximum_weight,function(num)
                            {
                                return num==that.data[index].weight;
                            });
                        return result;
                    } ;
                    if(that.clubData.alwaysIncludeDataPoints.length!==0) {
                        for (i=0;i<that.clubData.alwaysIncludeDataPoints.length;i++)
                        {
                            index = that.getIndexByName(that.clubData.alwaysIncludeDataPoints[i]);
                            that.displayData.push(that.data[index]);

                            that.maximum_weight = reject (index);

                        }
                    }

                    that.getIndexByWeight = function (weight) {
                        for(var i=0;i<that.data.length;i++)
                        {
                            if(that.data[i].weight == weight) {
                                if((_.contains(that.checkDuplicate, i))===false) {
                                   that.checkDuplicate.push(i);
                                    return i;
                                }
                                else {
                                    continue;
                                }
                            }
                        }
                    };

                    var count = that.clubData.maximumNodes-that.displayData.length;

                    if(count>0)
                    {   that.displayData.push(others_Slice);
                        for (i=0;i<count-1;i++) {
                                index = that.getIndexByWeight(that.maximum_weight[i]);
                            that.displayData.push(that.data[index]);
                        }
                    }
                    var sumOthers = d3.sum(that.maximum_weight,function (d,i) {
                            if(i>=count)
                                return d;
                        });

                    others_Slice.weight = sumOthers;
                }
                else {
                    that.displayData = that.data;
                }
                that.displayData.sort(function (a,b) { return a.weight-b.weight; })
                return that.displayData;
            }
        }
    	return optional;
    };
};