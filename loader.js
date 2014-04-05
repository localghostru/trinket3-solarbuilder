Main = { width: 640, height: 480 };

Main.Loader = function(game) {};

Main.Loader.prototype = {
    preload:  function() {
        game.stage.backgroundColor = '#000018';
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
    }
}