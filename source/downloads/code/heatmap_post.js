
function init() {
    var gmap_style_lightgreen= [{"stylers":[{"hue":"#baf4c4"},{"saturation":10}]},{"featureType":"water","stylers":[{"color":"#effefd"}]},{"featureType":"all","elementType":"labels","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"labels","stylers":[{"visibility":"on"}]},{"featureType":"road","elementType":"all","stylers":[{"visibility":"off"}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"}]}];

    var myOptions = {
        zoom: 1,
        center: new google.maps.LatLng(30,0),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: gmap_style_lightgreen
    };

    gmap = new google.maps.Map(document.getElementById('google-heatmap'), myOptions);
    map = new google.maps.Map(document.getElementById('map'), myOptions);

    var c=document.getElementById("spectrumCanvas");
    var ctx=c.getContext("2d");
    ctx.canvas.width  = 150;
    ctx.canvas.height = 40;
    var my_gradient=ctx.createLinearGradient(0,0,100,0);
    my_gradient.addColorStop(0,"black");
    my_gradient.addColorStop(0.75,"yellow");
    my_gradient.addColorStop(1,"red");
    ctx.fillStyle=my_gradient;
    ctx.fillRect(20,25,100,10);
    ctx.fillStyle="#000";
    ctx.font="15px Georgia";
    ctx.fillText("0",20,20);
    ctx.fillText("7",100,20);

    var heatmap_data = {};
    var gmap_data = [];
    $.getJSON('http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp?callback=?')
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
            var gmap_point = {};
            gmap_point.location = new google.maps.LatLng(point.lat, point.lon);
            gmap_point.weight = point.mag;
            gmap_data.push(gmap_point);
        });

        var gmap_layer = new google.maps.visualization.HeatmapLayer({
            data: gmap_data,
            radius: 10,
            maxIntensity: 7
        });

        var heatmap_layer = new CircleHeatMapLayer(heatmap_data, {
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
            infoWindow: '<div style="width:100px;overflow:hidden;height:50px">mag:{{mag}}</br><b>sig</b>:{{sig}}</div>'
        });

        gmap_layer.setMap(gmap);
        heatmap_layer.setMap(map);
    }

}
function loadScript() {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'https://maps.googleapis.com/maps/api/js?libraries=visualization&sensor=true&callback=init';
  document.body.appendChild(script);

}
init();