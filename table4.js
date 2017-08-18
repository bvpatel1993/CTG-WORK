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

var totalpercent = 0;
var nhpercent = 0;
var nhwopercent = 0;
var nhbopercent = 0;
var nhotpercent = 0;
var hspercent = 0;
var hswopercent = 0;
var hsbopercent = 0;

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
    d3.csv( "https://health.data.ny.gov/resource/hd6r-9672.csv?$select=year&$group=year&$order=year DESC", function(error, data) {
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
    d3.selectAll('#div2').remove(); 

    // prints page heading
    $("<h2 class='pageHeading'> Table 4: Live Birth Summary by Mother's Race/Ethnicity, New York State - "  + selectedYear + "</h2>").insertAfter('.selections');
    
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
    
    // Selects all fields for the Year and All Births county grouping
    d3.csv("https://health.data.ny.gov/resource/hd6r-9672.csv?$limit=50000&$select=*&$where=year='"+selectedYear+"' and measure in ('All Births')&$order=measure,category_1_desc,value", function(error, data) {
        if (error) throw error;

        // nests data in by county for table's column and row headings           
        var all_nested_data = d3.nest()
            .key(function(d) {return d['measure']; })
            .entries(data);
            
        var maindiv = d3.select("#content")
            .append("div")
            .attr("style","width:98%")
            .attr("id","maindiv");
    
        var div2 = maindiv.append("div");
            div2.attr("style","width:100%;")
            .attr("id","div2")
            .append("h3")
                .text("");
        
        // calls makeTable for the New York State nested data
        makeTable($("#div2"),all_nested_data,0);        

        // Selects all fields for the Year and Sex Grouping counties grouping
        d3.csv('https://health.data.ny.gov/resource/hd6r-9672.csv?$limit=50000&$select=*&$where=year="'+selectedYear+'" and measure in ("Infant\'s Sex Male","Infant\'s Sex Female")&$order=measure DESC,category_1_desc,value', function(error, data) {
            if (error) throw error;

            // nests data in by measure for table's column and row headings            
            var sex_nested_data = d3.nest()
                .key(function(d) {return d['measure']; })
                .entries(data);        
            // calls makeTable for the New York City nested data
            makeTable($("#div2"),sex_nested_data,1);
        
        
            // Selects all fields for the Year and Sex Grouping counties grouping
            d3.csv('https://health.data.ny.gov/resource/hd6r-9672.csv?$limit=50000&$select=*&$where=year="'+selectedYear+'" and measure in ("Mother\'s Age 10-14","Mother\'s Age 15-17","Mother\'s Age 18-19","Mother\'s Age 20-24","Mother\'s Age 25-29","Mother\'s Age 30-34","Mother\'s Age 35-39","Mother\'s Age 40-44","Mother\'s Age 45","Mother\'s Age Not Stated")&$order=measure,category_1_desc,value', function(error, data) {
                if (error) throw error;

                // nests data in by measure for table's column and row headings            
                var age_nested_data = d3.nest()
                    .key(function(d) {return d['measure']; })
                    .entries(data);
             
                // calls makeTable for the New York City nested data
                makeTable($("#div2"),age_nested_data,2);
            
        
                // Selects all fields for the Year and Marital Status grouping
                d3.csv("https://health.data.ny.gov/resource/hd6r-9672.csv?$limit=50000&$select=*&$where=year='"+selectedYear+"' and measure in ('Marital Status Out of Wedlock','Marital Status Married','Marital Status Not Stated')&$order=measure DESC,category_1_desc,value", function(error, data) {
                    if (error) throw error;

                    // nests data in by county for table's column and row headings           
                    var nested_data = d3.nest()
                        .key(function(d) {return d['measure']; })
                        .entries(data);
                    // calls makeTable for the Marital Status nested data
                    makeTable($("#div2"),nested_data,3);
                
                
                    // Selects all fields for the Year and Birthweight grouping
                    d3.csv("https://health.data.ny.gov/resource/hd6r-9672.csv?$limit=50000&$select=*&$where=year='"+selectedYear+"' and measure like '%25Birthweight%25' &$order=measure ASC,category_1_desc,value", function(error, data) {
                        if (error) throw error;

                        // nests data in by county for table's column and row headings           
                        var bw_nested_data = d3.nest()
                            .key(function(d) {return d['measure']; })
                            .entries(data);
                        // calls makeTable for the Marital Status nested data
                        makeTable($("#div2"),bw_nested_data,4);
                    
                    
                        // Selects all fields for the Year and Birthweight grouping
                        d3.csv("https://health.data.ny.gov/resource/hd6r-9672.csv?$limit=50000&$select=*&$where=year='"+selectedYear+"' and measure like '%25Plurality%25' &$order=measure,category_1_desc,value", function(error, data) {
                            if (error) throw error;

                            // nests data in by county for table's column and row headings           
                            var plu_nested_data = d3.nest()
                                .key(function(d) {return d['measure']; })
                                .entries(data); 
                            // calls makeTable for the Marital Status nested data
                            makeTable($("#div2"),plu_nested_data,5);
                        
                        
                            // Selects all fields for the Year and Birthweight grouping
                            d3.csv("https://health.data.ny.gov/resource/hd6r-9672.csv?$limit=50000&$select=*&$where=year='"+selectedYear+"' and measure like '%25Prenatal Care Began%25' &$order=measure,category_1_desc,value", function(error, data) {
                                if (error) throw error;

                                // nests data in by county for table's column and row headings           
                                var pnc_nested_data = d3.nest()
                                    .key(function(d) {return d['measure']; })
                                    .entries(data);
                                // calls makeTable for the Marital Status nested data
                                makeTable($("#div2"),pnc_nested_data,6);
                            
                            
                                // Selects all fields for the Year and Birthweight grouping
                                d3.csv("https://health.data.ny.gov/resource/hd6r-9672.csv?$limit=50000&$select=*&$where=year='"+selectedYear+"' and measure like '%25Order of Birth%25' &$order=measure,category_1_desc,value", function(error, data) {
                                    if (error) throw error;

                                    // nests data in by county for table's column and row headings           
                                    var oob_nested_data = d3.nest()
                                        .key(function(d) {return d['measure']; })
                                        .entries(data);
                                    // calls makeTable for the Marital Status nested data
                                    makeTable($("#div2"),oob_nested_data,7);
                                
                                
                                    d3.csv("https://health.data.ny.gov/resource/hd6r-9672.csv?$limit=50000&$select=*&$where=year='"+selectedYear+"' and measure like '%25Method of Delivery%25' &$order=measure,category_1_desc,value", function(error, data) {
                                        if (error) throw error;

                                        // nests data in by county for table's column and row headings           
                                        var mod_nested_data = d3.nest()
                                            .key(function(d) {return d['measure']; })
                                            .entries(data);
                                        // calls makeTable for the Marital Status nested data
                                        makeTable($("#div2"),mod_nested_data,8);
                                    
                                    
                                        d3.csv('https://health.data.ny.gov/resource/hd6r-9672.csv?$limit=50000&$select=*&$where=year="'+selectedYear+'" and measure like "%25Mother\'s Education%25" &$order=measure,category_1_desc,value', function(error, data) {
                                            if (error) throw error;

                                            // nests data in by county for table's column and row headings           
                                            var edu_nested_data = d3.nest()
                                                .key(function(d) {return d['measure']; })
                                                .entries(data);
                                            // calls makeTable for the Marital Status nested data
                                            makeTable($("#div2"),edu_nested_data,9);
                                        
                                        
                                            d3.csv('https://health.data.ny.gov/resource/hd6r-9672.csv?$limit=50000&$select=*&$where=year="'+selectedYear+'" and measure like "%25Place of Birth%25" &$order=measure,category_1_desc,value', function(error, data) {
                                                if (error) throw error;

                                                // nests data in by county for table's column and row headings           
                                                var pob_nested_data = d3.nest()
                                                    .key(function(d) {return d['measure']; })
                                                    .entries(data);
                                                // calls makeTable for the Marital Status nested data
                                                makeTable($("#div2"),pob_nested_data,10);
                                            
                                            
                                                d3.csv('https://health.data.ny.gov/resource/hd6r-9672.csv?$limit=50000&$select=*&$where=year="'+selectedYear+'" and measure like "%25Primary Fin. Coverage%25" &$order=measure,category_1_desc,value', function(error, data) {
                                                    if (error) throw error;

                                                    // nests data in by county for table's column and row headings           
                                                    var pfc_nested_data = d3.nest()
                                                        .key(function(d) {return d['measure']; })
                                                        .entries(data);
                                                    // calls makeTable for the Marital Status nested data
                                                    makeTable($("#div2"),pfc_nested_data,11);
                                                
                                                
                                                    d3.csv('https://health.data.ny.gov/resource/hd6r-9672.csv?$limit=50000&$select=*&$where=year="'+selectedYear+'" and measure like "%25Attendant at Birth%25" &$order=measure,category_1_desc,value', function(error, data) {
                                                        if (error) throw error;

                                                        // nests data in by county for table's column and row headings           
                                                        var att_nested_data = d3.nest()
                                                            .key(function(d) {return d['measure']; })
                                                            .entries(data);
                                                        // calls makeTable for the Marital Status nested data
                                                        makeTable($("#div2"),att_nested_data,12);
                                                    
                                                    
                                                        d3.csv('https://health.data.ny.gov/resource/hd6r-9672.csv?$limit=50000&$select=*&$where=year="'+selectedYear+'" and measure like "%25How is Infant%25" &$order=measure,category_1_desc,value', function(error, data) {
                                                            if (error) throw error;

                                                            // nests data in by county for table's column and row headings           
                                                            var how_nested_data = d3.nest()
                                                                .key(function(d) {return d['measure']; })
                                                                .entries(data);
                                                            // calls makeTable for the Marital Status nested data
                                                            makeTable($("#div2"),how_nested_data,13);
                                                        
                                                        
                                                            d3.csv('https://health.data.ny.gov/resource/hd6r-9672.csv?$limit=50000&$select=*&$where=year="'+selectedYear+'" and measure like "%25Mother\'s Pre-Preg%25" &$order=measure,category_1_desc,value', function(error, data) {
                                                                if (error) throw error;

                                                                // nests data in by county for table's column and row headings           
                                                                var pre_nested_data = d3.nest()
                                                                    .key(function(d) {return d['measure']; })
                                                                    .entries(data);
                                                                // calls makeTable for the Marital Status nested data
                                                                makeTable($("#div2"),pre_nested_data,14);
                                                                makeNotes(selectedYear);
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
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
            .attr("style", "width: 100%;")

        var thead = $("<thead/>");
		var tbody = $("<tbody/>");
        var tbody2 = $("<tbody/>");
		
		$.each(data, function(rowIndex, r) {
        var width = 5.5;
            // build the overall table heading with columns headings
            if (rowIndex == 0) {
                if (flip === 0) {
                    var ro = $("<tr/>");
                    var roo = $("<tr/>");
     
                    ro.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;")
                        .attr("class","left-align")
                        .attr("rowspan",2)
                        .attr("colspan",3)
                        .text(""));
                        
                    ro.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;")
                        .attr("class","left-align")
                        .attr("rowspan",1)
                        .attr("colspan",14)
                        .text(""));
                    
                    roo.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;")
                        .attr("rowspan",1)
                        .attr("colspan",8)
                        .text("Non-Hispanic"));
                    
                    roo.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;")
                        .attr("rowspan",1)
                        .attr("colspan",6)
                        .text("Hispanic"));

                    thead.append(ro);
                    thead.append(roo);

                    var ro2 = $("<tr/>");
                    
                    ro2.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:10%;")
                       .text("Category"));
                    
                    ro2.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:"+width+"%;padding:3px;")
                        .html("Total Number<sup><a href='#1' class='plaintext'>1</a></sup>"));   

                    ro2.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:"+width+"%;padding:3px;")
                        .html("Total Percent"));                         
            
                    ro2.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:"+width+"%;padding:3px;")
                       .text(r.values[7].category_1_desc)); 
                    ro2.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:"+width+"%;padding:3px;")
                       .text("Non-Hispanic Percent"));
                       
                    ro2.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:"+width+"%;padding:3px;")
                        .text(r.values[4].category_1_desc)); 
                    ro2.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:"+width+"%;padding:3px;")
                       .text("White Only Percent"));
         
                    ro2.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:"+width+"%;padding:3px;")
                        .text(r.values[2].category_1_desc));
                    ro2.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:"+width+"%;padding:3px;")
                       .text("Black Only Percent"));                        

                    ro2.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:"+width+"%;padding:3px;")
                        .text(r.values[3].category_1_desc)); 
                    ro2.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:"+width+"%;padding:3px;")
                       .text("Other Percent")); 

                    ro2.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:"+width+"%;padding:3px;")
                       .html(r.values[6].category_1_desc+"<sup><a href='#2' class='plaintext'>2</a></sup>")); 
                    ro2.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:"+width+"%;padding:3px;")
                       .text("Hispanic Percent")); 

                    ro2.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:"+width+"%;padding:3px;")
                        .text(r.values[1].category_1_desc)); 
                    ro2.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:"+width+"%;padding:3px;")
                       .text("White Only Percent")); 
                       
                    ro2.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:"+width+"%;padding:3px;")
                        .text(r.values[0].category_1_desc));
                    ro2.append($("<th/>")
                        .attr("style","font-size:15px;color:#fff;width:"+width+"%;padding:3px;")
                       .text("Black Only Percent"));                         
       
                    totalpercent = r.values[5].value;
                    nhpercent = r.values[7].value;
                    nhwopercent = r.values[4].value;
                    nhbopercent = r.values[2].value;
                    nhotpercent = r.values[3].value;
                    hspercent = r.values[6].value;
                    hswopercent = r.values[1].value;
                    hsbopercent = r.values[0].value;
                 
                    thead.append(ro2);

                } // end if flip = 0
                
                var ro4 = $("<tr/>");

                if (flip === 0) {
                    // builds first table for all births
                    table.append(thead);	                
                }    
                
                else if (flip === 1) {
                    ro4.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;text-align:left;")
                    .attr("rowspan",1)
                    .attr("colspan",r.values.length*2+1)
                    .text("Sex"));
                    thead.append(ro4);
                    // builds second table and heading for Sex
                    table.append(thead);	                
                }  
                else if (flip === 2) {
                    ro4.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;text-align:left;")
                    .attr("rowspan",1)
                    .attr("colspan",r.values.length*2+1)
                    .text("Mother's Age"));
                    thead.append(ro4);  
                    // builds third table and heading for Mother's Age
                    table.append(thead);	                
                } 
                else if (flip === 3) {
                    ro4.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;text-align:left;")
                    .attr("rowspan",1)
                    .attr("colspan",r.values.length*2+1)
                    .text("Marital Status"));
                    thead.append(ro4);
                    // builds third table and heading for Marital Status
                    table.append(thead);	                
                } 
                else if (flip === 4) {
                    ro4.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;text-align:left;")
                    .attr("rowspan",1)
                    .attr("colspan",r.values.length*2+1)
                    .text("Birthweight"));
                    thead.append(ro4);
                    // builds third table and heading for Birthweight
                    table.append(thead);	                
                }   
                else if (flip === 5) {
                    ro4.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;text-align:left;")
                    .attr("rowspan",1)
                    .attr("colspan",r.values.length*2+1)
                    .text("Plurality"));
                    thead.append(ro4);
                    // builds third table and heading for Birthweight
                    table.append(thead);	                
                }  
                else if (flip === 6) {
                    ro4.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;text-align:left;")
                    .attr("rowspan",1)
                    .attr("colspan",r.values.length*2+1)
                    .text("Month PNC Began"));
                    thead.append(ro4);
                    // builds third table and heading for Birthweight
                    table.append(thead);	                
                }   
                else if (flip === 7) {
                    ro4.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;text-align:left;")
                    .attr("rowspan",1)
                    .attr("colspan",r.values.length*2+1)
                    .text("Order of Birth"));
                    thead.append(ro4);
                    // builds third table and heading for Birthweight
                    table.append(thead);	                
                } 
                else if (flip === 8) {
                    ro4.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;text-align:left;")
                    .attr("rowspan",1)
                    .attr("colspan",r.values.length*2+1)
                    .text("Method of Delivery"));
                    thead.append(ro4);
                    // builds third table and heading for Birthweight
                    table.append(thead);	                
                } 
                else if (flip === 9) {
                    ro4.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;text-align:left;")
                    .attr("rowspan",1)
                    .attr("colspan",r.values.length*2+1)
                    .text("Mother's Education"));
                    thead.append(ro4);
                    // builds third table and heading for Birthweight
                    table.append(thead);	                
                } 
                else if (flip === 10) {
                    ro4.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;text-align:left;")
                    .attr("rowspan",1)
                    .attr("colspan",r.values.length*2+1)
                    .text("Place of Birth"));
                    thead.append(ro4);
                    // builds third table and heading for Birthweight
                    table.append(thead);	                
                }
                else if (flip === 11) {
                    ro4.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;text-align:left;")
                    .attr("rowspan",1)
                    .attr("colspan",r.values.length*2+1)
                    .text("Primary Financial Coverage"));
                    thead.append(ro4);
                    // builds third table and heading for Birthweight
                    table.append(thead);	                
                }
                else if (flip === 12) {
                    ro4.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;text-align:left;")
                    .attr("rowspan",1)
                    .attr("colspan",r.values.length*2+1)
                    .text("Attendant at Birth"));
                    thead.append(ro4);
                    // builds third table and heading for Birthweight
                    table.append(thead);	                
                }
                else if (flip === 13) {
                    ro4.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;text-align:left;")
                    .attr("rowspan",1)
                    .attr("colspan",r.values.length*2+1)
                    .html("How is Infant Fed<sup><a href='#3' class='plaintext'>3</a></sup>"));
                    thead.append(ro4);
                    // builds third table and heading for Birthweight
                    table.append(thead);	                
                }
                else if (flip === 14) {
                    ro4.append($("<th/>")
                    .attr("style","font-size:15px;color:#fff;text-align:left;")
                    .attr("rowspan",1)
                    .attr("colspan",r.values.length*2+1)
                    .html("Pre-Pregnancy Body Mass Index"));
                    thead.append(ro4);
                    // builds third table and heading for Birthweight
                    table.append(thead);	                
                }
            } //end if rowIndex = 0
   
            var ro3 = $("<tr/>");
   
                ro3.append($("<td/>")
                .attr("style","font-size:12px; -align:left;color:#000;font-weight:bold;width:10%;")
                .text(r.key));
                
                ro3.append($("<td/>")
                    .attr("style","color:#000;width:"+width+"%;padding:3px;")
                    .attr("align","right")
                    .append($("<span/>")
                        .text(replaceNumberWithCommas(r.values[5].value))
                        .attr("height",14)
                        .attr("width",70)));

               
                ro3.append($("<td/>")
                    .attr("style","color:#000;width:"+width+"%;padding:3px;")
                    .attr("align","right")
                    .append($("<span/>")
                    .text(oneDecimal((r.values[5].value / totalpercent) * 100))
                        .attr("height",14)
                        .attr("width",70)));
                
                ro3.append($("<td/>")
                    .attr("style","color:#000;width:"+width+"%;padding:3px;")
                    .attr("align","right")
                    .append($("<span/>")
                       .text(replaceNumberWithCommas(r.values[7].value))
                        .attr("height",14)
                        .attr("width",70)));
                ro3.append($("<td/>")
                    .attr("style","color:#000;width:"+width+"%;padding:3px;")
                    .attr("align","right")
                    .append($("<span/>")
                       .text(oneDecimal((r.values[7].value / nhpercent) * 100))
                        .attr("height",14)
                        .attr("width",70)));
                
                ro3.append($("<td/>")
                    .attr("style","color:#000;width:"+width+"%;padding:3px;")
                    .attr("align","right")
                    .append($("<span/>")
                       .text(replaceNumberWithCommas(r.values[4].value))
                        .attr("height",14)
                        .attr("width",70)));
                ro3.append($("<td/>")
                    .attr("style","color:#000;width:"+width+"%;padding:3px;")
                    .attr("align","right")
                    .append($("<span/>")
                       .text(oneDecimal((r.values[4].value / nhwopercent) * 100))
                        .attr("height",14)
                        .attr("width",70)));
                        
                ro3.append($("<td/>")
                    .attr("style","color:#000;width:"+width+"%;padding:3px;")
                    .attr("align","right")
                    .append($("<span/>")
                       .text(replaceNumberWithCommas(r.values[2].value))
                        .attr("height",14)
                        .attr("width",70)));
                ro3.append($("<td/>")
                    .attr("style","color:#000;width:"+width+"%;padding:3px;")
                    .attr("align","right")
                    .append($("<span/>")
                       .text(oneDecimal((r.values[2].value / nhbopercent) * 100))
                        .attr("height",14)
                        .attr("width",70)));
                        
                ro3.append($("<td/>")
                    .attr("style","color:#000;width:"+width+"%;padding:3px;")
                    .attr("align","right")
                    .append($("<span/>")
                       .text(replaceNumberWithCommas(r.values[3].value))
                        .attr("height",14)
                        .attr("width",70)));
                ro3.append($("<td/>")
                    .attr("style","color:#000;width:"+width+"%;padding:3px;")
                    .attr("align","right")
                    .append($("<span/>")
                       .text(oneDecimal((r.values[3].value / nhotpercent) * 100))
                        .attr("height",14)
                        .attr("width",70)));
                        
                ro3.append($("<td/>")
                    .attr("style","color:#000;width:"+width+"%;padding:3px;")
                    .attr("align","right")
                    .append($("<span/>")
                       .text(replaceNumberWithCommas(r.values[6].value))
                        .attr("height",14)
                        .attr("width",70)));
                ro3.append($("<td/>")
                    .attr("style","color:#000;width:"+width+"%;padding:3px;")
                    .attr("align","right")
                    .append($("<span/>")
                       .text(oneDecimal((r.values[6].value / hspercent) * 100))
                        .attr("height",14)
                        .attr("width",70)));
                        
                ro3.append($("<td/>")
                    .attr("style","color:#000;width:"+width+"%;padding:3px;")
                    .attr("align","right")
                    .append($("<span/>")
                       .text(replaceNumberWithCommas(r.values[1].value))
                        .attr("height",14)
                        .attr("width",70)));                       
                ro3.append($("<td/>")
                    .attr("style","color:#000;width:"+width+"%;padding:3px;")
                    .attr("align","right")
                    .append($("<span/>")
                       .text(oneDecimal((r.values[1].value / hswopercent) * 100))
                        .attr("height",14)
                        .attr("width",70)));
                        
                ro3.append($("<td/>")
                    .attr("style","color:#000;width:"+width+"%;padding:3px;")
                    .attr("align","right")
                    .append($("<span/>")
                       .text(replaceNumberWithCommas(r.values[0].value))
                        .attr("height",14)
                        .attr("width",70)));
                ro3.append($("<td/>")
                    .attr("style","color:#000;width:"+width+"%;padding:3px;")
                    .attr("align","right")
                    .append($("<span/>")
                       .text(oneDecimal((r.values[0].value / hsbopercent) * 100))
                        .attr("height",14)
                        .attr("width",70)));
                        
                // append each data row to table body
                tbody.append(ro3);
            
            // append tbody2 to tables first since this has New York City as
            // top row for New York City grouping and Rest of State as top
            // row for Rest of State grouping
            table.append(tbody2);
            
            // append tbody to tables for all other data
            table.append(tbody);
   
        }); // ends .each

        return container.append(table);
    } //ends makeTable
    
        /**
     * @summary Creates footnotes on each page for the tables.
     *
     * Builds the DOM HTML elements needed to construct the footnotes
     * along with the explanatory text.
     */
    function makeNotes(year) {   
        var div = d3.select("#div2")
        .append("div")
        .attr("id","divNotes");
                
        div.append("p")
            .html('<a name=1>1</a> Total Births includes births with unknown race.');            
        div.append("p")
            .html("<a name=2>2</a> Hispanic Total includes non-white and non-black births.");
        div.append("p")
            .html("<a name=3>3</a> Infants admitted to the NICU or transferred to another hospital are excluded");
	}

} //ends draw()