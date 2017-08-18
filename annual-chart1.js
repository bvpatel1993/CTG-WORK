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
* @summary D3 file that produces basic bar chart from Vital Stats open dataset.
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
  
// All global variables used here are found in the modules/commonModules.js file 

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
      
    // Queries dataset for all years and places them in a array used to build
    // the select list. Also saves the first year in the array as the default
    // selectedYear variable. This variable is used to query the dataset later 
    // and to display the year in the page heading. 
    d3.csv( "https://health.data.ny.gov/resource/aprq-q8wd.csv?$select=year&$group=year&$order=year DESC", function(error, data) {
        if (error) throw error; 

        yearArray = [];
        $.each( data, function(i, item) {
            yearArray.push(item['year']);
            
        })
        
        createSelectList(yearArray, "sbYear");
        
        $('#sbYear').prop('selectedIndex', yearIndex2);
        selectedYear = $('#sbYear').val();

        // Calls initializePage function to draw select lists at top
        // of page. This calls preDraw function which prints heading
        // at top of page and passes select list parameters to 
        // draw function that draw the rest of the page
        initializePage();
    
    }); // Closes out year query process
    
});

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
    selectedYear = $('#sbYear').val();
    d3.selectAll('h2.pageHeading').remove(); 
    d3.selectAll('svg').remove(); 
    d3.selectAll('div#showsvg').remove();
    d3.selectAll('div#showtable').remove();

    // prints page heading and creates tooltip div
    $('<h2 class="pageHeading">(Page 8) Chart 1. Population Distribution by Age Group and Region: New York State '  + selectedYear + '</h2>').insertAfter('.selections');
    $('<div id="tooltip" class="hidden"><p style="text-align: center;"><strong>The exact value is</strong></p><p style="text-align: center;"><span id="value"></span></p></div>').insertAfter('.pageHeading');
    $('<div id="showsvg">').insertAfter('.pageHeading');
    $('<div id="showtable">').insertAfter('div#showsvg');
    
    // calls draw function with parameters for SODA query
    draw(selectedYear);
}

/**
 * @summary Draws the chart on the page
 *
 * Uses d3 to select the data for the chart based on parameters submitted by the
 * user from the select list. 
 *
 * @parameter selectedYear - currently selected Year from select box
 */
function draw(selectedYear) {

    // STEP 1: LOAD AND REFORMAT THE EXTERNAL DATA FOR VISUALIZATIONS
    // Do not close d3.csv function until end of file so data is available 
    // to all functions that follow as needed
    
    d3.csv("https://health.data.ny.gov/resource/aprq-q8wd.csv?$limit=50000&$select=*&$where=year='"+selectedYear+"' and county_name in ('New York City','Rest of State') and race_ethnicity='Total' and gender_description='Total' and age_group_description NOT IN ('Total')&$order=county_name,age_group_description", function(error, data) {

        if (error) throw error;
        
        // rewrite data array so that '<1' age_group description is in first position
        var lessthanone = data.filter(function(d) {return d.age_group_description.indexOf('<') > -1;});
        var morethanone = data.filter(function(d) {return d.age_group_description.indexOf('<') < 0;});
        var newdata = lessthanone.concat(morethanone);
        
        // nest the data by age_group_description for the x axis
        var nestedAge = d3.nest()
            .key(function(d) { return d.age_group_description; }) // remove .sortKeys(d3.ascending)				 
            .entries(newdata);						

        // map all the county names from the query into an array
        var counties = d3.values(data).map(function(name){return name.county_name;});        
        // filter the county names array into one instance for each name
        counties = counties.filter(function(item, pos) {
                            return counties.indexOf(item) == pos;
                        });
        // remove the last county name in the array, which is 'undefined'?
        counties = counties.slice(0,-1);
        
        // Create nested data for table and set up table divs
        var nested_data = d3.nest()
            .key(function(d) {return d['county_name']; })
            .entries(data);
        var maindiv = d3.select("#showtable")
            .append("div")
            .attr("style","width:98%")
            .attr("id","maindiv");   
        var div2 = maindiv.append("div");
            div2.attr("style","width:100%;")
            .attr("id","div2");
    
        // STEP 2 SET THE MARGINS, WIDTH AND HEIGHT OF THE SVG ELEMENT
        // Also set color variable for lines and legends
        
        var margin = {top: 40, right: 50, bottom: 20, left: 60};
        var fullwidth = window.innerWidth; //use the window's width
        var fullheight = window.innerHeight * 0.75; // adjust window's height to fit
        var width = fullwidth - margin.left - margin.right;
        var height = fullheight - margin.top - margin.bottom;
        var color = d3.scaleOrdinal(d3.schemeCategory10); 
    
        // STEP 3: DEFINE YOUR X AND Y SCALES 
        // This scales your input data to the svg output area
             
        // sets x0 scale for the age groupings
        var x0Scale = d3.scaleBand()  // d3v4
            .domain(nestedAge.map(function(name) {return name.key;  })) // input uses age_group_descriptions on x-axis
            .rangeRound([0, width]) // output d3v4
            .padding(0.2); // moves bars away from y axis d3v4
              
        // sets the x1 scale for the state regions with the age groupings
        var x1Scale = d3.scaleBand()  //d3v4
            .domain(counties) // input uses counties on x-axis groups
            .rangeRound([0, x0Scale.bandwidth()]); // output d3v4 

        // sets the y scale for the population values
        var yScale = d3.scaleLinear() //d3v4
            .domain([0,	d3.max(nestedAge, function(d) { return d3.max(d.values,function(d) {return +d.population;}); })]) // input
            .range([height, 0]);  //output
         
        // STEP 4: FORMAT TOOLTIPS THAT APPEAR WHEN HOVERING ON LINE DOTS (OPTIONAL)
        var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset(function(d) {
                return [-10, 0];
		})  
        .html(function(d) {
            var commas = +d.population;	
				return "<center><span style='color:orange'>" + d.county_name + "</span><br><strong>Population:</strong> <span style='color:SpringGreen'>" + commas.toLocaleString() + "</span></center>";
        })
 
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
        var div = d3.select("#showsvg") // connects to main content ID is DOH site
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
          .attr("class", "axis") // comment this line if using grid  
//            .attr("class", "grid") // uncomment this line if using grid
            .call(d3.axisBottom(x0Scale)
//            .tickSize(-height)	 // uncomment this line if using grid
            );
        svg_bar.append("g")
//          .attr("class", "axis") // comment this line if using grid
            .attr("class", "grid") // uncomment this line if using grid            
            .call(d3.axisLeft(yScale)
            .tickSize(-width) // uncomment this line if using grid
            );  
            
        // STEP 7: ADD LEGEND (OPTIONAL)
        var legend = svg_bar.selectAll(".legend")
          .data(counties)
          .enter().append("g")
            .attr("class","legend")
            .attr("transform",function(d,i) { return "translate(-40, " + i * 20 + ")"; });
            
        legend.append("rect")
            .attr("x", width - 18)
            .attr("width", 18)
            .attr("height", 18)
            .style("fill", color);

        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .style("font-family","Arial")
            .style("font-weight","bold")
            .text(function(d) { return d; });
      
        
        // STEP 8: Bind the data to the svg elements to create the visualization
        // TWO Data bindings occur: 1 for the countries and 
        // 1 for the population counts by year within each country
        // NOTE: the first 4 lines in each -- .select, .data, .enter, .append --
        // are the most important ones to bind DATA to DRIVE the DOCUMENT visualization		
        var groupings = svg_bar.selectAll(".groupings")
            .data(nestedAge)
            .enter()
            .append("g")
                .attr("class","groupings")
                .attr("transform", function(d) { return "translate(" + x0Scale(d.key) + ",0)"; });
                
        groupings.selectAll("rect")
                .data(function(d) {return d.values; })
                .enter()		
                .append("rect")	
                .attr("x", function(d) {return x1Scale(d.county_name); }) 
                .attr("y", function(d) {return yScale(+d.population);})					
                .attr("height", function(d) { return height - yScale(+d.population);}) 
                .attr("width",x1Scale.bandwidth()) //d3v4
                .attr("fill", function(d) {	return color(d.county_name); })
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide);
 	
	});	// close out data file load function from above

} //ends draw()


