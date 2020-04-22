"use strict";

var c = 299792458;
var colorScale = d3.interpolatePlasma;
var width = 500;
var height = 350;
var mpsToMph = 2.23694;
var limits = {
  "minX": 0,
  "maxX": 1,
  "minY": 0,
  "maxY": 1
};
var margin = {
  "top": 10,
  "bottom": 30,
  "left": 10,
  "right": 10
};
var itemNumber;
var dataContainer;
var canvas, objects, gX;
var x = d3.scaleLog().domain([6E1, c]).range([0, width]);
var xAxis = d3.axisBottom(x);
var currentScale = 10;
var currentTranslateX = 0;
var currentTranslateY = height / 2;
var minScale = 0.005;
var maxScale = 20;
var imageRatios;
var hsize = 80;
var scaleFactor = 12;
var objectNumber;
var alreadyLoaded = false;
var svg = d3.select(".demoWrapper").append("svg").attr("viewBox", "0 0 " + (width + margin.left + margin.right) + " " + (height + margin.top + margin.bottom)).attr("width", "100%");
canvas = svg.append("g").attr("id", "canvas").attr("width", width).attr("height", height).attr("transform", "translate(" + margin.left + "," + margin.top + ")");
var tooltip = d3.select(".mainContent").append("div").attr("class", "tooltip").style("opacity", 0);

function updateGraph() {
  var newTransform = d3.zoomIdentity.translate(currentTranslateX, height / 2).scale(currentScale);
  var new_x = newTransform.rescaleX(x);
  gX.call(xAxis.scale(new_x));
  objects.data(dataContainer).attr("transform", function (d) {
    return "translate(" + new_x(d.speed) + "," + height / 2 + ")";
  });
}

function motion() {
  if (!d3.event.ctrlKey) {
    var dx = d3.event.wheelDeltaX;
    var dy = d3.event.wheelDeltaY;
    var amount;

    if (Math.abs(dx) > Math.abs(dy)) {
      amount = dx;
    } else {
      amount = dy;
    }

    currentTranslateX += amount;
    currentTranslateX = Math.max(-490 * currentScale, currentTranslateX);
    currentTranslateX = Math.min(40, currentTranslateX);
    d3.event.preventDefault();
    d3.event.stopPropagation();
  }

  updateGraph();
}

function updateRectanglesIfComplete() {
  var proceed = true;

  for (var i = 0; i < dataContainer.length; i++) {
    proceed = proceed && imageRatios[dataContainer[i].name] != null;
  }

  if (proceed) {
    if (alreadyLoaded) return;
    alreadyLoaded = true;
    objects.append("rect").attr("height", hsize).attr("width", function (d) {
      return imageRatios[d.name] * hsize;
    }).attr("stroke", "white").style("stroke-width", 2).attr("y", function (d, i) {
      return -hsize / 2 + scaleFactor * i - scaleFactor * objectNumber / 2;
    });
    objects.append("image").attr("height", hsize).attr("width", function (d) {
      return imageRatios[d.name] * hsize;
    }).attr("y", function (d, i) {
      return -hsize / 2 + scaleFactor * i - scaleFactor * objectNumber / 2;
    }).attr("href", function (d) {
      return "/static/" + d.image;
    });
  } else {
    console.log("Warning, not everything loaded");
    setTimeout(updateRectanglesIfComplete, 1000);
  }
}

d3.json("static/FastThings.json").then(function (data) {
  dataContainer = JSON.parse(JSON.stringify(data));

  for (var i = 0; i < dataContainer.length; i++) {
    dataContainer[i].speed = Math.round(dataContainer[i].speed * mpsToMph * 100) / 100.0;
  }

  imageRatios = {};

  var _loop = function _loop(_i) {
    var img = new Image();

    img.onload = function () {
      imageRatios[dataContainer[_i].name] = this.width / this.height;
      updateRectanglesIfComplete();
    };

    img.src = "static/" + dataContainer[_i].image;
  };

  for (var _i = 0; _i < dataContainer.length; _i++) {
    _loop(_i);
  }

  itemNumber = data.length;
  objects = canvas.selectAll(".objects").data(data, function (d) {
    return d.name;
  }).enter().append("g").attr("class", "objects").attr("transform", function (d) {
    return "translate(" + x(d.speed) + "," + height / 2 + ")";
  }).on("mouseover", function (d) {
    var sel = d3.select(this).raise();
    var tooltipText = "<span style=\"font-weight: bold; font-size: 12px\">" + d.name + "</span><br/>" + "<span style=\"font-style: italic\">" + d.speed + "</span>" + " mph" + "</br>" + d.description;
    tooltip.transition().duration(200).style("opacity", .9);
    tooltip.html(tooltipText).style("left", d3.event.pageX + "px").style("top", d3.event.pageY - 28 + "px");
  }).on("mouseout", function (d) {
    tooltip.transition().duration(500).style("opacity", 0);
  });
  objectNumber = data.length;
  gX = canvas.append("g").attr("class", "axis axis-x").attr("transform", "translate(" + 0 + "," + height + ")").call(xAxis);
  updateGraph();
  svg.on("wheel.zoom", motion);
});