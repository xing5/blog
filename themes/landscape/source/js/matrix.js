bDesc = false;

(function() {

    var width, height, largeHeader, canvas, ctx, points, target, pc, pctx, scrollText, bScrolling, animateHeader = true;

    // Main
    initHeader();
    initAnimation();
    addListeners();

    function initHeader() {
        width = window.innerWidth;
        height = window.innerHeight;
        target = {x: width/2, y: height/2};

        largeHeader = document.getElementById('large-header');
        largeHeader.style.height = height+'px';

        canvas = document.getElementById('demo-canvas');
        canvas.width = width;
        canvas.height = height;
        ctx = canvas.getContext('2d');

        charSize = 15;
        pointInterval = 2;
        animateRange = 150;
        animateCircleOne = animateRange*animateRange/9;
        animateCircleTwo = 4*animateRange*animateRange/9;
        animateCircleThree = animateRange*animateRange;



        pc = document.createElement('canvas');
        pc.width = 2 * charSize;
        pc.height = 2 * charSize;
        pctx = pc.getContext('2d');
        pctx.fillStyle = 'rgba(0,0,0,'+ 0.2+')';
        pctx.font= (charSize - 3) +"pt Consolas";
        pctx.fillText('0', 0, charSize);
        pctx.fillText('1', charSize, charSize);
        pctx.fillText('1', 0, 2 * charSize);
        pctx.fillText('0', charSize, 2 * charSize);

        resetHeader();        

        // create points
        points = [];
        for(var x = 0; x < width; x = x + pointInterval*charSize) {
            for(var y = 0; y < height; y = y + pointInterval*charSize) {
                var px = x + Math.floor(Math.random()*pointInterval) * charSize;
                var py = y + Math.floor(Math.random()*pointInterval) * charSize;
                var p = {x: px, originX: px, y: py, originY: py};
                // assign a code to each point
                var c = new Code(p, Math.random()>0.5?'1':'0', '18,91,30');
                p.code = c;
                points.push(p);
            }
        }

        scrollText = generateText('PRESS I FOR MORE INFORMATION');
        bScrolling = false;
    }

    function generateText(text) {
        var chars = text.split('');
        var codes = [];
        for (var i = chars.length; i > 0; i--) {
            codes.push(new Code({
                x: width*0.7 + i*charSize,
                originX: width*0.7 + i*charSize,
                y: height*0.2,
                originY: height*0.2
            }, chars[i-1],'160,160,160'));
        }
        return codes;
    }

    function resetHeader() {
        ctx.clearRect(0, 0,width,height);
        var pattern = ctx.createPattern(pc, 'repeat');
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
        ctx.fill();
    }

    // Event handling
    function addListeners() {
        if(!('ontouchstart' in window)) {
            window.addEventListener('mousemove', mouseMove);
        }
        window.addEventListener('scroll', scrollCheck);
        window.addEventListener('resize', resize);
        document.getElementById('title').addEventListener('mouseover', function() {
            bScrolling = true;
        });
        document.getElementById('title').addEventListener('mouseout', function() {
            bScrolling = false;
        });
        document.addEventListener( 'keydown', function(ev) {
            var keyCode = ev.keyCode || ev.which;
            if( keyCode === 73 || keyCode == 27 ) {
                toggleDesc(ev);
            }
        });
    }

    function toggleDesc(ev) {
        if (bDesc) {
            //remove desc
            animateHeader = true;
            document.getElementById('desc-links').className ='links';
            document.getElementById('title').className = 'main-title';
            document.getElementById('json-desc').className = 'title-desc';
            document.getElementById('demo-canvas').className = '';
            setTimeout(function() {
                document.getElementById('scroll-btn').style.visibility = 'hidden';
                document.getElementById('json-desc').style.visibility = 'hidden';
                document.getElementById('desc-links').style.visibility = 'hidden';
            }, 500);
            bDesc = false;

            for(var i in points) {
                shiftVal(points[i]);
            }
        } else {
            //activate desc
            animateHeader = false;
            document.getElementById('json-desc').style.visibility = 'visible';
            document.getElementById('desc-links').style.visibility = 'visible';
            document.getElementById('desc-links').className ='links desc-active';
            document.getElementById('title').className = 'main-title desc-active';
            document.getElementById('json-desc').className = 'title-desc desc-active';
            document.getElementById('demo-canvas').className = 'blur';
            setTimeout(function() {
                document.getElementById('scroll-btn').style.visibility = 'visible';
            }, 300);
            bDesc = true;
        }
    }

    function mouseMove(e) {
        var posx = posy = 0;
        if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        }
        else if (e.clientX || e.clientY)    {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }
        target.x = posx;
        target.y = posy;
    }

    function scrollCheck() {
        if(bDesc) return;
        if(document.body.scrollTop > height) animateHeader = false;
        else animateHeader = true;
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        largeHeader.style.height = height+'px';
        canvas.width = width;
        canvas.height = height;
    }

    // animation
    function initAnimation() {
        animate();
        for(var i in points) {
            shiftPoint(points[i]);
            shiftVal(points[i]);
        }
        for(var i in scrollText) {
            moveLeft(scrollText[i]);
        }
    }

    function animate() {
        if(animateHeader) {
            resetHeader();
            for(var i in points) {
                // detect points in range

                // filter those not even in the square
                if (Math.abs(points[i].x - target.x) > animateRange || Math.abs(points[i].y - target.y) > animateRange ) {
                    points[i].active = 0;
                    points[i].code.active = 0;
                    continue;
                }

                // calc distance inside the square
                var dis = getDistance(target, points[i]);

                if(dis < animateCircleOne) {
                    points[i].active = 0.3;
                    points[i].code.active = 0.8;
                } else if (dis < animateCircleTwo) {
                    points[i].active = 0.1;
                    points[i].code.active = 0.5;
                } else if (dis < animateCircleThree) {
                    points[i].active = 0.02;
                    points[i].code.active = 0.3;
                } else {
                    points[i].active = 0;
                    points[i].code.active = 0;
                    continue;
                }

                points[i].code.draw();
            }
            if(bScrolling) {
                for(var i in scrollText) {
                    scrollText[i].draw();
                }
            }
        }
        requestAnimationFrame(animate);
    }

    function moveLeft(p) {
        TweenLite.to(p.pos, 10, {
            x: p.pos.originX - width*0.6,
            ease: Linear.easeNone,
            onComplete: function() {
                p.pos.x = p.pos.originX;
                moveLeft(p);
            }
        });
    }

    function shiftPoint(p) {
        TweenLite.to(p, 1+1*Math.random(), {
            x: p.originX + charSize* Math.round(5*(Math.random()*2 - 1)),
            y: p.originY + charSize* Math.round(5*(Math.random()*2 - 1)),

            onComplete: function() {
                shiftPoint(p);
            }
        });
    }

    function shiftVal(p) {
        if (!animateHeader) return;
        p.code.val = Math.random()>0.5?'1':'0';
        // TweenLite.delayedCall(0.2, shiftVal, [p]);
        setTimeout(function() {shiftVal(p);}, 210);
    }


    function Code(pos,val,color,active) {
        var _this = this;

        // constructor
        (function() {
            _this.pos = pos || null;
            _this.val = val || null;
            _this.color = color || null;
            _this.active = active || 1.0;
        })();

        this.draw = function() {
            if(!_this.active) return;
            roundx = Math.round(_this.pos.x/charSize)*charSize;
            roundy = Math.round(_this.pos.y/charSize)*charSize
            ctx.clearRect(roundx, roundy, charSize, charSize);
            ctx.fillStyle = 'rgba(' + _this.color + ','+ _this.active+')';
            ctx.font= 'bold ' + (charSize - 3) +"pt Consolas";
            ctx.fillText(_this.val, roundx, roundy+charSize);
        };
    }

    // Util
    function getDistance(p1, p2) {
        return Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
    }
    
})();