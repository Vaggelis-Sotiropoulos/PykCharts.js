var PykCharts = {};

Array.prototype.groupBy = function (chart) {
    var gd = []
    , i
    , obj
    , dimensions = {
        "oned": ["name"],
        "line": ["x","name"],
        "area": ["x","name"],
        "bar": ["y","group"],
        "column": ["x","group"],
        "scatterplot": ["x","y","name","group"],
        "pulse": ["x","y","name","group"],
        "spiderweb": ["x","y","name"],
    }
    , charts = {
        "oned": {
            "dimension": "name",
            "fact": "weight"
        },
        "line": {
          "dimension": "x",
          "fact": "y",
          "name": "name"
        },
        "area": {
          "dimension": "x",
          "fact": "y",
          "name": "name"
        },
        "bar": {
          "dimension": "y",
          "fact": "x",
          "name": "group"
        },
        "column": {
          "dimension": "x",
          "fact": "y",
          "name": "group"
        },
        "scatterplot": {
          "dimension": "x",
          "fact": "y",
          "weight": "weight",
          "name": "name",
          "group": "group"
        },
        "pulse": {
          "dimension": "y",
          "fact": "x",
          "weight": "weight",
          "name": "name",
          "group": "group"
        },
        "spiderweb": {
          "dimension": "x",
          "fact": "y",
          "name": "name",
          "weight": "weight"
        }
    };

    var properties = dimensions[chart];
    var arr = this;
    var groups = [];
    for(var i = 0, len = arr.length; i<len; i+=1){
        var obj = arr[i];
        if(groups.length == 0){
            groups.push([obj]);
        }
        else{
            var equalGroup = false;
            for(var a = 0, glen = groups.length; a<glen;a+=1){
                var group = groups[a];
                var equal = true;
                var firstElement = group[0];
                properties.forEach(function(property){

                    if(firstElement[property] !== obj[property]){
                        equal = false;
                    }

                });
                if(equal){
                    equalGroup = group;
                }
            }
            if(equalGroup){
                equalGroup.push(obj);
            }
            else {
                groups.push([obj]);
            }
        }
    }

    for(i in groups) {
        if ($.isArray(groups[i])) {
            obj = {};
            var grp = groups[i]
            var chart_name = charts[chart];
            obj[chart_name.dimension] = grp[0][chart_name.dimension];
            if (chart_name.name) {
                obj[chart_name.name] = grp[0][chart_name.name];
            }
            if (chart_name.weight) {
                obj[chart_name.weight] = d3.sum(grp, function (d) { return d[charts[chart].weight]; });
                obj[chart_name.fact] = grp[0][chart_name.fact];
            } else {
                obj[chart_name.fact] = d3.sum(grp, function (d) { return d[charts[chart].fact]; });
            }
            if (chart_name.group) {
                obj[chart_name.group] = grp[0][chart_name.group];
            }
            var f = _.extend(obj,_.omit(grp[0], _.values(charts[chart])));
            gd.push(f);
        }
    };
    return gd;
};

PykCharts.boolean = function(d) {
    var false_values = ['0','f',"false",'n','no',''];
    var false_keywords = [undefined,null,NaN];
    if(_.contains(false_keywords, d)) {
        return false;
    }
    value = d.toLocaleString();
    value = value.toLowerCase();
    if (false_values.indexOf(value) > -1) {
        return false;
    } else {
        return true;
    }
};

PykCharts.Configuration = function (options){
	var that = this;

	var configuration = {
		liveData : function (chart) {
            var frequency = options.real_time_charts_refresh_frequency;
	        if(PykCharts.boolean(frequency)) {
                setInterval(chart.refresh,frequency*1000);
	        }
	        return this;
	    },
        emptyDiv : function () {
            d3.select(options.selector).append("div")
                .style("clear","both");

            return this;
        },
        scaleIdentification : function (type,data,range,x) {
            var scale;
            if(type === "ordinal") {
               scale = d3.scale.ordinal()
                    .domain(data)
                    .rangeRoundBands(range, x);
                return scale;

            } else if(type === "linear") {
                scale = d3.scale.linear()
                    .domain(data)
                    .range(range);
                return scale;

            } else if(type === "time") {
                scale = d3.time.scale()
                    .domain(data)
                    .range(range);
                return scale;
            }
        },
	    appendUnits : function (text) {
            text = PykCharts.numberFormat(text);
            var label,prefix,suffix;
                prefix = options.units_prefix,
                suffix = options.units_suffix;
                if(prefix && prefix !== "") {
                    label = prefix + " " + text;
                    if(suffix) {
                        label += " " + suffix;
                    }
                } else if(suffix && suffix !== "") {
                    label = text + " " + suffix;
                } else {
                    label = text;
                }

            return label;
        },
		title : function () {
            if(PykCharts.boolean(options.title_text) && options.title_size) {
                var div_width = options.width;

                if(PykCharts.boolean(options.export_enable)) {
                    div_width = 0.9*options.width;
                }
	        	that.titleDiv = d3.select(options.selector)
	                .append("div")
	                    .attr("id","title")
	                    .style("width", (options.width) + "px")
	                    .style("text-align","left")
                        .style("float","left")
	                    .html("<span style='pointer-events:none;font-size:" +
                        options.title_size+
                        "px;color:" +
                        options.title_color+
                        ";font-weight:" +
                        options.title_weight+
                        ";font-family:" +
                        options.title_family
                        + "'>" +
                        options.title_text +
                        "</span>");
	        }
	        return this;
	    },
        subtitle : function () {
            if(PykCharts.boolean(options.subtitle_text) && options.subtitle_size) {
                that.subtitleDiv = d3.select(options.selector)
                    .append("div")
                        .attr("id","sub-title")
                        .style("width", options.width + "px")
                        .style("text-align","left")
                        .html("<span style='pointer-events:none;font-size:" +
                        options.subtitle_size+"px;color:" +
                        options.subtitle_color +
                        ";font-weight:" +
                        options.subtitle_weight+";font-family:" +
                        options.subtitle_family + "'>"+
                        options.subtitle_text + "</span>");
            }
            return this;
        },
        createFooter : function () {
            d3.select(options.selector).append("table")
                .attr("id","footer")
                .style("background", options.bg)
                .attr("width",options.width+"px");
            return this;
        },
        lastUpdatedAt : function (a) {
            if(PykCharts.boolean(options.real_time_charts_refresh_frequency) && PykCharts.boolean(options.real_time_charts_last_updated_at_enable)) {
                if(a === "liveData"){
                    var currentdate = new Date();
                    var date = currentdate.getDate() + "/"+(currentdate.getMonth()+1)
                        + "/" + currentdate.getFullYear() + " "
                        + currentdate.getHours() + ":"
                        + currentdate.getMinutes() + ":" + currentdate.getSeconds();
                    $(options.selector+" #lastUpdatedAt").html("<span style='pointer-events:none;'>Last Updated At: </span><span style='pointer-events:none;'>"+ date +"</span>");
                } else {
                    var currentdate = new Date();
                    // console.log(currentdate.getDate());
                    var date = currentdate.getDate() + "/"+(currentdate.getMonth()+1)
                        + "/" + currentdate.getFullYear() + " "
                        + currentdate.getHours() + ":"
                        + currentdate.getMinutes() + ":" + currentdate.getSeconds();
                    d3.select(options.selector+" #footer")
                        .append("tr")
                        .attr("class","PykCharts-credits")
                        .html("<td colspan=2 style='text-align:right' id='lastUpdatedAt'><span style='pointer-events:none;'>Last Updated At: </span><span style='pointer-events:none;'>"+ date +"</span></tr>")
                }
            }
            return this;
        },
        checkChangeInData: function (data, compare_data) { // this function checks if the data in json has been changed
            var key1 = Object.keys(compare_data[0]);
            var key2 = Object.keys(data[0]);
            var changed = false;
            if(key1.length === key2.length && compare_data.length === data.length) {
                for(i=0;i<data.length;i++) {
                    for(j=0;j<key1.length;j++){
                        if(data[i][key2[j]] !== compare_data[i][key1[j]] || key1[j] !== key2[j]) {
                            changed = true;
                            break;
                        }
                    }
                }
            } else {
                changed = true;
            }
            that.compare_data = data;
            return [that.compare_data, changed];
        },
	    credits : function () {
            if(PykCharts.boolean(options.credit_my_site_name) || PykCharts.boolean(options.credit_my_site_url)) {
                var enable = true;

                if(options.credit_my_site_name === "") {
                    options.credit_my_site_name = options.credit_my_site_url;
                }
                if(options.credit_my_site_url === "") {
                    enable = false;
                }

                d3.select(options.selector+" #footer").append("tr")
                    .attr("class","PykCharts-credits")
                    .attr("id","credit-datasource")
                    .append("td")
                    .style("text-align","left")
                    .html("<span style='pointer-events:none;'>Credits: </span><a href='" +  options.credit_my_site_url + "' target='_blank' onclick='return " + enable +"'>"+  options.credit_my_site_name +"</a>");
                    // .html("<span style='pointer-events:none;'>Credits: </span><a href='" + credit.mySiteUrl + "' target='_blank' onclick='return " + enable +"'>"+ credit.mySiteName +"</a>");

            }
	        return this;
	    },
	    dataSource : function () {
	        if( (PykCharts.boolean(options.data_source_name) || PykCharts.boolean(options.data_source_url))) {
                var enable = true;
                if(options.data_source_name === "") {
                    options.data_source_name =options.data_source_url;
                }
                if(options.data_source_url === "") {
                    enable = false;
                }
                if($(options.selector+" #footer").length) {
                    d3.select(options.selector+" table #credit-datasource")
                        .style("background", options.bg)
                        .append("td")
                        .style("text-align","right")
                        .html("<span style='pointer-events:none;'>Source: </span><a href='" + options.data_source_url + "' target='_blank' onclick='return " + enable +"'>"+ options.data_source_name +"</a></tr>");
                }
                else {
                    d3.select(options.selector).append("table")
                        .attr("id","footer")
                        .style("background", options.bg)
                        .attr("width",options.width+"px")
                        .append("tr")
                        .attr("class","PykCharts-credits")
                        .append("td")
                        .style("text-align","right")
                        .html("<span style='pointer-events:none;'>Source: </span><a href='" + options.data_source_url + "' target='_blank' onclick='return " + enable +"'>"+ options.data_source_name +"</a></tr>");
                }
            }
	        return this;
	    },
        makeMainDiv : function (selection,i) {
            var d = d3.select(selection).append("div")
                .attr("id","tooltip-svg-container-"+i)
                .attr("class","main-div")
                .style("width",options.width);
            if(PykCharts.boolean(options.multiple_containers_enable)){
                d.style("float","left")
                    .style("width","auto");
            }
            return this;
        },
	    tooltip : function (d,selection,i) {
            if(PykCharts.boolean(options.tooltip_enable) && options.mode === "default") {
                if(selection !== undefined){
                    PykCharts.Configuration.tooltipp = d3.select(selection).append("div")
                        .attr("id", "pyk-tooltip")
                        .attr("class","pyk-line-tooltip");
                } else {
                    PykCharts.Configuration.tooltipp = d3.select("body")
                        .append("div")
                        .attr("id", "pyk-tooltip")
                        .style("height","auto")
                        .style("padding", "5px 6px")
                        .style("color","#4F4F4F")
                        .style("background","#fff")
                        .style("text-decoration","none")
                        .style("position", "absolute")
                        .style("border-radius", "5px")
                        .style("border","1px solid #CCCCCC")
                        .style("text-align","center")
                        .style("font-family","Arial, Helvetica, sans-serif")
                        .style("font-size","14px")
                        .style("min-width","30px")
                        .style("z-index","10")
                        .style("visibility", "hidden")
                        .style("box-shadow","0 5px 10px rgba(0,0,0,.2)");
                }
            } else if (PykCharts.boolean(options.tooltip_enable)) {
                if (options.tooltip_mode === "fixed") {
                    PykCharts.Configuration.tooltipp = d3.select("body")
                        .append("div")
                        .attr("id", "pyk-tooltip")
                        .style("height","auto")
                        .style("padding", "5px 6px")
                        .style("color","#4F4F4F")
                        .style("background","#fff")
                        .style("text-decoration","none")
                        .style("position", "absolute")
                        .style("border-radius", "5px")
                        .style("text-align","center")
                        .style("font-family","Arial, Helvetica, sans-serif")
                        .style("font-size","14px")
                        .style("min-width","30px")
                        .style("z-index","10")
                        .style("visibility", "hidden");
                } else {
                    PykCharts.Configuration.tooltipp = d3.select("body")
                        .append("div")
                        .attr("id", "pyk-tooltip")
                        .style("height","auto")
                        .style("padding", "5px 6px")
                        .style("color","#4F4F4F")
                        .style("background","#fff")
                        .style("text-decoration","none")
                        .style("position", "absolute")
                        .style("border-radius", "5px")
                        .style("text-align","center")
                        .style("font-family","Arial, Helvetica, sans-serif")
                        .style("font-size","14px")
                        .style("min-width","30px")
                        .style("z-index","10")
                        .style("visibility", "hidden");
                }
            }
            return this;
        },
        annotation : function (svg,data,xScale,yScale) {
            var w = 0,h=0;

            var annotation_rect = d3.select(svg).selectAll(".annotation-rect")
                .data(data)

            annotation_rect.enter()
                .append("rect")
                .attr("class","annotation-rect");

            var annotation_text = d3.select(svg).selectAll(".annotation-text")
                .data(data)

            annotation_text.enter()
                .append("text")
                .attr("class","annotation-text");

            annotation_text.attr("x",function (d) {
                    return parseInt(xScale(d.x)-(5))+options.extra_left_margin+options.margin_left;
                })
                .attr("y", function (d) {
                    return parseInt(yScale(d.y)-20+options.margin_top);
                })
                .attr("text-anchor","middle")
                .style("z-index", "10")
                .text(function (d) {
                    return d.annotation;
                })
                .text(function (d) {
                    w = this.getBBox().width + 20;
                    h = this.getBBox().height + 10;
                    return d.annotation;
                })
                .style("pointer-events","none");

            annotation_rect.attr("x",function (d) {
                    return (parseInt(xScale(d.x)-(5))+options.extra_left_margin+options.margin_left) - (w/2);
                })
                .attr("y", function (d) {
                    return (parseInt(yScale(d.y)-10+options.margin_top)) - h;
                })
                .attr("width",w)
                .attr("height",h)
                .attr("fill","#eeeeee")
                .style("pointer-events","none");

            // });
        },
        crossHair : function (svg,len,data,fill) {

            if(PykCharts.boolean(options.crosshair_enable) && options.mode === "default") {
                PykCharts.Configuration.cross_hair_v = svg.append("g")
                    .attr("class","line-cursor")
                    .style("display","none");
                PykCharts.Configuration.cross_hair_v.append("line")
                    .attr("class","cross-hair-v")
                    .attr("id","cross-hair-v");

                PykCharts.Configuration.cross_hair_h = svg.append("g")
                    .attr("class","line-cursor")
                    .style("display","none");
                PykCharts.Configuration.cross_hair_h.append("line")
                    .attr("class","cross-hair-h")
                    .attr("id","cross-hair-h");
                for (j=0; j<len; j++) {
                    PykCharts.Configuration.focus_circle = svg.append("g")
                        .attr("class","focus")
                        .style("display","none")
                        .attr("id","f_circle"+j);

                    PykCharts.Configuration.focus_circle.append("circle")
                        .attr("fill",function (d) {
                            return fill.colorPieMS(data[j]);
                        })
                        .attr("id","focus-circle"+j)
                        .attr("r",6);
                }
            }
            return this;
        },
        fullScreen : function (chart) {
            if(PykCharts.boolean(options.fullScreen)) {
                that.fullScreenButton = d3.select(options.selector)
                    .append("input")
                        .attr("type","image")
                        .attr("id","btn-zoom")
                        .attr("src","../../PykCharts/img/apple_fullscreen.jpg")
                        .style("font-size","30px")
                        .style("left","800px")
                        .style("top","0px")
                        .style("position","absolute")
                        .style("height","4%")
                        .on("click",chart.fullScreen);
            }
            return this;
	    },
        loading: function () {
            if(options.loading) {
                $(options.selector).html("<div id='chart-loader'><img src="+options.loading+"></div>");
                $(options.selector + " #chart-loader").css({"visibility":"visible","padding-left":((options.width)/2) +"px","padding-top":((options.height)/2) + "px"});
            }
            return this;
        },
	    positionContainers : function (position, chart) {
            if(PykCharts.boolean(options.legends_enable) && !(PykCharts.boolean(options.variable_circle_size_enable))) {
                if(position == "top" || position == "left") {
                    chart.optionalFeatures().legendsContainer().svgContainer();
                }
                if(position == "bottom" || position == "right") {
                    chart.optionalFeatures().svgContainer().legendsContainer();
                }
            }
            else {
                chart.optionalFeatures().svgContainer();
            }
            return this;
        },
        yGrid: function (svg, gsvg, yScale) {
            var width = options.width,
                height = options.height;
            if(PykCharts.boolean(options.grid_y_enable)) {
                var ygrid = PykCharts.Configuration.makeYGrid(options,yScale);
                gsvg.selectAll(options.selector + " g.y.grid-line")
                    .style("stroke",function () { return options.grid_color; })
                    .call(ygrid);
            }
            return this;
        },
        xGrid: function (svg, gsvg, xScale) {
             var width = options.width,
                height = options.height;

            if(PykCharts.boolean(options.grid_x_enable)) {
                var xgrid = PykCharts.Configuration.makeXGrid(options,xScale);
                gsvg.selectAll(options.selector + " g.x.grid-line")
                    .style("stroke",function () { return options.grid_color; })
                    .call(xgrid);
            }
            return this;
        },
        xAxis: function (svg, gsvg, xScale,extra,domain,legendsGroup_height) {
            var width = options.width,
                height = options.height;

            if(legendsGroup_height === undefined) {
                legendsGroup_height = 0;
            }

            var k = new PykCharts.Configuration(options);
            var e = extra;

            if(PykCharts.boolean(options.axis_x_enable)){
                d3.selectAll(options.selector + " .x.axis").attr("fill",function () {return options.axis_x_label_color;});
                if(options.axis_x_position === "bottom") {
                    gsvg.attr("transform", "translate(0," + (options.height - options.margin_top - options.margin_bottom - legendsGroup_height) + ")");
                }
                var xaxis = PykCharts.Configuration.makeXAxis(options,xScale);
                if(options.axis_x_pointer_values.length != 0) {
                    var newVal = [];
                    if(options.axis_x_data_format === "time") {
                        _.each(options.axis_x_pointer_values, function (d) {
                            newVal.push(new Date(d));
                        });
                    } else {
                        newVal = options.axis_x_pointer_values;
                    }
                    xaxis.tickValues(newVal);
                }

                gsvg.style("stroke",function () { return options.axis_x_line_color; })
                    .call(xaxis)
                if((options.axis_x_data_format === "string") && options.multiple_containers_enable === "no") {
                    k.ordinalXAxisTickFormat(domain,extra);
                }
            }
            return this;
        },

        yAxis: function (svg, gsvg, yScale,domain) {
            var width = options.width,
                height = options.height;
            var k = new PykCharts.Configuration(options);
             var w;
                    if(PykCharts.boolean(options.multiple_containers_enable)) {
                        w = options.w;
                    } else {
                        w = options.width;
                    }

            if(PykCharts.boolean(options.axis_y_enable)){
                if(options.axis_y_position === "right") {
                    gsvg.attr("transform", "translate(" + (w - options.margin_left - options.margin_right) + ",0)");
                }
                d3.selectAll(options.selector + " .y.axis").attr("fill",function () { return options.axis_y_label_color; });
                var yaxis = PykCharts.Configuration.makeYAxis(options,yScale);

                if(options.axis_y_pointer_values.length != 0) {
                    yaxis.tickValues(options.axis_y_pointer_values);
                }
                var mouseEvent = new PykCharts.Configuration.mouseEvent(options);
                gsvg.style("stroke",function () { return options.axis_y_line_color; })
                    .call(yaxis)

                if((options.axis_y_data_format === "string") && options.multiple_containers_enable === "no") {
                    k.ordinalYAxisTickFormat(domain);
                }
            }
            return this;
        },
        xAxisTitle : function (gsvg) {
              var w;
                if(PykCharts.boolean(options.multiple_containers_enable)) {
                    w = options.w;
                } else {
                    w = options.width;
                }
                if(options.axis_x_position === "bottom") {
                    gsvg.append("text")
                        .attr("x", (w- options.margin_left - options.margin_right)/2)
                        .attr("y", options.margin_bottom)
                        .style("text-anchor", "middle")
                        .style("fill",options.axis_x_label_color)
                        .text(options.axis_x_title);

                } else if (options.axis_x_position === "top") {
                    gsvg.append("text")
                        .attr("x", (w - options.margin_left - options.margin_right)/2)
                        .attr("y", - options.margin_top + 10)
                        .style("text-anchor", "middle")
                        .style("fill",options.axis_x_label_color)
                        .text(options.axis_x_title);
                }
            return this;
        },
        yAxisTitle: function (gsvg) {
             var w;
                if(PykCharts.boolean(options.multiple_containers_enable)) {
                    w = options.w;
                } else {
                    w = options.width;
                }
                if(options.axis_y_position === "left"){
                    gsvg.append("text")
                        .attr("x",-(options.height)/2 )
                        .attr("transform", "rotate(-90)")
                        .attr("y", -(options.margin_left - 12))
                        // .attr("dy", ".71em")
                        .style("fill",options.axis_y_label_color)
                        // .style("text-anchor", "end")
                        .text(options.axis_y_title);
                } else if (options.axis_y_position === "right") {
                     gsvg.append("text")
                        .attr("x",-(options.height)/2)
                        .attr("transform", "rotate(-90)")
                        .style("fill",options.axis_y_label_color)
                        // .attr("y", 12)
                        .attr("y", options.margin_right - 12)
                        .attr("dy", ".71em")
                        // .style("text-anchor", "end")
                        .text(options.axis_y_title);
                }
            return this;
        },
        isOrdinal: function(svg,container,scale,domain,extra) {
            var k = new PykCharts.Configuration(options);
            if(container === ".x.axis") {
                svg.select(container).call(PykCharts.Configuration.makeXAxis(options,scale));
                if((options.axis_x_data_format === "string") && options.multiple_containers_enable === "no") {
                    k.ordinalXAxisTickFormat(domain,extra);
                }
            }
            else if (container === ".x.grid") {
                svg.select(container).call(PykCharts.Configuration.makeXGrid(options,scale));
            }
            else if (container === ".y.axis") {
                svg.select(container).call(PykCharts.Configuration.makeYAxis(options,scale));
                if((options.axis_y_data_format === "string") && options.multiple_containers_enable === "no") {
                    k.ordinalyAxisTickFormat(domain);
                }
            }
            else if (container === ".y.grid") {
                svg.select(container).call(PykCharts.Configuration.makeYGrid(options,scale));
            }
            return this;
        },
        ordinalXAxisTickFormat :function (domain,extra) {
            var mouseEvent = new PykCharts.Configuration.mouseEvent(options);
            var a = $(options.selector + " g.x.axis text");
            var len = a.length,comp;
            for(i=0; i<len-1;i++) {
                comp = a[i].innerHTML;
                if(a[i].getBBox().width > ((extra*2) * 0.7)) {
                    comp = comp.substr(0,3) + "..";

                }
                a[i].innerHTML = comp;
            }
            xaxistooltip = d3.selectAll(options.selector + " g.x.axis text")
                .data(domain)
            xaxistooltip.on('mouseover',function (d) {
                    mouseEvent.tooltipPosition(d);
                    mouseEvent.toolTextShow(d);
                })
                .on('mousemove', function (d) {
                    mouseEvent.tooltipPosition(d);
                    mouseEvent.toolTextShow(d);
                })
                .on('mouseout', function (d) {
                    mouseEvent.tooltipHide(d);
                });
            return this;
        },
        ordinalYAxisTickFormat : function (domain) {
            var mouseEvent = new PykCharts.Configuration.mouseEvent(options);
            var a = $(options.selector + " g.y.axis text");

            var len = a.length,comp;
            console.log(a,"heyyyyyyyyy");
            for(i=0; i<len-1;i++) {
                comp = a[i].innerHTML;
                console.log(comp,"comp");
                if(a[i].getBBox().width > (options.margin_left * 0.7)) {
                    console.log(comp);
                    comp = comp.substr(0,3) + "..";

                }
                a[i].innerHTML = comp;
            }
            xaxistooltip = d3.selectAll(options.selector + " g.y.axis text")
                .data(domain)
            xaxistooltip.on('mouseover',function (d) {
                    mouseEvent.tooltipPosition(d);
                    mouseEvent.toolTextShow(d);
                })
                .on('mousemove', function (d) {
                    mouseEvent.tooltipPosition(d);
                    mouseEvent.toolTextShow(d);
                })
                .on('mouseout', function (d) {
                    mouseEvent.tooltipHide(d);
                });
            return this;
        },
        totalColors: function (tc) {
            var n = parseInt(tc, 10)
            if (n > 2 && n < 10) {
                that.total_colors = n;
                return this;
            };
            that.total_colors = 9;
            return this;
        },
        colorType: function (ct) {
            if (ct === "colors") {
                that.legends = "no";
            };
            return this;
        },
        xAxisDataFormatIdentification : function (data){
            if(_.isNumber(data[0].x) || !(isNaN(data[0].x))){
                return "number";
            } else if(!(isNaN(new Date(data[0].x).getTime()))) {
                return "time";
            } else {
                return "string";
            }
        },
        yAxisDataFormatIdentification : function (data){
            console.log(!(isNaN(data[0].y)),options.selector,_.isNumber(data[0].y));
            if(_.isNumber(data[0].y) || !(isNaN(data[0].y))){
                console.log(data,"dddd");
                return "number";
            } else if(!(isNaN(new Date(data[0].y).getTime()))) {
                return "time";
            } else {
                console.log(options.selector);  
                return "string";
            }
        },
        resize : function (svg,anno,lsvg) {
            var aspect = (options.width/options.height);
            var targetWidth = $(options.selector).width();
            if(targetWidth > options.width) {
                targetWidth = options.width;
            }
            svg.attr("width", targetWidth);
            svg.attr("height", targetWidth / aspect);
            if(PykCharts.boolean(options.title_text)) {
                $(options.selector + " #title").css("width", targetWidth);
            }
            if(PykCharts.boolean(options.subtitle_text)) {
                $(options.selector + " #sub-title").css("width", targetWidth);
            }
            if(lsvg !== undefined) {
                lsvg.attr("width",targetWidth);
            }
            var a = $(options.selector + " #footer");
            if(a) {
                a.attr("width",targetWidth);
            }
            var b = $(options.selector + " .main-div");
            if(b && !(PykCharts.boolean(options.multiple_containers_enable))) {
                $(options.selector + " .main-div").css("width",targetWidth);
            }
            if(PykCharts.boolean(anno)) {
                // options.annotation;
            }
        },
        __proto__: {
            _domainBandwidth: function (domain_array, count, type) {
                addFactor = 0;
                // if (callback) {
                //     // addFactor = callback();
                // }
                if(type === "time") {
                    var a = domain_array[0],
                        b = domain_array[1], new_array = [];
                    padding = (b - a) * 0.1;
                    if (count === 0) {
                        new_array[0] = a - (padding + addFactor);
                    }else if(count === 1) {
                        new_array[1] = b + (padding + addFactor);
                    }else if (count === 2) {
                        new_array[0] = a - (padding + addFactor);
                        new_array[1] = b + (padding + addFactor);
                    }
                    return [new Date(new_array[0]),new Date(new_array[1])];
                }else {
                    padding = (domain_array[1] - domain_array[0]) * 0.1;
                    if (count === 0) {
                        domain_array[0] -= (padding + addFactor);
                    }else if(count === 1) {
                        domain_array[1] = parseFloat(domain_array[1],10) + (padding + addFactor);
                    }else if (count === 2) {
                        domain_array[0] -= (padding + addFactor);
                        domain_array[1] = parseFloat(domain_array[1],10) + (padding + addFactor);
                    }
                    return domain_array;
                }
            },
            _radiusCalculation: function (radius_percent,type) {
                var min_value;
                if(type !== undefined) {
                    min_value = options.width;
                } else {
                    min_value = d3.min([options.width,options.height]);
                }
                return (min_value*radius_percent)/200;
            }
        },
        export : function(chart,svgId,chart_name) {

            if(PykCharts.boolean(options.export_enable)) {

                var canvas_id = chart_name+"canvas";
                var canvas = document.createElement("canvas");
                canvas.setAttribute('display', "none")
                canvas.setAttribute('id', canvas_id);
                var id = "export",
                div_size = options.width
                div_float ="none"
                div_left = options.width-15;

                if(PykCharts.boolean(options.title_text) && options.title_size) {
                    div_size = 0.1*options.width;
                    div_float ="right";
                    div_left = -15;
                }

                d3.select(chart.selector)
                                .append("div")
                                .attr("id",id)
                                .attr("width",div_size)
                                .style("left",div_left+"px")
                                // .style("padding-left","15px")
                                .style("margin-bottom","3px")
                                .html("<img src='../img/download-icon.png' />");

                var get_canvas = document.getElementById(canvas_id);
                paper.setup(get_canvas);
                var project = new paper.Project();
                project._view._viewSize.width = chart.width;
                project._view._viewSize.height = chart.height;
                var name = chart_name + ".svg"

                $(chart.selector + " #"+id).click(function(){

                    project.importSVG(document.querySelector(options.selector +" "+svgId));
                    var svg = project.exportSVG({ asString: true });
                    console.log(svg,"btoa");
                    downloadDataURI({
                        data: 'data:image/svg+xml;base64,' + btoa(svg),
                        filename: name
                    });
                    project.clear();

                });
            }
            return this;
        }
    };
    return configuration;
};

var configuration = PykCharts.Configuration;
configuration.mouseEvent = function (options) {
    var that = this;
    that.tooltip = configuration.tooltipp;
    that.cross_hair_v = configuration.cross_hair_v;
    that.cross_hair_h = configuration.cross_hair_h;
    that.focus_circle = configuration.focus_circle;
    that.pt_circle = configuration.pt_circle;
    that.start_pt_circle = configuration.start_pt_circle;

    var status;

    var action = {
        tooltipPosition : function (d,xPos,yPos,xDiff,yDiff,group_index) {

            if(PykCharts.boolean(options.tooltip_enable)) {
            	if(xPos !== undefined){
                    // console.log("checking stackedAreaChart","1",group_index);
                    var width_tooltip = parseFloat($(options.selector+" #tooltip-svg-container-"+group_index).next("#pyk-tooltip").css("width"));
                    $(options.selector+" #tooltip-svg-container-"+group_index).next("#pyk-tooltip")
            			.css("visibility", "visible")
                        .css("top", (yPos + yDiff) + "px")
                        .css("left", (xPos + options.margin_left + xDiff - width_tooltip) + "px");
                }
                else {
                    that.tooltip
                        .style("visibility", "visible")
                        .style("top", (d3.event.layerY - 20) + "px")
                        .style("left", (d3.event.layerX + 30) + "px");
                }
                return that.tooltip;
            }
        },
        toolTextShow : function (d,multiple_containers_enable,type,group_index) {
            if(PykCharts.boolean(options.tooltip_enable)) {
                if(multiple_containers_enable === "yes" && type === "multilineChart") {
                    $(options.selector+" #tooltip-svg-container-"+group_index).next("#pyk-tooltip").html(d);
                }
                else {
                    that.tooltip.html(d);
                }
            }
            return this;
        },
        tooltipHide : function (d,multiple_containers_enable,type) {
            if(PykCharts.boolean(options.tooltip_enable)) {
                if(multiple_containers_enable === "yes" && type === "multilineChart") {
                    return d3.selectAll(options.selector+" .pyk-line-tooltip").style("visibility","hidden");
                }
                else {
                    return that.tooltip.style("visibility", "hidden");
                }
            }
        },
        crossHairPosition: function(data,new_data,xScale,yScale,dataLineGroup,lineMargin,domain,type,tooltipMode,color_from_data,multiple_containers_enable){
            if((PykCharts.boolean(options.crosshair_enable) || PykCharts.boolean(options.tooltip_enable) || PykCharts.boolean(options.onHoverHighlightenable))  && options.mode === "default") {
                var offsetLeft = options.margin_left + lineMargin +  $(options.selector + " #"+dataLineGroup[0][0][0].parentNode.parentNode.id).offset().left;
                var offsetTop = $(options.selector + " #"+dataLineGroup[0][0][0].parentNode.parentNode.id).offset().top;
                var number_of_lines = new_data.length;
                var left = options.margin_left;
                var right = options.margin_right;
                var top = options.margin_top;
                var bottom = options.margin_bottom;
                var w = options.width;
                var h = options.height;
                var group_index = parseInt(d3.event.target.id.substr((d3.event.target.id.length-1),1));
                var c = b - a;
                var x = d3.event.pageX - offsetLeft;
                var y = d3.event.pageY - offsetTop - top ;
                var x_range = [];
                if(options.axis_x_data_format==="string") {
                    x_range = xScale.range();
                } else {
                    temp = xScale.range();
                    pad = (temp[1]-temp[0])/new_data[0].data.length;
                    len = new_data[0].data.length;
                    strt = 0;
                    for(i = 0;i<len;i++){
                        strt = strt + pad;
                        x_range[i] = strt;
                    }

                }
                var y_range = yScale.range();
                var j,tooltpText,active_x_tick,active_y_tick = [],left_diff,right_diff,
                    pos_line_cursor_x,pos_line_cursor_y = [],right_tick,left_tick,
                    range_length = x_range.length,colspan,bottom_tick,top_tick;
                for(j = 0;j < range_length;j++) {
                    for(k = 0; k<y_range.length;k++) {
                        if((j+1) >= range_length) {
                            return false;
                        }
                        else {
                          if((right_tick === x_range[j] && left_tick === x_range[j+1]) && (top_tick === y_range[k])) {
                                return false;
                            }
                            else if((x >= x_range[j] && x <= x_range[j+1]) && (y <= (y_range[k]))) {
                                left_tick = x_range[j], right_tick = x_range[j+1];
                                bottom_tick = y_range[k+1];
                                top_tick = y_range[k];
                                left_diff = (left_tick - x), right_diff = (x - right_tick);

                                if(left_diff >= right_diff) {
                                    active_x_tick = data[j].x;
                                    active_y_tick.push(data[j].y);
                                    tooltipText = data[j].tooltip || data[j].y;
                                    pos_line_cursor_x = (xScale(active_x_tick) + lineMargin + left);
                                    pos_line_cursor_y = (yScale(data[j].y) + top );
                                }
                                else {
                                    active_x_tick = data[j+1].x;
                                    active_y_tick.push(data[j+1].y);
                                    tooltipText = data[j+1].tooltip || data[j+1].y; // Line Chart ONLY!
                                    pos_line_cursor_x = (xScale(active_x_tick) + lineMargin + left);
                                    pos_line_cursor_y = (yScale(data[j+1].y) + top);
                                }
                                if(type === "multilineChart" /*|| type === "stackedAreaChart"*/) {
                                    if(multiple_containers_enable === "no") {
                                        var test = [];
                                        d3.selectAll(options.selector+" #pyk-tooltip").classed({"pyk-line-tooltip":false,"pyk-multiline-tooltip":true,"pyk-tooltip-table":true});
                                        var len_data = new_data[0].data.length,tt_row=""; // Assumption -- number of Data points in different groups will always be equal
                                        active_y_tick = [];
                                        for(var a=0;a < number_of_lines;a++) {
                                            for(var b=0;b < len_data;b++) {
                                                if(options.axis_x_data_format === "time") {
                                                    cond = Date.parse(active_x_tick)===Date.parse(new_data[a].data[b].x);
                                                } else {
                                                    cond = new_data[a].data[b].x === active_x_tick;
                                                }
                                                if(cond) {
                                                    active_y_tick.push(new_data[a].data[b].y);
                                                    test.push(yScale(new_data[a].data[b].y) + top);
                                                    if(!PykCharts.boolean(color_from_data)) {
                                                        tt_row += "<tr><td>"+new_data[a].name+"</td><td><b>"+new_data[a].data[b].tooltip+"</b></td></tr>";
                                                        colspan = 2;
                                                    }
                                                    else if (PykCharts.boolean(color_from_data)) {
                                                        tt_row += "<tr><td><div style='padding:2px;width:5px;height:5px;background-color:"+new_data[a].color+"'></div></td><td>"+new_data[a].name+"</td><td><b>"+new_data[a].data[b].tooltip+"</b></td></tr>";
                                                        colspan = 3;
                                                    }
                                                }
                                            }
                                        }

                                        pos_line_cursor_x += 6;
                                        tooltipText = "<table><thead><th colspan='"+colspan+"'>"+active_x_tick+"</th></thead><tbody>"+tt_row+"</tbody></table>";
                                        if(type === "stackedAreaChart") {
                                            group_index = 1;
                                            this.tooltipPosition(tooltipText,pos_line_cursor_x,y,60,70,group_index);
                                        } else {
                                            this.tooltipPosition(tooltipText,pos_line_cursor_x,y,60,-15,group_index);
                                        }
                                        this.toolTextShow(tooltipText);
                                        (options.crosshair_enable) ? this.crossHairShow(pos_line_cursor_x,top,pos_line_cursor_x,(h - bottom),pos_line_cursor_x,test,type,active_y_tick.length,multiple_containers_enable,new_data) : null;
                                        // (options.crosshair_enable) ? this.crossHairShow(pos_line_cursor_x,top,pos_line_cursor_x,(h - bottom),pos_line_cursor_x,pos_line_cursor_y,type,active_y_tick.length,multiple_containers_enable) : null;
                                        this.axisHighlightShow(active_y_tick,options.selector+" .y.axis",domain);
                                        this.axisHighlightShow(active_x_tick,options.selector+" .x.axis",domain);
                                    }
                                    else if(multiple_containers_enable === "yes") {
                                        pos_line_cursor_x += 5;
                                        var len_data = new_data[0].data.length;
                                        for(var a=0;a < number_of_lines;a++) {
                                            var left_offset = $(options.selector + " #svg-"+a).offset().left;
                                            var top_offset = $(options.selector + " #svg-"+a).offset().top - $(options.selector).offset().top;
                                            for(var b=0;b < len_data;b++) {
                                                if(options.axis_x_data_format === "time") {
                                                    cond = Date.parse(active_x_tick)===Date.parse(new_data[a].data[b].x);
                                                } else {
                                                    cond = new_data[a].data[b].x === active_x_tick;
                                                }
                                                if(cond) {
                                                    active_y_tick.push(new_data[a].data[b].y);
                                                    tooltipText = new_data[a].data[b].tooltip;
                                                    pos_line_cursor_y = (yScale(new_data[a].data[b].y) + top);
                                                    this.tooltipPosition(tooltipText,(pos_line_cursor_x+left_offset),(pos_line_cursor_y+top_offset),-15,-15,a);

                                                    this.toolTextShow(tooltipText,multiple_containers_enable,type,a);
                                                    (options.crosshair_enable) ? this.crossHairShow(pos_line_cursor_x,top,pos_line_cursor_x,(h - bottom),pos_line_cursor_x,pos_line_cursor_y,type,active_y_tick.length,multiple_containers_enable,new_data[a],a) : null;
                                                }
                                            }
                                        }
                                    }
                                }
                                else if(type === "lineChart" || type === "areaChart") {
                                    if((options.tooltip_mode).toLowerCase() === "fixed") {
                                        this.tooltipPosition(tooltipText,0,pos_line_cursor_y,-14,-15,group_index);
                                    } else if((options.tooltip_mode).toLowerCase() === "moving"){
                                        this.tooltipPosition(tooltipText,pos_line_cursor_x,pos_line_cursor_y,5,-45,group_index);
                                    }
                                    this.toolTextShow(tooltipText);
                                    (options.crosshair_enable) ? this.crossHairShow(pos_line_cursor_x,top,pos_line_cursor_x,(h - bottom),pos_line_cursor_x,pos_line_cursor_y,type,active_y_tick.length,multiple_containers_enable) : null;
                                    this.axisHighlightShow(active_y_tick,options.selector+" .y.axis",domain);
                                    this.axisHighlightShow(active_x_tick,options.selector+" .x.axis",domain);
                                }
                                else if (type === "stackedAreaChart") {
                                    var test = [];
                                    d3.selectAll(options.selector+" #pyk-tooltip").classed({"pyk-line-tooltip":false,"pyk-multiline-tooltip":true,"pyk-tooltip-table":true});
                                    var len_data = new_data[0].data.length,tt_row=""; // Assumption -- number of Data points in different groups will always be equal
                                    active_y_tick = [];
                                    for(var a=0;a < number_of_lines;a++) {
                                        for(var b=0;b < len_data;b++) {
                                            if(options.axis_x_data_format === "time") {
                                                cond = Date.parse(active_x_tick)===Date.parse(new_data[a].data[b].x);
                                            } else {
                                                cond = new_data[a].data[b].x === active_x_tick;
                                            }
                                            if(cond) {
                                                active_y_tick.push(new_data[a].data[b].y);
                                                test.push(yScale(new_data[a].data[b].y+new_data[a].data[b].y0) + top);
                                                if(!PykCharts.boolean(color_from_data)) {
                                                    tt_row += "<tr><td>"+new_data[a].name+"</td><td><b>"+new_data[a].data[b].tooltip+"</b></td></tr>";
                                                    colspan = 2;
                                                }
                                                else if (PykCharts.boolean(color_from_data)) {
                                                    tt_row += "<tr><td><div style='padding:2px;width:5px;height:5px;background-color:"+new_data[a].color+"'></div></td><td>"+new_data[a].name+"</td><td><b>"+new_data[a].data[b].tooltip+"</b></td></tr>";
                                                    colspan = 3;
                                                }
                                            }
                                        }
                                    }

                                    pos_line_cursor_x += 6;
                                    tooltipText = "<table><thead><th colspan='"+colspan+"'>"+active_x_tick+"</th></thead><tbody>"+tt_row+"</tbody></table>";
                                    if(type === "stackedAreaChart") {
                                        group_index = 1;
                                        this.tooltipPosition(tooltipText,pos_line_cursor_x,y,60,70,group_index);
                                    } else {
                                        this.tooltipPosition(tooltipText,pos_line_cursor_x,y,60,-15,group_index);
                                    }
                                    this.toolTextShow(tooltipText);
                                    (options.crosshair_enable) ? this.crossHairShow(pos_line_cursor_x,top,pos_line_cursor_x,(h - bottom),pos_line_cursor_x,test,type,active_y_tick.length,multiple_containers_enable,new_data) : null;
                                    this.axisHighlightShow(active_y_tick,options.selector+" .y.axis",domain);
                                    this.axisHighlightShow(active_x_tick,options.selector+" .x.axis",domain);
                                }
                            }
                        }
                    }
                }
            }
        },
        crossHairShow : function (x1,y1,x2,y2,cx,cy,type,no_bullets,multiple_containers_enable,new_data,group_index) {
            if(PykCharts.boolean(options.crosshair_enable)) {
                if(x1 !== undefined) {
                    if(type === "lineChart" || type === "areaChart") {
                        that.cross_hair_v.style("display","block");
                        that.cross_hair_v.select(options.selector + " #cross-hair-v")
                            .attr("x1",x1)
                            .attr("y1",y1)
                            .attr("x2",x2)
                            .attr("y2",y2);
                        that.cross_hair_h.style("display","block");
                        that.cross_hair_h.select(options.selector + " #cross-hair-h")
                            .attr("x1",options.margin_left)
                            .attr("y1",cy)
                            .attr("x2",(options.width - options.margin_right))
                            .attr("y2",cy);
                        that.focus_circle.style("display","block")
                            .attr("transform", "translate(" + cx + "," + cy + ")");

                    }
                    else if(type === "multilineChart" /*|| type === "stackedAreaChart"*/) {
                        if(multiple_containers_enable === "no") {
                            that.cross_hair_v.style("display","block");
                            that.cross_hair_v.select(options.selector + " #cross-hair-v")
                                .attr("x1",(x1 - 5))
                                .attr("y1",y1)
                                .attr("x2",(x2 - 5))
                                .attr("y2",y2);
                                for(j=0; j<new_data.length; j++) {
                                    d3.select(options.selector+" #f_circle"+j).style("display","block")
                                        .attr("transform", "translate(" + (cx-3) + "," + cy[j] + ")");
                                }
                        }
                        else if(multiple_containers_enable === "yes") {
                            d3.selectAll(options.selector+" .line-cursor").style("display","block");
                            d3.selectAll(options.selector+" .cross-hair-v")
                                .attr("x1",(x1 - 5))
                                .attr("y1",y1)
                                .attr("x2",(x2 - 5))
                                .attr("y2",y2);
                            d3.select(options.selector+" #svg-"+group_index+" .cross-hair-h")
                                .attr("x1",options.margin_left)
                                .attr("y1",cy)
                                .attr("x2",(options.width - options.margin_right))
                                .attr("y2",cy);
                            d3.select(options.selector+" #svg-"+group_index+" .focus").style("display","block")
                                .attr("transform", "translate(" + (cx - 5) + "," + cy + ")");
                        }
                    }
                    else if (type === "stackedAreaChart") {
                        that.cross_hair_v.style("display","block");
                        that.cross_hair_v.select(options.selector + " #cross-hair-v")
                            .attr("x1",(x1 - 5))
                            .attr("y1",y1)
                            .attr("x2",(x2 - 5))
                            .attr("y2",y2);
                        for(j=0; j<new_data.length; j++) {
                            d3.select(options.selector+" #f_circle"+j).style("display","block")
                                .attr("transform", "translate(" + (cx-3) + "," + cy[j] + ")");
                        }
                    }
                }
            }
            return this;
        },
        crossHairHide : function (type) {
            if(PykCharts.boolean(options.crosshair_enable)/* && options.mode === "default"*/) {
                that.cross_hair_v.style("display","none");
                if(type === "lineChart" || type === "areaChart") {
                    that.cross_hair_h.style("display","none");
                    that.focus_circle.style("display","none");
                }
                else if(type === "multilineChart" || type === "stackedAreaChart") {
                    d3.selectAll(options.selector+" .line-cursor").style("display","none");
                    d3.selectAll(options.selector+" .focus").style("display","none");
                }
            }
            return this;
        },
        axisHighlightShow : function (active_tick,axisHighlight,domain,a) {
            var curr_tick,prev_tick,abc,selection,axis_data_length;
            if(PykCharts.boolean(options.axis_onhover_hightlight_enable)/* && options.mode === "default"*/){
                if(axisHighlight === options.selector + " .y.axis"){
                    selection = axisHighlight+" .tick text";
                    abc = options.axis_y_label_color;
                    axis_data_length = d3.selectAll(selection)[0].length;

                    d3.selectAll(selection)
                        .style("fill","#bbb")
                        .style("font-size","12px")
                        .style("font-weight","normal");
                    for(var b=0;b < axis_data_length;b++) {
                        for(var a=0;a < active_tick.length;a++) {
                            if(d3.selectAll(selection)[0][b].innerHTML == active_tick[a]) {
                                d3.select(d3.selectAll(selection)[0][b])
                                    .style("fill",abc)
                                    .style("font-size","13px")
                                    .style("font-weight","bold");
                            }
                        }
                    }
                }
                else {
                    if(axisHighlight === options.selector + " .x.axis") {
                        selection = axisHighlight+" .tick text";
                        abc = options.axis_x_label_color;
                    } else if(axisHighlight === options.selector + " .axis-text" && a === "column") {
                        selection = axisHighlight;
                        abc = options.axis_x_label_color;
                    } else if(axisHighlight === options.selector + " .axis-text" && a === "bar") {
                        selection = axisHighlight;
                        abc = options.axis_y_label_color;
                    }
                    if(prev_tick !== undefined) {
                        d3.select(d3.selectAll(selection)[0][prev_tick])
                            .style("fill",abc)
                            .style("font-weight","normal");
                    }
                    var len = domain.length;
                    for(curr_tick = 0;curr_tick < len;curr_tick++){
                        if(domain[curr_tick] === active_tick) {
                            break;
                        }
                    }
                    prev_tick = curr_tick;

                    d3.selectAll(selection)
                        .style("fill","#bbb")
                        .style("font-size","12px")
                        .style("font-weight","normal");
                    d3.select(d3.selectAll(selection)[0][curr_tick])
                        .style("fill",abc)
                        .style("font-size","13px")
                        .style("font-weight","bold");
                }
            }
            return this;
        },
        axisHighlightHide : function (axisHighlight,a) {
            var abc,selection;
            if(PykCharts.boolean(options.axis_onhover_hightlight_enable)/* && options.mode === "default"*/){
                if(axisHighlight === options.selector + " .y.axis"){
                    selection = axisHighlight+" .tick text";
                    abc = options.axis_y_label_color;
                } else if(axisHighlight === options.selector + " .x.axis") {
                    selection = axisHighlight+" .tick text";
                    abc = options.axis_x_label_color;
                } else if(axisHighlight === options.selector + " .axis-text" && a === "column") {
                    selection = axisHighlight;
                    abc = options.axis_x_label_color;
                } else if(axisHighlight === options.selector + " .axis-text" && a === "bar") {
                    selection = axisHighlight;
                    abc = options.axis_y_label_color;
                }
                d3.selectAll(selection)
                    .style("fill",abc)
                    .style("font-size","12px")
                    .style("font-weight","normal");
            }
            return this;
        }
    };
    return action;
};

configuration.fillChart = function (options,theme,config) {
    var that = this;
    var fillchart = {
        color : function (d) { return d.color; },
        saturation : function (d) { return "steelblue"; },
        selectColor: function (d) {
            if(d.name === options.highlight) {
                return options.highlight_color;
            } else{
                return options.chart_color;
            }
        },
        colorChart : function (d) {
            if(d.name === options.highlight) {
                return theme.stylesheet.highlight_color;
            } else{
                return theme.stylesheet.chart_color;
            }
        },
        colorPieW : function (d) {
             if(!(PykCharts.boolean(options.variable_circle_size_enable))) {
                return options.saturation_color;
            } else if(PykCharts.boolean(options.variable_circle_size_enable)) {
                if(d.color) {
                    return d.color;
                } else if(options.chart_color.length) {
                    return options.color;
                }
                else return options.chart_color[0];
            }
            // if(!(PykCharts.boolean(options.variable_circle_variable_circle_size_enable))) {
            //     return options.saturation_color;
            // } else if(PykCharts.boolean(options.variable_circle_variable_circle_size_enable)) {
            //     if(d.color) {
            //         return d.color;
            //     }
            //     return options.chart_color;
            // }
        },
        colorPieMS : function (d) {
            if(d.name.toLowerCase() === options.highlight.toLowerCase()) {
                return options.highlight_color;
            } else if(options.color_mode === "saturation") {
                return options.saturation_color;
            } else if(options.color_mode === "color" && d.color) {
                return d.color;
            } else if(options.color_mode === "color"){
                return options.chart_color;
            } return options.chart_color[0];
        },
        colorLegends : function (d) {
            if(options.color_mode === "saturation") {
                return options.saturation_color;
            } else if(options.color_mode === "color" && d) {
                return d;
            } else if(options.color_mode === "color"){
                return options.chart_color;
            } else {
                return options.chart_color[0];
            } return options.chart_color;
        }
    }
    return fillchart;
};

configuration.border = function (options) {
	var that = this;
	var border = {
	    width: function () {
	    	return options.border_between_chart_elements_thickness;
	    },
		color: function () {
			return options.border_between_chart_elements_color;
		},
        style: function () {
            return options.border_between_chart_elements_style;
        }
	};
	return border;
};

configuration.makeXAxis = function(options,xScale) {
    var that = this;
    var k = PykCharts.Configuration(options);
    var xaxis = d3.svg.axis()
                    .scale(xScale)
                    .tickSize(options.axis_x_pointer_size)
                    .outerTickSize(options.axis_x_outer_pointer_size)
                    .tickFormat(function (d,i) {
                        if(options.multiple_containers_enable === "yes" && options.axis_x_data_format === "string") {
                            return d.substr(0,2);
                        }
                        else {
                            return d;
                        }
                    })
                    .tickPadding(options.axis_x_pointer_padding)
                    .orient(options.axis_x_pointer_position);

    if(options.axis_x_data_format=== "time" && PykCharts.boolean(options.axis_x_time_value_datatype)) {
        if(options.axis_x_time_value_datatype === "month") {
            a = d3.time.month;
            b = "%b";
        }else if(options.axis_x_time_value_datatype === "date") {
            a = d3.time.day;
            b = "%d";
        } else if(options.axis_x_time_value_datatype === "year") {
            a = d3.time.year;
            b = "%Y";
        } else if(options.axis_x_time_value_datatype === "hours") {
            a = d3.time.hour;
            b = "%H";
        } else if(options.axis_x_time_value_datatype === "minutes") {
            a = d3.time.minute;
            b = "%M";
        }
        xaxis.ticks(a,options.axis_x_time_value_interval)
            .tickFormat(d3.time.format(b))

    } else if(options.axis_x_data_format === "number") {
        xaxis.ticks(options.axis_x_no_of_axis_value);
    }
    return xaxis;
};

configuration.makeYAxis = function(options,yScale) {
    var that = this;
    var k = PykCharts.Configuration(options);
    var yaxis = d3.svg.axis()
                    .scale(yScale)
                    .orient(options.axis_y_pointer_position)
                    .tickSize(options.axis_y_pointer_size)
                    .outerTickSize(options.axis_y_outer_pointer_size)
                    .tickPadding(options.axis_y_pointer_padding)
                    .tickFormat(function (d,i) {
                        return d;
                    });

    if(options.axis_y_data_format=== "time" && PykCharts.boolean(options.axis_y_time_value_type)) {
        if(options.axis_y_time_value_type === "month") {
            a = d3.time.month;
            b = "%b";
        }else if(options.axis_y_time_value_type === "date") {
            a = d3.time.day;
            b = "%d";
        } else if(options.axis_y_time_value_type === "year") {
            a = d3.time.year;
            b = "%Y";
        } else if(options.axis_y_time_value_type === "hours") {
            a = d3.time.hour;
            b = "%H";
        } else if(options.axis_y_time_value_type === "minutes") {
            a = d3.time.minute;
            b = "%M";
        }
        xaxis.ticks(a,options.axis_y_time_value_unit)
            .tickFormat(d3.time.format(b));

    }else if(options.axis_y_data_format === "number"){
        yaxis.ticks(options.axis_y_no_of_axis_value);
    }

                    // .tickFormat(d3.format(",.0f"));
    return yaxis;
};

configuration.makeXGrid = function(options,xScale) {
    var that = this;

    var xgrid = d3.svg.axis()
                    .scale(xScale)
                    .orient("bottom")
                    .ticks(options.axis_x_no_of_axis_value)
                    .tickFormat("")
                    .tickSize(options.height - options.margin_top - options.margin_bottom)
                    .outerTickSize(0);
    return xgrid;
};

configuration.makeYGrid = function(options,yScale) {
    var that = this;
    var ygrid = d3.svg.axis()
                    .scale(yScale)
                    .orient("left")
                    .ticks(options.axis_x_no_of_axis_value)
                    .tickSize(-(options.width - options.margin_left - options.margin_right))
                    .tickFormat("")
                    .outerTickSize(0);
    return ygrid;
};

configuration.transition = function (options) {
    var that = this;
    var transition = {
        duration : function() {
            if(options.mode === "default" && PykCharts.boolean(options.transition_duration)) {
                return options.transition_duration * 1000;
            } else {
                return 0;
            }
        }
    };
    return transition;
};

configuration.Theme = function(){
    var that = this;
    that.stylesheet = {
        "mode": "default",
        "selector": "body",

        "chart_height": 400,
        "chart_width": 600,
        "chart_margin_top": 35,
        "chart_margin_right": 50,
        "chart_margin_bottom": 35,
        "chart_margin_left": 50,

        "title_size": 15,
        "title_color": "#1D1D1D",
        "title_weight": "bold",
        "title_family": "'Helvetica Neue',Helvetica,Arial,sans-serif",

        "subtitle_size": 12,
        "subtitle_color": "black",
        "subtitle_weight": "thin",
        "subtitle_family": "'Helvetica Neue',Helvetica,Arial,sans-serif",

        "highlight": "",
        "highlight_color": "#013F73",
        "background_color": "transparent",
        "chart_color": ["steelblue"],
        "saturation_color": "steelblue",

        "border_between_chart_elements_thickness": 1,
        "border_between_chart_elements_color": "white",
        "border_between_chart_elements_style": "solid",

        "legends_text_size": 13,
        "legends_text_color": "white",
        "legends_text_weight": "thin",
        "legends_text_family": "'Helvetica Neue',Helvetica,Arial,sans-serif",

        "label_size": 13,
        "label_color": "white",
        "label_weight": "thin",
        "label_family": "'Helvetica Neue',Helvetica,Arial,sans-serif",

        "pointer_overflow_enable": "no",
        "pointer_thickness": 1,
        "pointer_weight": "thin",
        "pointer_size": 13,
        "pointer_color": "#1D1D1D",
        "pointer_family": "'Helvetica Neue',Helvetica,Arial,sans-serif",

        "export_enable": "yes",
        "export_image_url":"",

        "loading_gif_url": "https://s3-ap-southeast-1.amazonaws.com/ap-southeast-1.datahub.pykih/distribution/img/loader.gif",
        "fullscreen_enable": "no",
        "tooltip_enable": "yes",
        "credit_my_site_name": "Pykih",
        "credit_my_site_url": "http://www.pykih.com"

    };

    that.functionality = {
        "real_time_charts_refresh_frequency": 0,
        "real_time_charts_last_updated_at_enable": "yes",
        "transition_duration": 0
    };

    that.oneDimensionalCharts = {
        "clubdata_enable": "yes",
        "clubdata_text": "others",
        "clubdata_maximum_nodes": 5,

        "pie_radius_percent": 70,
        "donut_radius_percent": 70,
        "donut_inner_radius_percent": 40,
        "donut_show_total_at_center": "yes",

        "pictograph_show_all_images": "yes",
        "pictograph_total_count_enable": "yes",
        "pictograph_current_count_enable": "yes",
        "pictograph_image_per_line": 3,
        "pictograph_image_width": 79,
        "pictograph_image_height": 66,
        "pictograph_current_count_size": 64,
        "pictograph_current_count_color": "steelblue",
        "pictograph_current_count_weight": "thin",
        "pictograph_current_count_family": "'Helvetica Neue',Helvetica,Arial,sans-serif",
        "pictograph_total_count_size": 64,
        "pictograph_total_count_color": "grey",
        "pictograph_total_count_weight": "thin",
        "pictograph_total_count_family": "'Helvetica Neue',Helvetica,Arial,sans-serif",

        "funnel_rect_width": 100,
        "funnel_rect_height": 100,

        "percent_column_rect_width": 15,
        "percent_row_rect_height": 13,
    };

    that.multiDimensionalCharts = {

        "chart_grid_x_enable": "yes",
        "chart_grid_y_enable": "yes",
        "chart_grid_color":"#ddd",

        "axis_onhover_hightlight_enable": "no",

        "axis_x_enable": "yes",
        "axis_x_title" : "X axis",
        "axis_x_position": "bottom",
        "axis_x_pointer_position": "bottom", //axis orient
        "axis_x_line_color": "#1D1D1D",
        "axis_x_label_color": "#1D1D1D",
        "axis_x_no_of_axis_value": 5,
        "axis_x_pointer_size": 5,
        "axis_x_value_format": "",
        "axis_x_pointer_padding": 6,
        "axis_x_pointer_values": [],
        "axis_x_outer_pointer_size": 0,
        "axis_x_time_value_datatype":"",
        "axis_x_time_value_interval":"",
        "axis_x_data_format": "string",

        "axis_y_enable": "yes",
        "axis_y_title" : "Y axis",
        "axis_y_position": "left",
        "axis_y_pointer_position": "left",
        "axis_y_line_color": "#1D1D1D",
        "axis_y_label_color": "#1D1D1D",
        "axis_y_no_of_axis_value": 5,
        "axis_y_pointer_size": 5,
        "axis_y_value_format": "",
        "axis_y_pointer_padding": 6,
        "axis_y_pointer_values": [],
        "axis_y_outer_pointer_size": 0,
        "axis_y_time_value_datatype":"",
        "axis_y_time_value_interval":"",
        "axis_y_data_format": "number",

        "legends_enable": "yes",
        "legends_display": "horizontal",

        "tooltip_enable" : "yes",
        "tooltip_mode": "fixed",

        "multiple_containers_enable": "no",
        "variable_circle_size_enable" : "yes",

        "crosshair_enable": "yes",
        "zoom_enable": "no",

        "color_mode" : "color",
        // "color": ["yellow"],

        "spiderweb_outer_radius_percent" : 80,
        "spiderweb_radius": 5,
        "spiderweb_axis_title": "yes",
        "spiderweb_pointer": "yes",

        "scatterplot_radius" : 40,
        "scatterplot_pointer": "no",

        "line_curvy_lines": "no",
    };

    that.treeCharts = {
        "zoom_enable" : "no",
        "nodeRadius" : 4.5
    };

    that.mapsTheme = {
        "chart_width": 1000,
        "chart_height": 1000,

        "color_mode": "saturation",
        "total_no_of_colors": 3,
        "palette_color": "Blue",
        "background_color": "white",
        "default_color" : "#4682B4",

        "tooltip_enable" : "yes",
        "tooltip_mode": "moving",
        "tooltip_position_top": 0,
        "tooltip_position_left": 0,

        "timeline_duration": 1000,
        "timeline_margin_top": 5,
        "timeline_margin_right": 25,
        "timeline_margin_bottom": 25,
        "timeline_margin_left": 45,

        "play_image_url":"https://s3-ap-southeast-1.amazonaws.com/ap-southeast-1.datahub.pykih/assets/images/play.gif",
        "pause_image_url":"https://s3-ap-southeast-1.amazonaws.com/ap-southeast-1.datahub.pykih/assets/images/pause.gif",
        "marker_image_url":"https://s3-ap-southeast-1.amazonaws.com/ap-southeast-1.datahub.pykih/assets/images/marker.png",

        "legends_enable": "yes",
        "legends_display": "horizontal",

        "label_enable": "no",
        "click_enable": "yes",

        "onhover": "shadow",

        "highlight_area_enable":"no",
        "highlight": "",
        "highlight_color": "yellow",

        "axis_onhover_hightlight_enable" : "no",
        "axis_x_enable": "yes",
        "axis_x_pointer_position": "top",
        "axis_x_line_color": "#1D1D1D",
        "axis_x_label_color": "#1D1D1D",
        "axis_x_pointer_size": 5,
        "axis_x_value_format": "",
        "axis_x_pointer_padding": 6,
        "axis_x_pointer_values": [],
        "axis_x_outer_pointer_size": 0
    };
    return that;
}
