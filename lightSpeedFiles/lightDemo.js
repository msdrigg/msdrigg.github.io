const c = 299792458;
const colorScale = d3.interpolatePlasma;
const width = 500;
const height = 350;
const mpsToMph = 2.23694;
const limits = {"minX": 0, "maxX": 1, "minY": 0, "maxY": 1};
const margin = {"top": 10, "bottom": 30, "left": 10, "right": 10};

let itemNumber;
let dataContainer;
let canvas, objects, gX;

let x = d3.scaleLog()
	.domain([6E1, c])
	.range([0, width]);
let xAxis = d3.axisBottom(x);
	
let currentScale = 10;
let currentTranslateX = 0;
let currentTranslateY = height/2;
const minScale = 0.005;
const maxScale = 20;
let imageRatios;
let hsize = 80;
let scaleFactor = 12;
let objectNumber;
let alreadyLoaded = false;

let svg = d3.select(".demoWrapper")
			.append("svg")
			.attr("viewBox", "0 0 "+(width+margin.left+margin.right)+" "+(height+margin.top+margin.bottom))
			.attr("width", "100%");
canvas = svg.append("g")
		.attr("id", "canvas")
		.attr("width", width)
		.attr("height", height)
		.attr("transform", "translate("+margin.left+","+margin.top+")");
let tooltip = d3.select(".mainContent").append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

function updateGraph(){
	let newTransform = d3.zoomIdentity.translate(currentTranslateX, height/2).scale(currentScale)
	let new_x = newTransform.rescaleX(x);
	gX.call(xAxis.scale(new_x));
	objects.data(dataContainer)
		.attr("transform", (d)=>{return "translate("+new_x(d.speed)+","+height/2+")";});

}

function motion(){
	let dx = d3.event.wheelDeltaX;
	let dy = d3.event.wheelDeltaY;
	let amount;
	if (Math.abs(dx) > Math.abs(dy)){
		amount = dx;
	}
	else {
		amount = dy;
	}
	currentTranslateX += amount;
	currentTranslateX = Math.max(-490*currentScale, currentTranslateX);
	currentTranslateX = Math.min(40, currentTranslateX);
	d3.event.preventDefault();
	d3.event.stopPropagation();
    updateGraph();
}

function updateRectanglesIfComplete() {
	let proceed = true;
	for (let i = 0; i < dataContainer.length; i++) {
		proceed = proceed && (imageRatios[dataContainer[i].name] != null);
	}
	if (proceed) {
		if (alreadyLoaded) return;
		alreadyLoaded = true;
		
		objects
			.append("rect")
			.attr("height", hsize)
			.attr("width", function(d) {return imageRatios[d.name]* hsize;})
			.attr("stroke", "white")
			.style("stroke-width", 2)
			.attr("y", function(d, i){return -hsize/2 + scaleFactor*i - scaleFactor*objectNumber/2;});
			
		objects
			.append("image")
			.attr("height", hsize)
			.attr("width", function(d) {return imageRatios[d.name]* hsize;})
			.attr("y", function(d, i){return -hsize/2 + scaleFactor*i - scaleFactor*objectNumber/2;})
			.attr("href", (d)=>{return "/static/" + d.image;});
	}
	else {
		console.log("Warning, not everything loaded");
		setTimeout(updateRectanglesIfComplete, 1000);
	}
}

d3.json("static/FastThings.json").then( (data)=> {
	dataContainer = JSON.parse(JSON.stringify(data));
	for (let i = 0; i < dataContainer.length; i ++) {
		dataContainer[i].speed = Math.round(dataContainer[i].speed * mpsToMph* 100)/100.0;
	}
	imageRatios = {};
	for (let i = 0; i<dataContainer.length; i++){
		let img = new Image();
		img.onload = function() {
			imageRatios[dataContainer[i].name] = this.width/this.height;
			updateRectanglesIfComplete()
		}
		img.src =  "static/" + dataContainer[i].image;
	}
	itemNumber = data.length;
	
	objects = canvas.selectAll(".objects")
		.data(data, function(d) { return d.name; })
		.enter()
		.append("g")
		.attr("class", "objects")
		.attr("transform", (d)=>{return "translate("+x(d.speed)+","+height/2+")";})
		.on("mouseover", function (d) {
			let sel = d3.select(this).raise();
			let tooltipText = "<span style=\"font-weight: bold; font-size: 12px\">" + d.name + "</span><br/>"  + "<span style=\"font-style: italic\">" + d.speed  +"</span>" + " mph" + "</br>" + d.description;
			tooltip.transition()		
				.duration(200)		
				.style("opacity", .9);		
			tooltip.html(tooltipText)	
				.style("left", (d3.event.pageX) + "px")		
				.style("top", (d3.event.pageY - 28) + "px");	
			})					
		.on("mouseout", function(d) {
			tooltip.transition()		
				.duration(500)		
				.style("opacity", 0);});
	
	objectNumber = data.length;
	

	
	gX = canvas.append("g")
		.attr("class", "axis axis-x")
		.attr("transform", "translate("+0+"," + height + ")")
		.call(xAxis);
	updateGraph();
	svg.on("wheel.zoom", motion);
});