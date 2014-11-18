var lastWindow = null;

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
        infoWindow: '<div class="PointInfo">{{lat}},{{lon}}</div>'
    };
    $.extend(true,this.options, options);

    if (this.options.color.binding) {
        this.gradientColor = new Rainbow();
        this.gradientColor.setSpectrumByArray(this.options.color.spectrum);
        this.gradientColor.setNumberRange(this.options.color.minSpectrumVal, this.options.color.maxSpectrumVal);
    }
}

CircleHeatMapLayer.prototype = new google.maps.OverlayView;

CircleHeatMapLayer.prototype.updateData = function(new_data) {
    $.extend(true, this.data, new_data);
    var layer = this;
    $.each(new_data, function(key, val) {
        layer.updateCircle(key);
    });
};

CircleHeatMapLayer.prototype.updateCircle = function(x) {
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
                if (lastWindow) {
                    lastWindow.close();
                }
                this.infowindow.open(this.getMap());
                lastWindow = this.infowindow;
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
            console.log('resize:'+size);
        }
    }
}

CircleHeatMapLayer.prototype.onAdd = function() {

    for (var x in this.data) {
        this.updateCircle(x);
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
};


CircleHeatMapLayer.prototype.draw = function() {
    //console.log('draw');
};