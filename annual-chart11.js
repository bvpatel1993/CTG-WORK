/**
 * @license
 * Copyright (c) 2017 Center for Technology in Government
 *
 * The Center grants permission to use and modify this software code 
 * free of charge provided this copyright notice is included. 
 * By using this code you agree to indemnify the Center from any liability 
 * that might arise from its use. Selling the code is expressly forbidden.
 */
 
/**
* @summary D3 file that produces basic line chart from Vital Stats open dataset.
*
* This file queries the health.data.ny.gov open data set for Vital Stats 
* data using the Socrata Open Data API (SODA) and returns results in a csv 
* format based on the query parameters entered by the user. The user select 
* list options are also built via SODA queries of the Vital Stats data set.
* 
* A jQuery '$(document).ready(function()' initiates the activity once 
* all the HTML DOM elements are ready on the page. This function performs
* the d3.csv data loads and calls other main functions: createSelectList,
* initializePage.
*  createSelectList creates the dropdown select list of options at top of page
*  initializePage calls the preDraw function which prints the page headings
*  preDraw calls the draw function, which produces the chart
*
* Global variables used by many of the functions are declared at the top of 
* the code before all functions. 
*/

/**
 * @summary Runs queries to draw initial page and invokes other functions
 *
 * jQuery function that runs after all DOM elements are ready.
 * Runs query to extract the most recent year from dataset and 
 * sets default 'selected' property for an option in the list so that 
 * page does not appear blank initially. Invokes the initializePage function
 * to draw the initial page display.
 */
$(document).ready(function() { 
   draw();
});

/**
 * @summary Draws the chart on the page
 *
 * Uses d3 to select the data for the chart based on parameters submitted by the
 * user from the select list. 
 *
 * @parameter selectedYear - currently selected Year from select box
 */
function draw() {
    
    // STEP 1: LOAD AND REFORMAT THE EXTERNAL DATA FOR VISUALIZATIONS
    // Do not close d3.csv function until end of file so data is available 
    // to all functions that follow as needed
    
    d3.csv("https://health.data.ny.gov/resource/j36q-dvp6.csv?$limit=50000&$select=*&$where=county_name in ('New York State') and place_of_death_description NOT IN ('Total' , 'Not Stated')&$order=year,place_of_death_description", function(error, data) {
        
        if (error) throw error;
		
        // nest the data by year for the x axis
        var nestedAge = d3.nest()
            .key(function(d) { return d.year; }).sortKeys(d3.ascending)				 
            .entries(data);					
         
        // nest the data by county for the separate lines
        var nestedCounty = d3.nest()
            .key(function(d) { return d.place_of_death_description; }).sortKeys(d3.ascending)				 
            .entries(data);					

        // map all the county names from the query into an array
        var counties = d3.values(data)
		
		.map(function(name){return name.place_of_death_description;});
        // filter the county names array into one instance for each name
        counties = counties.filter(function(item, pos) {
                            return counties.indexOf(item) == pos;
                        });
        // remove the last county name in the array, which is 'undefined'?
        counties = counties.slice(0,-1);
        
        // Create nested data for table and set up table divs
        var nested_data = d3.nest()
            .key(function(d) {return d['place_of_death_description']; })
            .entries(data);
        var maindiv = d3.select("#showtable")
            .append("div")
            .attr("style","width:98%")
            .attr("id","maindiv");   
        var div2 = maindiv.append("div");
            div2.attr("style","width:100%;")
            .attr("id","div2");
        // Call makeTable function
        makeTable($("#div2"),nested_data,0);

        // STEP 2 SET THE MARGINS, WIDTH AND HEIGHT OF THE SVG ELEMENT
        // Also set color variable for lines and legends
        
        var margin = {top: 0, right: 50, bottom: 20, left: 60};
        var fullwidth = window.innerWidth; //use the window's width
        var fullheight = window.innerHeight * 0.6; // adjust window's height to fit
        var width = fullwidth - margin.left - margin.right;
        var height = fullheight - margin.top - margin.bottom;
        var color = d3.scaleOrdinal(d3.schemeCategory10); 
		
        // STEP 3: DEFINE YOUR X AND Y SCALES 
        // This scales your input data to the svg output area
        
        // sets x scale for the years
        var xScale = d3.scalePoint()  // d3v4           
            .domain(nestedAge.map(function(name) {return name.key;}))  // input uses category_description on x-axis
            .range([0, width]) // output d3v4 
            .padding(0.2); // moves plot points away from y axis
            
		var decimalFormatter = d3.format(".1");


			 
        // sets the y scale for the live birth values
        var yScale = d3.scaleLinear() //d3v4
            .domain([d3.min(nestedAge, function(d) { 
                return d3.min(d.values,function(d) {
                    return +d.percent*100.0 - 5;});}),
                d3.max(nestedAge, function(d) { 
                return d3.max(d.values,function(d) {
                    return +d.percent*100.0 + 5;});})
            ]) // input
            .range([height, 0]); //output
			 
        // STEP 4: FORMAT TOOLTIPS THAT APPEAR WHEN HOVERING ON LINE DOTS (OPTIONAL)
        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .offset(function(d) {
                    return [-10, 0];
            })  
            .html(function(d) {
                var commas = +d.percent*100;	
                    return "<center><span style='color:orange'>" + d.place_of_death_description + "</span><br><strong>Death Rate:</strong> <span style='color:SpringGreen'>" + commas.toLocaleString() + "</span></center>";
            });

        // STEP 5: DEFINE AND CREATE THE SVG ELEMENT IN WHICH TO CONTAIN THE VISUALIZATIONS 
        // along with the specifications (scales, axes) for the visualization
        // 	NOTE: the attributes are defined in the svg specification which you can find
        //	at http://www.w3.org/TR/SVG/ and http://www.w3schools.com/svg/default.asp	
        // Creates the svg container for the bar chart and calls the tip. 
        // Uses an IE Hack to get the svg to scale @RESPONSIVE by creating 
        // a div of position relative and width 100% to contain an empty canvas
        // with a specified width and height that will match the svg container.
        // The svg is then appended to the div with a viewbox containing
        // width and height attributes identical to the canvas. The svg also has
        // a preserveAspectRatio of xMidYMid. For this IE Hack to work, the css
        // must also contain the following for the canvas and svg: 
        // canvas {display: block; width: 100%; visibility: hidden;}
        // #svg_bar {position: absolute; top: 0; left: 0; width: 100%;}
        // If IE handled svg scaling properly, the containing div, canvas, and css
        // would not be necessary. The viewbox and preserveAspectRatio work as is
        // for other browsers.  
 
        var div = d3.select("#showsvg") // connects to main content ID on DOH site
            .append("div")
                .attr("id","div_svg")
                .attr("style","position:relative;width:100%;background:white;")
                .append("canvas")
                    .attr("width", + fullwidth)
                    .attr("height", + fullheight)
                    .text(" "); 
        var svg_bar = d3.select("#div_svg").append("svg")
            .attr("id","svg_bar")
            .attr("viewBox","0 0 " + fullwidth + "  " + fullheight)
            .attr("preserveAspectRatio","xMidYMid meet")
            .attr("class","svg_bar")
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
              .call(tip);
               
        // STEP 6: DRAW THE AXES AND GRID (OPTIONAL)	
        // The comment/uncomment lines below allow for use of a grid background
        // in chart, if desired. See the line1.html for the css for "axis" and 
        // "grid" which styles the non-grid and grid approaches.

        svg_bar.append("g")			
            .attr("transform", "translate(0," + height + ")")
//          .attr("class", "axis") // comment this line if using grid  
            .attr("class", "grid") // uncomment this line if using grid
            .call(d3.axisBottom(xScale)
            .tickSize(-height)	 // uncomment this line if using grid
            );
        svg_bar.append("g")
//          .attr("class", "axis") // comment this line if using grid
            .attr("class", "grid") // uncomment this line if using grid            
            .call(d3.axisLeft(yScale)
            .tickSize(-width+10) // uncomment this line if using grid
            );
                                        
        // STEP 7: ADD LEGEND (OPTIONAL)					
        var legend = svg_bar.selectAll(".legend")
          .data(counties)
          .enter().append("g")
            .attr("class","legend")
 //           .attr("transform",function(d,i) { return "translate(-"+ (width - 200)+", " + i * 30 + ")"; });
            .attr("transform",function(d,i) { return "translate(-40, " + i * 30 + ")"; });
            
        legend.append("rect")
            .attr("x", width - 20)
			.attr("y", 75)
            .attr("width", 20)
            .attr("height", 20)
            .style("fill", color);

        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 85)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .style("font-family","Arial")
            .style("font-weight","bold")
            .text(function(d) { return d; });
                         
        // STEP 8: DEFINE THE LINE USING THE DATA FOR X AND Y POINTS
        
        var line = d3.line()
            .x(function(d) {
                return xScale(d.year);
            })
            .y(function(d) {
                return yScale(d.percent*100);
            });

        // STEP 9: BIND THE DATA TO THE PATH AND DRAW THE LINES
        
        svg_bar.selectAll(".line")
        .data(nestedCounty)
        .enter()
        .append("path")
            .attr("class","line")
            .attr("d", function(d) {
                return line(d.values);
            })
            .attr("stroke", function(d){return color(d.key)})
            .attr("stroke-width", 2)
            .attr("fill", "none"); // keeps space inside lines blank 
            
        svg_bar.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (height / 2))
            .attr("dy", "0.75em")
            .style("text-anchor", "middle")
            .text("Percent");

        // STEP 10: ENHANCE THE LINES WITH DOTS AT EACH DATA POINT 
        	
		var shapes = svg_bar.selectAll(".circle")
            .data(data)
            .enter();
 /*        
        shapes.append("rect")
            .attr("x",function(d){ return xScale(d.year)-3; })
            .attr("y",function(d){ return yScale(d.percent*100)-3; })
            .attr("width",6)
            .attr("height",6)
            .attr('fill', function(d) { return color(d.place_of_death_description); }) 
            .on('mouseover', tip.show)  // show tooltip on hover
            .on('mouseout', tip.hide);  // hide tooltip when hover ends
*/
        shapes.append("rect").filter(function(d){return d.place_of_death_description == 'Home/Pub Place' || d.place_of_death_description == 'Hospice';})
            .attr("x",function(d){ return xScale(d.year)-6; })
            .attr("y",function(d){ return yScale(d.percent*100)-6; })
            .attr("width",12)
            .attr("height",12)
            .attr('fill', function(d) { return color(d.place_of_death_description); }) 
            .on('mouseover', tip.show)  // show tooltip on hover
            .on('mouseout', tip.hide);  // hide tooltip when hover ends
            
        shapes.append("circle").filter(function(d){return d.place_of_death_description == 'Hospital' || d.place_of_death_description == 'Nursing Home' ;})
            .attr("r", 5)
            .attr("cx", function(d,i) { return xScale(d.year); })
            .attr("cy", function(d) { return yScale(d.percent*100); })
            .attr('stroke', function(d) { return color(d.place_of_death_description); })
            .attr('fill', function(d) {	return color(d.place_of_death_description); }) 
            .on('mouseover', tip.show)  // show tooltip on hover
            .on('mouseout', tip.hide);  // hide tooltip when hover ends

        shapes.append("ellipse").filter(function(d){return d.place_of_death_description == 'Other Institution';})
            .attr("rx", 6)
            .attr("ry", 3)
            .attr("cx", function(d,i) { return xScale(d.year); })
            .attr("cy", function(d) { return yScale(d.percent*100); })
            .attr('stroke', function(d) { return color(d.place_of_death_description); })
            .attr('fill', function(d) {	return color(d.place_of_death_description); }) 
            .on('mouseover', tip.show)  // show tooltip on hover
            .on('mouseout', tip.hide);  // hide tooltip when hover ends
            
        shapes.append("circle").filter(function(d){return d.place_of_death_description != 'Home/Pub Place'  && d.place_of_death_description != 'Hospice'  && d.place_of_death_description != 'Hospital' && d.place_of_death_description != 'Nursing Home' && d.place_of_death_description != 'Other Institution';})
            .attr("r", 5)
            .attr("cx", function(d,i) { return xScale(d.year); })
            .attr("cy", function(d) { return yScale(d.percent*100); })
            .attr('stroke', function(d) { return color(d.place_of_death_description); })
            .attr('fill', function(d) {	return color(d.place_of_death_description); }) 
            .on('mouseover', tip.show)  // show tooltip on hover
            .on('mouseout', tip.hide);  // hide tooltip when hover ends
   /**
    * @summary Creates table of values by county using jQuery .each
    * An explanation of the code that this is based on can be found at:     
    * http://www.htmlgoodies.com/beyond/css/working_w_tables_using_jquery.html
    *
    * Uses nested_data to build table.
    */
	function makeTable(container,data,flip) {

		var table = $('<table class="fullwidth"/>');
        var thead = $("<thead/>");
		var tbody = $("<tbody/>");
		
		$.each(data, function(rowIndex, r) {
        var width = parseInt(80 / (r.values.length+1));
            // build the overall table heading with columns heading
            if (rowIndex == 0) {

                    var ro = $("<tr/>");
     
                    ro.append($("<th/>")
                        .attr("style","font-size:1.2em;text-align:center;color:#fff;width:10%")
                        .attr("class","left-align")
                        .text("Place of Death"));
                        
                    for (i = 0; i < r.values.length; i++) {
                        ro.append($("<td/>")
                        .attr("style","color:#fff;width:"+width+"%;padding:3px;")
                        .attr("align","right")
                        .append($("<span/>")
                            .text(r.values[i].year)
                            .attr("height",14)
                            .attr("width",70)));
                    }
                thead.append(ro);
                table.append(thead);


             } //end if rowIndex = 0
           
            // build remaining data rows for all three tables
            var ro3 = $("<tr/>");
            
                ro3.append($("<td/>")
                .attr("style","font-size:12px; -align:left;color:#000;font-weight:bold;width:"+width+"%")
                .text(r.key));
               
                
                for (i = 0; i < r.values.length; i++) {
                        ro3.append($("<td/>")
                        .attr("style","color:#000;width:"+width+"%;padding:3px;")
                        .attr("align","right")
                        .append($("<span/>")
                            .text(oneDecimal(r.values[i].percent*100))
                            .attr("height",14)
                            .attr("width",70)));
                }
        
                // append each data row to table body	
                tbody.append(ro3);
                
            
            // append tbody to tables for all other data
            table.append(tbody);
       
        }); // ends .each loop through all data

        return container.append(table);
    } //ends makeTable			        
                             
    });	// close out data file load function from above

} //ends draw()

