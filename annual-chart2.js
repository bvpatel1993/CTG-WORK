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
    initializePage();
});

/**
 * @summary Generates the options for the select lists.
 *
 * Generates the select lists based on the query results for Year
 * in the document.ready function.
 *
 * @variable var sel - HTML element with class and ID for the select list 
 *
 * @parameter {object} sBoxElements - the array of query results for  
 *      the select boxes, such as categoryDescriptionArray. 
 * @parameter {object} sbID - the name passed to the query array such as sbYear,
 *      to use as the ID for the HTML select element.
 */

/**
 * @summary Configures select lists when user changes selection in any list.
 *
 * Inserts the select list labels with global variables before the select lists
 *
 * Contains 1 anonymous function for when the payer
 * selections are changed based on a jQuery .change method. The change function
 * updates the selected option variable and calls the preDraw function
 *
 * @global var lblYear - label for Year select box
 */
function initializePage() {
    preDraw();
}

/**
 * @summary Produce heading for top of page and invoke draw function.
 *
 * Retrieves the values for the selected drop-down list options
 * and removes everything below the select list on the page before re-drawing  
 * the page heading with current selected option. Then calls the
 * draw function to draw chart elements based on the currently
 * selected options.
 *
 * @global var selectedYear - currently selected Year from the query
 */
function preDraw() {
    d3.selectAll('h2.pageHeading').remove(); 
    d3.selectAll('svg').remove(); 
    
    // creates tooltip div
    $('<div id="tooltip" class="hidden"><p style="text-align: center;"><strong>The exact value is</strong></p><p style="text-align: center;"><span id="value"></span></p></div>').insertAfter('.pageHeading');
    
    // calls draw function with parameters for SODA query
    draw();
}

/**
 * @summary Draws the chart on the page
 *
 * Uses d3 to select the data for the chart based on parameters submitted by the
 * user from the select list. 
 *
 */
function draw() {

    // STEP 1: LOAD AND REFORMAT THE EXTERNAL DATA FOR VISUALIZATIONS
    // Do not close d3.csv function until end of file so data is available 
    // to all functions that follow as needed
    
    d3.csv("https://health.data.ny.gov/resource/cfgu-7dcm.csv?$limit=50000&$select=*&$where=county_name in ('New York State') and age_group_description = 'Total' &$order=age_group_description,year", function(error, data) {
        
        if (error) throw error;
        
        d3.csv("https://health.data.ny.gov/resource/aprq-q8wd.csv?$limit=50000&$select=*&$where=county_name in ('New York State') and race_ethnicity='Total' and gender_description='Total' and age_group_description = 'Total'&$order=year,age_group_description", function(error, data1) {
            
            if (error) throw error;
            
            // nest the data by year for the x axis
            var nestedAge = d3.nest()
                .key(function(d) { return d.year; })        // no sort so <1 is first                                   
                .entries(data);   

             var nestedAge1 = d3.nest()
                .key(function(d) { return d.year; })        // no sort so <1 is first                                   
                .entries(data1);   // use d not data so <1 is first                                     
            
            // nest the data by county_name for the separate lines
            var nestedCounty = d3.nest()
                .key(function(d) { return d.county_name; }).sortKeys(d3.ascending)
                .entries(data);

            var nestedCounty1 = d3.nest()
                .key(function(d) { return d.county_name; }).sortKeys(d3.ascending)                                             
                .entries(data1);// use newdata not data so <1 is first     
            // nest the data by year for the x axis
             
            // map all the county_name names from the query into an array
            var counties = d3.values(data).map(function(name){return name.county_name;});
            // filter the county_name names array into one instance for each name
            counties = counties.filter(function(item, pos) {
                                return counties.indexOf(item) == pos;
                            });
             // remove the last county_name name in the array, which is 'undefined'?
            counties = counties.slice(0,-1);
            
            
            var counties1 = d3.values(data1).map(function(name){return name.county_name;});
            // filter the county_name names array into one instance for each name
            counties1 = counties1.filter(function(item, pos) {
                                return counties1.indexOf(item) == pos;
                            });
             // remove the last county_name name in the array, which is 'undefined'?
            counties1 = counties1.slice(0,-1);

            // STEP 2 SET THE MARGINS, WIDTH AND HEIGHT OF THE SVG ELEMENT
            // Also set color variable for lines and legends
            var margin = {top: 40, right: 80, bottom: 60, left: 60};
            var fullwidth = window.innerWidth; //use the window's width
            var fullheight = window.innerHeight * 0.8; // adjust window's height to fit
            var width = fullwidth - margin.left - margin.right;
            var height = fullheight - margin.top - margin.bottom;
            var color = d3.scaleOrdinal(d3.schemeCategory10); 
           

            // STEP 3: DEFINE YOUR X AND Y SCALES 
            // This scales your input data to the svg output area
            
            // sets x scale for the years
            var xScale = d3.scalePoint()  // d3v4           
                .domain(nestedAge.map(function(name) {return name.key;}))  // input uses category_description on x-axis
                .range([0, width]) // output d3v4 
                .padding(0.2); 
                
            var x1Scale = d3.scalePoint()  // d3v4           
                .domain(nestedAge1.map(function(name) {return name.key;}))  // input uses category_description on x-axis
                .range([0, width]) // output d3v4 
                .padding(0.2); // moves plot points away from y axis
                 
            // sets the y scale for the death values
            var yScale = d3.scaleLinear() //d3v4
                .domain([d3.min(nestedAge, function(d) { 
                    return d3.min(d.values,function(d) {
                        return +d.deaths - 1000;});}),
                    d3.max(nestedAge, function(d) { 
                    return d3.max(d.values,function(d) {
                        return +d.deaths + 1000;});})
                ]) // input
                .range([height, 0]); //output

            // sets the y scale for the population values
             var y1Scale = d3.scaleLinear() //d3v4
                .domain([d3.min(nestedAge1, function(d) { 
                    return d3.min(d.values,function(d) {
                        return +d.population - 50000;});}),
                    d3.max(nestedAge1, function(d) { 
                    return d3.max(d.values,function(d) {
                        return +d.population + 50000;});})
                ]) // input
                .range([height, 0]); //output
            
            // STEP 4: FORMAT TOOLTIPS THAT APPEAR WHEN HOVERING ON LINE DOTS (OPTIONAL)
            
             var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset(function(d) {
                        return [-10, 0];
                })  
                .html(function(d) {
                    var commas = +d.deaths;	
                        return "<center><span style='color:orange'>" + d.age_group_description + "</span><br><strong>Total number of Deaths:</strong> <span style='color:SpringGreen'>" + commas.toLocaleString() + "</span></center>";
                });
                
             var tip1 = d3.tip()
                .attr('class', 'd3-tip')
                .offset(function(d) {
                        return [-10, 0];
                })  
                .html(function(d) {
                    var commas = +d.population;	
                        return "<center><span style='color:orange'>" + d.age_group_description + "</span><br><strong>Population:</strong> <span style='color:SpringGreen'>" + commas.toLocaleString() + "</span></center>";
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
//                .attr("class", "axis") // comment this line if using grid  
                .attr("class", "grid") // uncomment this line if using grid
                .call(d3.axisBottom(xScale)
                .tickSize(-height)	 // uncomment this line if using grid
                );
            svg_bar.append("g")
//                .attr("class", "axis") // comment this line if using grid
                .attr("class", "grid") // uncomment this line if using grid            
                .call(d3.axisLeft(yScale)
                .tickSize(-width) // uncomment this line if using grid
                );
                   
            svg_bar.append("g")
                        .attr("class", "axis") // comment this line if using grid
//                .attr("class", "grid") // uncomment this line if using grid            
                .call(d3.axisRight(y1Scale)
//                .tickSize(-width) // uncomment this line if using grid
                )
                .attr("transform", "translate( " + width + ", 0 )");  // to move axis to right of svg canvas
             
            svg_bar.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin.left)
            .attr("x",0 - (height / 2))
            .attr("dy", "0.75em")
            .style("text-anchor", "middle")
            .text("Number of Deaths"); 

            svg_bar.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", fullwidth - (margin.right * 0.9) )
            .attr("x",0 - (height / 2))
            .attr("dy", "0.75em")
            .style("text-anchor", "middle")
            .text("Population");            
                        
            svg_bar.append("text")             
            .attr("transform", "translate(" + (width/2) + " ," + (height + margin.top) + ")")
            .style("text-anchor", "middle")
            .text("Years");

            
            // STEP 7: ADD LEGEND (OPTIONAL)					
            var legend = svg_bar.selectAll(".legend")
              .data(counties)
              .enter().append("g")
                .attr("class","legend")
                .attr("transform",function(d,i) { return "translate(-120, " + i * 40 + ")"; });
                                
            legend.append("rect")
                .attr("x", width - 20)
                .attr("width", 20)
                .attr("height", 20)
                .style("fill", "steelblue");
                
            legend.append("rect")
                .attr("x", width - 20)
                .attr("y", 30)
                .attr("width", 20)
                .attr("height", 20)
                .style("fill", "orange");

            legend.append("text")
                .attr("x", width - 24)
                .attr("y", 9)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .style("font-family","Arial")
                .style("font-weight","bold")
                .text("Deaths");
                
            legend.append("text")
                .attr("x", width - 24)
                .attr("y", 39)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .style("font-family","Arial")
                .style("font-weight","bold")
                .text("Population");

            // STEP 8: DEFINE THE LINE USING THE DATA FOR X AND Y POINTS
            
            var line = d3.line()
                .x(function(d) {
                    return xScale(d.year);
                })
                .y(function(d) {
                    return yScale(+d.deaths);
                });
                
                
            var line1 = d3.line()
                .x(function(d) {
                    return xScale(d.year);
                })
                .y(function(d) {
                    return y1Scale(+d.population);
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
                .attr("stroke", "steelblue")
                .attr("stroke-width", 2)
                .attr("fill", "none")
                
                
            svg_bar.append("path")
          .datum(data1)
          .attr("fill", "none")
          .attr("stroke", "orange")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", 2)
          .attr("d", line1);
            
            
            // STEP 10: ENHANCE THE LINES WITH DOTS AT EACH DATA POINT 
            
            var shapes = svg_bar.selectAll(".rectangle")
                .data(data)
                .enter();
           
            shapes.append("rect").filter(function(d){return d.age_group_description == 'Total';})
                .attr("x",function(d){ return xScale(d.year)-6; })
                .attr("y",function(d){ return yScale(+d.deaths)-6; })			
                .attr("width",12)
                .attr("height",12)
                .attr('stroke','steelblue')  
                .attr('fill', 'steelblue') 
                .on('mouseover', tip.show)  // show tooltip on hover
                .on('mouseout', tip.hide)
                .call(tip);  // hide tooltip when hover ends
             
            var shapes2 = svg_bar.selectAll(".circle")
                .data(data1)
                .enter(); 
             
            shapes2.append("circle").filter(function(d){return d.age_group_description == 'Total';})
            /* Keep this commented line below for future documentation as an
             * interesting case of other ways to inject conditions within attributes
             * .attr("r", function(d){ return (d.county_name == 'New York City') ? ("5") : ("8")})
             */
            .attr("r", 5)
            .attr("cx", function(d,i) { return x1Scale(d.year); })
            .attr("cy", function(d) { return y1Scale(+d.population); })
            .attr('stroke', 'orange')
            .attr('fill','orange') 
            .on('mouseover', tip1.show)  // show tooltip on hover
            .on('mouseout', tip1.hide)
            .call(tip1);  // hide tooltip when hover ends;  // hide tooltip when hover ends

        });                     
    });
			// close out data file load function from above

} //ends draw()

