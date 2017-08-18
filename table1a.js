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
* @summary D3 file that produces basic table from a Vital Stats open dataset.
*
* This file queries the health.data.ny.gov open data set for Vital Stats 
* data using the Socrata Open Data API (SODA) and returns results in a csv 
* format based on the query parameters entered by the user. The user select 
* list options are also built via SODA queries of the Vital Stats data set.
* A jQuery function shows the values for a selected year, grouped and 
* arranged hierarchically in a table format.
* 
* A jQuery '$(document).ready(function()' initiates the activity once 
* all the HTML DOM elements are ready on the page. This function performs
* the d3.csv data loads and calls other main functions: createSelectList,
* initializePage.
*  createSelectList creates the dropdown select list of options at top of page
*  initializePage calls the preDraw function which prints the page headings
*  preDraw calls the draw function, which produces the tables
* The draw function contains two additional functions:
*  makeTable (produces the table display)
*  makeNotes (creates the footnote notices at the bottom of the page, when used)
* 
* The makeTable function also calls replaceNumberWithCommas function that
* inserts commas every 3 digits in a number to the left of the decimal.
*
* Global variables used by many of the functions are declared at the top of 
* the code before all functions. 
*/
  
// Many global variables used here are found in the modules/commonModules.js file 

// holds sums of values for calculation of "Unknown" column value
var sumup = 0;

/**
 * @summary Runs queries to draw initial page and invokes other functions
 *
 * jQuery function that runs after all DOM elements are ready.
 * Runs query to extract the most recent year from dataset.
 * Runs queries for the 2 select lists (Region and Payer) and
 * sets default 'selected' property for an option in each list so that 
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
 * Retrieves the values for the selected select drop-down list options
 * and removes everything below the select button on the page before re-drawing  
 * the page heading with current selected option. Then calls the
 * draw function to draw table elements based on the currently
 * selected options.
 *
 * @global var selectedYear; //currently selected Year from the query
 */
function preDraw() {
    selectedYear = $('#sbYear').val();
    d3.selectAll('h2.pageHeading').remove();
    d3.selectAll('table').remove(); 
    d3.selectAll('#divNotes').remove();     

    // prints page heading
    $('<h2 class="pageHeading">Table 1a: Female Population Among Child Bearing Ages by County, New York State New York State - '  + selectedYear + '</h2>').insertAfter('.selections');
    
    // calls draw function with parameters for SODA query
    draw(selectedYear);
}

/**
 * @summary Draws the table and footnotes (if used) on the page
 *
 * Uses d3 to select the data for the table basd on parameters submitted by the
 * user from the select list. Declares and calls 2 major functions:
 *  makeTable (which produces the table display),
 *  makeNotes (which creates the footnotes for the page, if used),
 *
 * The makeTable function is called 3 separate times for each of the 
 * separate queries for the county groupings (New York State, New York City,
 * and Rest of State)
 * @parameter selectedYear; //currently selected Year from select box
 */
function draw(selectedYear) {
        
    // Selects all fields for the Year and Plan Names within the Region
    d3.csv("https://health.data.ny.gov/resource/aprq-q8wd.csv?$limit=50000&$select=*&$where=year='"+selectedYear+"' and gender_description='Female' and race_ethnicity='Total' and county_name in ('New York State')&$order=county_name,age_group_description", function(error, data) {
        if (error) throw error;
		
		
        // nests data in 3 levels for table's column and row headings
        // Calculates ratings by summing the Domain Ratings and dividing
        // by the number of Domain Ratings in the nest           
        var nys_nested_data = d3.nest()
            .key(function(d) {return d['county_name']; })
            .entries(data);

        var maindiv = d3.select("#content")
            .append("div")
            .attr("style","width:98%")
            .attr("id","maindiv");
    
        var div2 = maindiv.append("div");
            div2.attr("style","width:100%;")
			.attr("style","height:70%")
            .attr("id","div2")
            .append("h3")
                .text("");

        makeTable($("#div2"),nys_nested_data,0);        

        // Selects all fields for the Year and New York City counties grouping
        d3.csv("https://health.data.ny.gov/resource/aprq-q8wd.csv?$limit=50000&$select=*&$where=year='"+selectedYear+"' and gender_description='Female' and race_ethnicity='Total' and county_name in ('New York City','Bronx','Kings','New York','Queens','Richmond')&$order=county_name,age_group_description", function(error, data) {
            if (error) throw error;

            // nests data in by county for table's column and row headings           
            var nyc_nested_data = d3.nest()
                .key(function(d) {return d['county_name']; })
                .entries(data);
                
            // calls makeTable for the New York City nested data
            makeTable($("#div2"),nyc_nested_data,1);
        
	
            // Selects all fields for the Year and Rest of State counties grouping
            d3.csv("https://health.data.ny.gov/resource/aprq-q8wd.csv?$limit=50000&$select=*&$where=year='"+selectedYear+"' and gender_description='Female' and race_ethnicity='Total' and county_name not in ('New York State','New York City','Bronx','Kings','New York','Queens','Richmond')&$order=county_name,age_group_description", function(error, data) {
                if (error) throw error;

                // nests data in by county for table's column and row headings            
                var nested_data = d3.nest()
                    .key(function(d) {return d['county_name']; })
                    .entries(data);

                // calls makeTable for the Rest of State nested data
                makeTable($("#div2"),nested_data,2);
                
            });
        });        
    });

    /**
    * @summary Creates table of values by county using jQuery .each
    * An explanation of the code that this is based on can be found at:     
    * http://www.htmlgoodies.com/beyond/css/working_w_tables_using_jquery.html
    *
    * Uses nested_data to build table.
    */
	function makeTable(container,data,flip) {

		var table = $("<table/>")
            .attr("style", "width: 100%;");

        var thead = $("<thead/>");
		var tbody = $("<tbody/>");
        var tbody2 = $("<tbody/>");
		
		$.each(data, function(rowIndex, r) {
        var arrayLength = r.values.length - 8;
        var width = parseInt(100 / (arrayLength + 3));

            // build the overall table heading with columns heading
            if (rowIndex == 0) {
                if (flip === 0) {
                    var ro = $("<tr/>");
     
                    ro.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:"+width+"%;")
                        .attr("class","left-align")
                        .attr("rowspan",2)
                        .text("County"));

                    ro.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;")
                    .attr("rowspan",1)
                    .attr("colspan",arrayLength + 2)
                    .html("Age"));

                    thead.append(ro);

                    var ro2 = $("<tr/>");
                    
                    ro2.append($("<th/>")
                            .attr("style","font-size:15px;color:#fff;width:"+width+"%;")
                            .text("15-44"));
                         
                    for (i = 2; i < 6; i++) {
                        ro2.append($("<th/>")
                            .attr("style","font-size:15px;color:#fff;width:"+width+"%;")
                            .text(r.values[i].age_group_description));

                    }

                    ro2.append($("<th/>")
                            .attr("style","font-size:15px;color:#fff;width:"+width+"%;")
                            .text("45+"));
                    
                    
                    thead.append(ro2);
                }
   
                var ro4 = $("<tr/>");

                if (flip === 0) {
                    ro4.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;width:"+width+"%;text-align:left;")
                    .attr("rowspan",1)
                    .attr("colspan",arrayLength+3)
                    .text("New York State"));

                    thead.append(ro4);

                    // builds first table and heading for New York State
                    table.append(thead);	                
                } 
                
                if (flip === 1) {

                    ro4.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;width:"+width+"%;text-align:left;")
                    .attr("rowspan",1)
                    .attr("colspan",arrayLength+3)
                    .text("New York City"));

                    thead.append(ro4);
         
                    // builds second table and heading for New York City
                    table.append(thead);	                
                }  

                if (flip === 2) {

                    ro4.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;width:"+width+"%;text-align:left;")
                    .attr("rowspan",1)
                    .attr("colspan",arrayLength+3)
                    .text("Rest of State"));

                    thead.append(ro4);
   
                    // builds third table and heading for Rest of State
                    table.append(thead);	                
                }     
            } //end if rowIndex = 0
   
            var ro3 = $("<tr/>");
            
            // build top data row for New York City with New York City 
            // as top row appended to  tbody2 variable
            if (flip === 1  && r.key === "New York City") {
                
                ro3.append($("<td/>")
                .attr("style","font-size:12px; -align:left;color:#000;font-weight:bold;width:"+width+"%")
                .text(r.key));
                
                for (i = 2; i < 6; i++) {
                    sumup = parseInt(sumup) + parseInt(r.values[i].population);                        
                }
                    
                ro3.append($("<td/>")
                        .attr("style","color:#000;width:"+width+"%;padding:3px;")
                        .attr("align","right")
                        .append($("<span/>")
                            .text(replaceNumberWithCommas(sumup))
                            .attr("height",14)
                            .attr("width",70)));
                // reset sumup to 0 for next grouping 
                sumup = 0;
                
                for (i = 2; i < 6; i++) {
                        ro3.append($("<td/>")
                        .attr("style","color:#000;width:"+width+"%;padding:3px;")
                        .attr("align","right")
                        .append($("<span/>")
                            .text(replaceNumberWithCommas(r.values[i].population))
                            .attr("height",14)
                            .attr("width",70)));
                }
                
                for (i = 6; i < 8; i++) {
                    sumup = parseInt(sumup) + parseInt(r.values[i].population);                        
                }
                
                ro3.append($("<td/>")
                        .attr("style","color:#000;width:"+width+"%;padding:3px;")
                        .attr("align","right")
                        .append($("<span/>")
                            .text(replaceNumberWithCommas(sumup))
                            .attr("height",14)
                            .attr("width",70)));
                // reset sumup to 0 for next grouping 
                sumup = 0;

        
                // append each data row to table body
                tbody2.append(ro3);	
                
                
                
            } // end build data rows for New York City    
            
            // build top data row for Rest of State with Rest of State 
            // as top row appended to  tbody2 variable
            else if (flip === 2  && r.key === "Rest of State") {
                
                ro3.append($("<td/>")
                .attr("style","font-size:12px; -align:left;color:#000;font-weight:bold;width:"+width+"%")
                .text(r.key));
                
                for (i = 2; i < 6; i++) {
                    sumup = parseInt(sumup) + parseInt(r.values[i].population);                        
                }
                
                ro3.append($("<td/>")
                        .attr("style","color:#000;width:"+width+"%;padding:3px;")
                        .attr("align","right")
                        .append($("<span/>")
                            .text(replaceNumberWithCommas(sumup))
                            .attr("height",14)
                            .attr("width",70)));
                // reset sumup to 0 for next grouping 
                sumup = 0;
                
                
                for (i = 2; i < 6; i++) {
                        ro3.append($("<td/>")
                        .attr("style","color:#000;width:"+width+"%;padding:3px;")
                        .attr("align","right")
                        .append($("<span/>")
                            .text(replaceNumberWithCommas(r.values[i].population))
                            .attr("height",14)
                            .attr("width",70)));
                }
                
                for (i = 6; i < 8; i++) {
                    sumup = parseInt(sumup) + parseInt(r.values[i].population);                        
                }
                
                ro3.append($("<td/>")
                        .attr("style","color:#000;width:"+width+"%;padding:3px;")
                        .attr("align","right")
                        .append($("<span/>")
                            .text(replaceNumberWithCommas(sumup))
                            .attr("height",14)
                            .attr("width",70)));
                // reset sumup to 0 for next grouping 
                sumup = 0;

                // append each data row to table body
                tbody2.append(ro3);	;
                
            } // end build data rows for Rest of State 
            
            // build remaining data rows for all three tables
            else {    
                ro3.append($("<td/>")
                .attr("style","font-size:12px; -align:left;color:#000;font-weight:bold;width:"+width+"%")
                .text(r.key));
                
                for (i = 2; i < 6; i++) {
                    sumup = parseInt(sumup) + parseInt(r.values[i].population);                        
                }
                
                ro3.append($("<td/>")
                        .attr("style","color:#000;width:"+width+"%;padding:3px;")
                        .attr("align","right")
                        .append($("<span/>")
                            .text(replaceNumberWithCommas(sumup))
                            .attr("height",14)
                            .attr("width",70)));
                // reset sumup to 0 for next grouping 
                sumup = 0;
                
                for (i = 2; i < 6; i++) {
                        ro3.append($("<td/>")
                        .attr("style","color:#000;width:"+width+"%;padding:3px;")
                        .attr("align","right")
                        .append($("<span/>")
                            .text(replaceNumberWithCommas(r.values[i].population))
                            .attr("height",14)
                            .attr("width",70)));
                }
                
                for (i = 6; i < 8; i++) {
                    sumup = parseInt(sumup) + parseInt(r.values[i].population);                        
                }
                
                ro3.append($("<td/>")
                        .attr("style","color:#000;width:"+width+"%;padding:3px;")
                        .attr("align","right")
                        .append($("<span/>")
                            .text(replaceNumberWithCommas(sumup))
                            .attr("height",14)
                            .attr("width",70)));
                // reset sumup to 0 for next grouping 
                sumup = 0;
        
                // append each data row to table body	
                tbody.append(ro3);
            
            } // end build data rows for New York State
            
            // append tbody2 to tables first since this has New York City as
            // top row for New York City grouping and Rest of State as top
            // row for Rest of State grouping
            table.append(tbody2);
            
            // append tbody to tables for all other data
            table.append(tbody);
        
        }); // ends .each

        return container.append(table);
    } //ends makeTable


} //ends draw()