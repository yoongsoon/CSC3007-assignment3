// right and bottom margins
const right_offset = 2.5;
const bottom_offset = 40;
const left_offset = 20;

let width = 1000, height = 600;

// View box for responsiveness
let svg = d3.select("svg")
    .attr("viewBox", "0 0 " + width + " " + height)

var colors = ["#FFFFFF", "#e1f5fe","#b3e5fc","#81d4fa","#4fc3f7",
"#29b6f6","#039be5","#0277bd","#01579b"];

// ticks for x axis
let xTicks  = [];
let starting_value = 0;
const OFFSET = 8000
for (var i = 0; i < colors.length; i++)
{
    xTicks.push(starting_value);
    starting_value += OFFSET;
}

// Load external data
Promise.all([d3.json("sgmap.json"), d3.csv("population2021.csv")]).then(data => {

// console.log(data[0]);
// console.log(data[1]);

// Map and projection
var projection = d3.geoMercator()
    .center([103.851959, 1.290270])  //longtitude and latitude of singapore
    .fitExtent([[20, 20], [980, 580]], data[0]); // Padding of 20 on each size and 980x550 boundary box

let geopath = d3.geoPath().projection(projection);

let parent_group = svg.append("g")
                      .attr("id", "parent_group")

const margin_box_right = 300;
const margin_box_bottom = 120;
const box_width = 190;
const box_height = 70;

// notification box for each subzone
let notice_box = parent_group.append('rect')
.classed('notice-box', true)
.attr('x', width - margin_box_right)
.attr('y', height - margin_box_bottom)
.attr('fill', "#FFFFFF")
.attr('width', box_width)
.attr('height', box_height)
.attr('stroke', "black")
.attr('stroke-width', 1)
.attr('rx', 10)
.attr('ry', 10)
.attr('stroke-linejoin', "round");

// Upper text for notice box
parent_group.append("text")
.attr("id", "notice-box-text")
.attr('font-size', 10)
.attr('font-weight',"bold")
.attr("x",  (width - margin_box_right)  + (box_width / 2) )
.attr("y",  (height - margin_box_bottom) + (box_height / 3))
.style("text-anchor", "middle");

// Bottom text for notice box
parent_group.append("text")
.attr("id", "notice-box-text-bottom")
.attr('font-size', 10)
.attr('font-weight',"bold")
.attr("x",  (width - margin_box_right)  + (box_width / 2) )
.attr("y",  (height - margin_box_bottom) + (box_height/ 1.4 ))
.style("text-anchor", "middle");

parent_group.append("g")
.attr("id", "districts")
.selectAll("path")
.data(data[0].features)
.enter()
.append("path")
.attr("d", geopath)
.attr('fill',function(d,i) { 
        // Get name of subzone
        let subzone = d.properties.Name.toLowerCase();

        // Retrieve corresponding subzone    
        let chosen_object = data[1].filter(obj => obj.Subzone.toLowerCase() === subzone);
  
        if (chosen_object.length != 0)
        {   
            // Retrieve population
            let population_count = chosen_object[0].Population;
     
            // Means no population
            if (population_count == "-" || population_count < 8000)
            {   
              
                return colors[0];
            }
          
            // between the range of > 0 and < 64,000
            for (var j = 1; j < xTicks.length ; ++j)
            {
                if (population_count <  xTicks[j])
                {   
                    return colors[j - 1];
                }
            }
            
            //greater than 64,000
            return colors[colors.length - 1];
            
        }
        // // Cater for the outlier subzone:"lake", "tengah" and "western water catchment"
         return colors[0];
    })
    .on("mouseover", (event, d) => {

        // set notice box to be visible
        notice_box.style("visibility", "visible");
        // Set the text for the notice box
        d3.select("#notice-box-text").text(d.properties.Name);
        
        // Retrieve corresponding subzone    
        let chosen_object = data[1].filter(obj => obj.Subzone.toLowerCase() === d.properties.Name.toLowerCase());
        if (chosen_object.length != 0){
            d3.select("#notice-box-text-bottom").text( "Population count: " + chosen_object[0].Population);
        }
        else{
            d3.select("#notice-box-text-bottom").text( "Population count: " + "-");
        }

        //highlight the border of the subzone
        d3.select(event.currentTarget)
        .attr("stroke", "red")
        .attr("stroke-width", 2);
   
    })
    .on("mouseout", (event, d) => {
        //Set the notice box to be hidden
        notice_box.style("visibility", "hidden");
        //Set the text for the notice box to be empty
        d3.select("#notice-box-text").text("");
        d3.select("#notice-box-text-bottom").text("");

        // remove the border of the subzone
        d3.select(event.currentTarget)
        .attr("stroke", "none");

    });
})



//-------------------Legends-----------------------------//

var bar_height = 10;
var bar_width = 280;

const max_limit = 72000;

// Create the scale for x axis of the legend
var xScale = d3.scaleLinear()
    .range([0, bar_width])  //convert the set of inputs from domain to the specified range
    .domain([0, max_limit]); // Set of inputs

// Create the x axis based on the scale and ticks
var xAxis = d3.axisBottom(xScale)
            .tickSize(bar_height * 2)
            .tickFormat(d3.format("d")) // remove decimal for thousands
            .tickValues(xTicks);

var g = svg.append("g").attr("transform", "translate(" + right_offset + "," +  (height - bottom_offset) + ")")

//Append a defs (for definition) element to your SVG
var defs = svg.append("defs");

//Append a linearGradient element to the defs and give it a unique id
var linearGradient = defs.append("linearGradient")
    .attr("id", "linear-gradient");

//Append multiple color stops by using D3's data/enter step
linearGradient.selectAll("stop")
    .data( colors)
    .enter().append("stop")
    .attr("offset", function(d,i) { return i/(colors.length-1); })
    .attr("stop-color", function(d) { return d; });

g.append("rect")
    .attr("width", bar_width)
    .attr("height", bar_height)
    .style("fill", "url(#linear-gradient)");

g.append("g")
    .call(xAxis)
    .select(".domain").remove();

// Title for legends
svg.append("text")
    .style("fill", "#000000")
    .attr("x", right_offset  )
    .attr("y",  height - bottom_offset - 10)
    .attr("style", "font-family:Verdana")
    .attr("font-size", 10)
    .text("Population");  

//------------------------------------------------//
