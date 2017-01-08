title: Using Google Maps API to Implement a Two-dimensional Circle Heatmap like Tableau
comments: true
date: 2014-10-13 20:24:00
toc: true
categories:
- Tech
tags:
- Google Maps
- Heatmap
- Circle
- Bubble
- Tableau
- Web
- Javascript
---
Google Maps API V3 has a feature named [Heatmap Layer](https://developers.google.com/maps/documentation/javascript/heatmaplayer) to dipict the intensity of data at geographical points. It can satisfy our needs in most cases. However, if we want clickable data points and two-dimension weight (use radius and color to represent different properties of the point), we are on our own.

This article shows how to implement a heatmap layer in Google Map with these features:
1. Use circles to stand for data points. Either the radius or the color of a circle can represent a property of the data point. 
You can also use both of them to get a two-dimensional heatmap.
2. Data points are clickable, you can customize the pop-up information window.
3. Automatically generate a color spectrum for the heatmap. 

<!-- more -->

## Demo
Please see the demos below. I implement two earthquakes heatmaps using the real-time GeoJSON data from [USGS](http://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php). 
The first one is implemented with Google's built-in Heatmap layer. 
The second one creates a custom heatmap layer with Google Maps API's [Marker](https://developers.google.com/maps/documentation/javascript/markers) and [OverlayView](https://developers.google.com/maps/documentation/javascript/reference#OverlayView). 
The color of each point stands for the magnitude, and the size represents the significance, which is determined on a number of factors, including: magnitude, maximum MMI, felt reports, and estimated impact.

### Google Heatmap Layer

<div style="position:relative; margin:auto;height:400px; width:800px;">
    <div id='google-heatmap' style="height:100%; width:100%;"></div>
    <div style="position:absolute; bottom:0px; left: 0px; color:#000">
        Earthquakes: <span class='num'>null</span><br/>
        Date: <span class='time'>null</span>
    </div>
</div>

### Custom Heatmap Layer

<div style="position:relative; margin:auto;height:400px; width:800px;">
    <div id='map' style="height:100%; width:100%;"></div>
    <div style="position:absolute; bottom:0px; left: 0px; color:#000">
        Earthquakes: <span class='num'>null</span><br/>
        Date: <span class='time'>null</span>
    </div>
</div>

<script src="https://code.jquery.com/jquery-2.1.1.min.js"></script>
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCryD5oP1LSHLcOmoGPjSYZw7T4iNMz3o0&libraries=visualization"></script>
<script src="/downloads/code/rainbowvis.js"></script>
<script src="/downloads/code/circleheatmap.js"></script>
<script src="/downloads/code/heatmap_post.js"></script>

## Implementation

I implement a class named `CircleHeatMapLayer`. It inherits Google Maps API's `OverlayView` so it can be used just like the other built-in layers. 
It's ready-to-use but has three dependencies, which are *JQuery*, *Google Maps API's visualization lib*, and [RainbowVis-JS](https://github.com/anomal/RainbowVis-JS).

### CircleHeatMapLayer Class

The source code of the custom layer is as below.
{% include_code lang:javascript /circleheatmap.js %}

### How to Use

Let's take the demo as an example. First we need to create a Google map:

``` html HTML
<div style="position:relative; margin:auto;height:400px; width:800px;">
    <div id='map' style="height:100%; width:100%;"></div>
    <div style="position:absolute; bottom:0px; left: 0px; color:#000">
        Earthquakes: <span class='num'>null</span><br/>
        Date: <span class='time'>null</span>
    </div>
</div>
```
``` javascript JavaScript
var gmap_style_lightgreen= [{"stylers":[{"hue":"#baf4c4"},{"saturation":10}]},{"featureType":"water","stylers":[{"color":"#effefd"}]},{"featureType":"all","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"labels","stylers":[{"visibility":"on"}]},{"featureType":"road","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]}];

var myOptions = {
    zoom: 1,
    center: new google.maps.LatLng(30,0),
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles: gmap_style_lightgreen
};

map = new google.maps.Map(document.getElementById('map'), myOptions);
```
Now we load the data from USGS and create the layer.
``` javascript Load Earthquake Data
var heatmap_data = {};
// Update @ Feb. 6, 2015. getJSON didn't work because any requests with parameters to the url will get a 403 code.
//$.getJSON('http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp?callback=?') 
$.ajax({
    url:'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp', 
    jsonp: false, 
    jsonpCallback:'eqfeed_callback', 
    cache: true, 
    dataType:'jsonp'
});

eqfeed_callback = function(rst) {
    $('.num').html(rst.metadata.count);
    var generate_time = new Date(rst.metadata.generated);
    $('.time').html(generate_time.toString());
    $.each(rst.features, function(index, data) {
        var point = {};
        point.lat = data.geometry.coordinates[1];
        point.lon = data.geometry.coordinates[0];
        point.mag = data.properties.mag;
        point.sig = data.properties.sig;
        heatmap_data[data.id] = point;
    });
    heatmap_layer = new CircleHeatMapLayer(heatmap_data, {
        color: {
            binding: 'mag',
            spectrum: ['black', 'yellow', 'red'],
            maxSpectrumVal: 7
        },
        radius: {
            binding: 'sig',
            maxRadiusVal: 1000,
            maxRadius: 20
        },
        infoWindow: '<div style="width:60px;overflow:hidden;height:50px">mag: {{mag}}</br><b>sig</b>: {{sig}}</div>'
    });

    heatmap_layer.setMap(map);
}
```

If you need to update some data points, you can use the `updateData` function of `CircleHeatMapLayer`, the corresponding circles will be redrawn. So you don't have to render everything again. 
This is helpful when you get a lot of data points on the map.

