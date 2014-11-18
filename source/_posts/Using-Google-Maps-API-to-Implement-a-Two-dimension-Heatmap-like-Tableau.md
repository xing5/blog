title: Using Google Maps API to Implement a Two-dimension Circle Heatmap like Tableau
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
<!-- more -->

##Demo
It will be clearer if I just show you the demos of *Google Heatmap Layer* and our custom clickable two-dimension heatmap layer. Here they are:
###Google Heatmap Layer

<div style="position:relative; margin:auto;height:400px; width:800px;">
    <div id='google-heatmap' style="height:100%; width:100%;"></div>
    <div style="position:absolute; bottom:0px; left: 0px; color:#000">
        Earthquakes: <span class='num'>null</span><br/>
        Date: <span class='time'>null</span>
    </div>
</div>

###Custom Heatmap Layer

<div style="position:relative; margin:auto;height:400px; width:800px;">
    <div id='map' style="height:100%; width:100%;"></div>
    <div style="position:absolute; bottom:0px; left: 0px; color:#000">
        Earthquakes: <span class='num'>null</span><br/>
        Date: <span class='time'>null</span>
    </div>
    <canvas id='spectrumCanvas' style="position:absolute; bottom:10px; right: 0px; width:150px; height:40px">
    </canvas>
</div>

<script src="https://code.jquery.com/jquery-2.1.1.min.js"></script>
<script src="https://maps.googleapis.com/maps/api/js?libraries=visualization&sensor=true"></script>
<script src="/downloads/code/rainbowvis.js"></script>
<script src="/downloads/code/circleheatmap.js"></script>
<script src="/downloads/code/heatmap_post.js"></script>


