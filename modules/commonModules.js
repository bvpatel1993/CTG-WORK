/**
 * @summary Global variables used in many of the visualization js files.
 *
 */
 // selected options from select lists for Year
var selectedYear; 

// labels for select list for Year
var lblYear = $('<label for="sbYear">Select Year: </label>');

// initializes indexes for select list to 0
var yearIndex = 0;

// sets default index for each select list on initial page load
var yearIndex2 = 0

// sets parameters for grouping the arrangement of table rows
var flip = 0;

/**
 * @summary Generates the options for the select lists.
 *
 * Generates the select lists based on the query results for Year
 * in the document.ready function.
 *
 * @variable var sel - HTML element with class and ID for the select list 
 *
 * @parameter {object} sBoxElements - the array of query results for  
 *      the select boxes, such as yearArray. 
 * @parameter {object} sbID - the name passed to the query array such as sbYear,
 *      to use as the ID for the HTML select element.
 */
function createSelectList (sBoxElements, sbID) {
    // Create the selection element.
    var sel = $('<select class="sBoxes" id="'+sbID+'"></select>');
    // loops through the array of options.
if (sbID === 'sbSort' || sbID === 'sbCounty' || sbID === 'sbRegion'|| sbID === 'sbPopulation') {
        for (index = 0; index < sBoxElements.length; index += 2) {
            // Append the option to the selection box.
            sel.append('<option value='+sBoxElements[index]+'>'+sBoxElements[index+1]+'</option>');
        }
    }
    else {
        for (index = 0; index < sBoxElements.length; index ++) {
            // Append the option to the selection box.
            sel.append('<option value='+sBoxElements[index]+'>'+sBoxElements[index]+'</option>');
        }        
    }
    // Append the selection box to the correct position below the page heading.
   if (sbID === 'sbCounty' ) {
       $(sel).insertAfter('legend');  
   }
   else if (sbID === 'sbRegion' ) {
       $(sel).insertBefore('button.draw'); 
   }
   else {
       $(sel).insertBefore('#selectLists');
   }
}

/**
 * @summary Configures select lists when user changes selection in any list.
 *
 * Inserts the select list labels with global variables before the select lists
 *
 * Contains 1 anonymous function for when the payer
 * selections are changed based on a jQuery .change method. The change function
 * updates the selected option variable and calls the preDraw function
 *
 * @global var lblYear; //label for Year select box
 */
function initializePage() {
    // Builds top of page with select lists and labels
    $(lblYear).insertBefore('#sbYear');

    // Calls preDraw function to print the page heading
    preDraw();
    
    // Re-queries to rebuild select list based on change in Year selection.
    $('#sbYear').change(function() {
        preDraw();      
	}); // Closes out year change function
}

/**
 * @summary Formats numbers to insert comma every 3 digits to left of decimal
 * Found on stackoverflow at:     
 * http://stackoverflow.com/questions/14075014/jquery-function-to-to-format-number-with-commas-and-decimal
 */
function replaceNumberWithCommas(yourNumber) {
    //Seperates the components of the number
    var n = yourNumber.toString().split(".");
    //Comma-fies the first part
    n[0] = n[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    //Combines the two sections
    return n.join(".");
}

/**
 * @summary Formats numbers to insert comma every 3 digits to left of decimal
 * Found on stackoverflow at:     
 * http://stackoverflow.com/questions/14075014/jquery-function-to-to-format-number-with-commas-and-decimal
 */
function oneDecimal(yourNumber) {
    var n = (Math.round( yourNumber * 10 ) / 10).toFixed(1);
    return n;
}

/**
 * @summary Converts a string of Text into Initial Caps and lower case
 */
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}