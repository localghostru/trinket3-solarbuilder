Main = { width: 800, height: 600 };

Main.Loader = function(game) {};

Main.Loader.prototype = {
    preload:  function() {
        game.stage.backgroundColor = '#000020';
        game.load.image('sun', 'assets/sprites/sun.png');
        game.load.image('planet1', 'assets/sprites/p1shaded.png');
        game.load.image('planet2', 'assets/sprites/p2shaded.png');
        game.load.image('planet3', 'assets/sprites/p3shaded.png');
        game.load.image('planet4', 'assets/sprites/p4shaded.png');
        game.load.image('planet5', 'assets/sprites/p5shaded.png');
        game.load.image('planet6', 'assets/sprites/p6shaded.png');
        game.load.image('planet7', 'assets/sprites/p7shaded.png');
        game.load.image('planet8', 'assets/sprites/p8shaded.png');
        game.load.image('planet9', 'assets/sprites/p9shaded.png');
        game.load.image('planet10', 'assets/sprites/p10shaded.png');
        game.load.image('arrow', 'assets/sprites/longarrow2.png');
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