function CircleHeatMapLayer(data, options) {
    this.data = data || {};
    this.options = {
        color: {
            binding: false,
            spectrum: ['lime', 'yellow', 'red'],
            minSpectrumVal: 0,
            maxSpectrumVal: 400,
            default: '#dedede'
        },
        radius: {
            binding: false,
            minRadiusVal: 200,
            maxRadiusVal: 400,
            maxRadius: 10,
            default: 1
        },
        opacity: 0.7,
        stroke: {
            weight: 0,
            color: "#bcbcbc"
        },
        infoWindow: '<div class="PointInfo">{{lat}},{{lon}}</div>',
        spectrum: true
    };
    $.extend(true,this.options, options);

    if (this.options.color.binding) {
        this.gradientColor = new Rainbow();
        this.gradientColor.setSpectrumByArray(this.options.color.spectrum);
        this.gradientColor.setNumberRange(this.options.color.minSpectrumVal, this.options.color.maxSpectrumVal);
    }
    this.lastInfoWindow = null;
}

CircleHeatMapLayer.prototype = new google.maps.OverlayView;

CircleHeatMapLayer.prototype.updateData = function(new_data) {
    $.extend(true, this.data, new_data);
    var layer = this;
    $.each(new_data, function(key, val) {
        layer.updateCircle(key);
    });
};

CircleHeatMapLayer.prototype.appendSpectrum = function() {
    var spectrum = document.createElement('canvas');
    spectrum.style.position = 'absolute';
    spectrum.style.bottom = '10px';
    spectrum.style.right = '0px';
    spectrum.style.width= '150px';
    spectrum.style.height= '40px';
    
    var ctx=spectrum.getContext("2d");
    ctx.canvas.width  = 150;
    ctx.canvas.height = 40;
    var g = ctx.createLinearGradient(20,0,120,0);
    var interval = 1.0/(this.options.color.spectrum.length - 1);
    for (var i = 0; i < this.options.color.spectrum.length; i++) {
        g.addColorStop(i * interval, this.options.color.spectrum[i]);
    }
    ctx.fillStyle=g;
    ctx.fillRect(20,25,100,10);
    ctx.fillStyle="#000";
    ctx.font="15px Georgia";
    ctx.fillText(this.options.color.minSpectrumVal,20,20);
    ctx.fillText(this.options.color.maxSpectrumVal,110,20);

    spectrum.id = this.getMap().getDiv().id + '-spectrum';
    this.getMap().getDiv().parentNode.appendChild(spectrum);
    this.spectrum = spectrum;
}

CircleHeatMapLayer.prototype.updateCircle = function(x) {
    var layer = this;
    if (this.data.hasOwnProperty(x) && this.data[x].hasOwnProperty('lat')) {
        var node = this.data[x];
        var size = this.options.radius.default;
        if (this.options.radius.binding) {
            if (node[this.options.radius.binding] > this.options.radius.maxRadiusVal) {
                size = this.options.radius.maxRadius;
            } else if (node[this.options.radius.binding] < this.options.radius.minRadiusVal) {
                size = this.options.radius.maxRadius * (this.options.radius.minRadiusVal/this.options.radius.maxRadiusVal);
            } else {
                size = this.options.radius.maxRadius * (node[this.options.radius.binding]/this.options.radius.maxRadiusVal);
            }
        }
        if (!node.hasOwnProperty('circle')) {
            node.circle = new google.maps.Marker({
                position: new google.maps.LatLng(node.lat, node.lon),
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: this.options.color.binding?("#"+this.gradientColor.colorAt(node[this.options.color.binding])):
                        this.options.color.default,
                    fillOpacity: this.options.opacity,
                    strokeColor: this.options.stroke.color,
                    strokeWeight: this.options.stroke.weight,
                    scale: size
                },
                zIndex: node[this.options.radius.binding]
            });

            node.circle.setMap(this.getMap());
            node._key_ = x;
            node.circle.infowindow = new google.maps.InfoWindow({
                content: this.options.infoWindow.replace(/\{\{(.*?)\}\}/g, function(match, token) {
                    return node[token];
                }),
                position: new google.maps.LatLng(node.lat, node.lon)
            });

            google.maps.event.addListener(node.circle, 'click', function() {
                if (layer.lastInfoWindow) {
                    layer.lastInfoWindow.close();
                }
                this.infowindow.open(this.getMap());
                layer.lastInfoWindow = this.infowindow;
            });
        } else {
            node.circle.setIcon({
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: this.options.color.binding?("#"+this.gradientColor.colorAt(node[this.options.color.binding])):
                    this.options.color.default,
                fillOpacity: this.options.opacity,
                strokeColor: this.options.stroke.color,
                strokeWeight: this.options.stroke.weight,
                scale: size
            });
            node.circle.setZIndex(node[this.options.radius.binding]);
            node.circle.infowindow.setContent(this.options.infoWindow.replace(/\{\{(.*?)\}\}/g, function(match, token) {
                return node[token];
            }));
            node.circle.setVisible(true);
        }
    }
}

CircleHeatMapLayer.prototype.onAdd = function() {

    for (var x in this.data) {
        this.updateCircle(x);
    }

    if (this.options.color.binding && this.options.spectrum) {
        this.appendSpectrum();
    }
};

CircleHeatMapLayer.prototype.onRemove = function() {

    for (var x in this.data) {
        if (this.data.hasOwnProperty(x) && this.data[x].hasOwnProperty('lat')) {
            var node = this.data[x];
            if (node.hasOwnProperty('circle')) {
                node.circle.setVisible(false);
            }
        }
    }

    if (this.options.color.binding && this.options.spectrum) {
        this.spectrum.style.display = 'none';
    }
};


CircleHeatMapLayer.prototype.draw = function() {};