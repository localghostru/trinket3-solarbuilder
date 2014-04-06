Main = { width: 800, height: 600 };

Main.Loader = function(game) {};

Main.Loader.prototype = {
    preload:  function() {
        game.stage.backgroundColor = '#000020';
    },
    
    create: function() {
        game.state.start('Playstate');
    }
}

Common = {
    myG: 1,
    
    getAngle: function(body1, body2) {
        return Math.atan2(body2.centerY - body1.centerY, body2.centerX - body1.centerX);
    },

    getSquaredDistance: function(body1, body2) {
        return Math.pow(body1.centerX - body2.centerX, 2) + Math.pow(body1.centerY - body2.centerY, 2);
    },
    
    getForce: function(body1, body2) {
        return this.myG * body1.mass * body2.mass / this.getSquaredDistance(body1, body2);
    },
    
    getFirstSpeed: function(sun, planet) {
        return Math.pow(this.myG * sun.mass /
            Math.pow(this.getSquaredDistance(planet, sun), 0.5), 0.5);
    },
    
    getSecondSpeed: function(sun, planet) {
        return 1.41421356237 * this.getFirstSpeed(sun, planet);
    },
    
    getRandomSpeed: function(sun, planet) {
        var first = this.getFirstSpeed(sun, planet);
        return first + Math.random() * (this.getSecondSpeed(sun, planet) - first) / 4;
    },
    
    checkCollision: function(body1, body2) {
        var dist = this.getSquaredDistance(body1, body2);
        return (dist < Math.pow(body1.radius + body2.radius, 2));
    },
    
    checkGroupCollision: function(bodies, callback) {
        var i, j, first, second;
        for(i = 0; i < bodies.length; i++) {
            first = bodies.getAt(i);
            for(j = i + 1; j < bodies.length; j++) {
                second = bodies.getAt(j);
                if (this.checkCollision(first, second) && typeof(callback) == 'function') {
                    callback(first, second);
                }
            }
        }   
    }
}

// http://stackoverflow.com/questions/1060008/is-there-a-way-to-detect-if-a-browser-window-is-not-currently-active
// No idea if I'm using this correctly
systemPauseCheck = function(pauseCallback, resumeCallback) {
    var hidden = "hidden";

    // Standards:
    if (hidden in document)
        document.addEventListener("visibilitychange", onchange);
    else if ((hidden = "mozHidden") in document)
        document.addEventListener("mozvisibilitychange", onchange);
    else if ((hidden = "webkitHidden") in document)
        document.addEventListener("webkitvisibilitychange", onchange);
    else if ((hidden = "msHidden") in document)
        document.addEventListener("msvisibilitychange", onchange);
    // IE 9 and lower:
    else if ('onfocusin' in document)
        document.onfocusin = document.onfocusout = onchange;
    // All others:
    else
        window.onpageshow = window.onpagehide 
            = window.onfocus = window.onblur = onchange;

    function onchange (evt) {
        var v = 'visible', h = 'hidden',
            evtMap = { 
                focus:v, focusin:v, pageshow:v, blur:h, focusout:h, pagehide:h 
            };

        evt = evt || window.event;
        if (evt.type in evtMap)
            document.body.className = evtMap[evt.type];
        else        
            document.body.className = this[hidden] ? "hidden" : "visible";
        
        if(document.body.className == h) {
            pauseCallback();
        }
        else {
            resumeCallback();
        }
    }
}