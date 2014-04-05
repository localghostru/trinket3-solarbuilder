Main.Playstate = function(game) {};

Main.Playstate.prototype = {
    create: function() {
        this.bodies = [];
        this.sun = new Planet(Main.width / 2, Main.height / 2, '#ffff00', 40, 500000);
        this.planet = new Planet(this.sun.centerX + 100, this.sun.centerY, '#ff00ff', 16, 0.8);
        this.planet.setVelocity(0, -Common.getRandomSpeed(this.sun, this.planet));
        
        this.bodies.push(this.sun);
        this.bodies.push(this.planet);
        this.lastUpdateTime = game.time.now;
        
        this.noUpdate = false;
        this.game.onPause.add(this.pause, this);
        this.game.onResume.add(this.resume, this);
        
        game.input.onDown.add(this.onGameClick, this);
    },
    
    pause: function() {
        this.noUpdate = true;
    },
    
    resume: function() {
        this.noUpdate = false;
        this.lastUpdateTime = game.time.now;
    },
    
    update: function() {
        if(this.noUpdate) return;
        var dt = (game.time.now - this.lastUpdateTime)/1000;
        
        for(var i = 0; i < this.bodies.length; i++) {
            this.bodies[i].accelerate(this.bodies, dt);
            this.bodies[i].move(dt);
            //console.log(this.bodies[i].centerX, this.bodies[i].centerY);
        }
        
        this.lastUpdateTime = game.time.now;
    },
    
    onGameClick: function(pointer) {
        var size = Math.random() * 15 + 10;
        var newPlanet = new Planet(pointer.x, pointer.y, '#0000ff', size, Math.sqrt(size)/5);
        var angle = Common.getAngle(newPlanet, this.sun);        
        var speed = Common.getRandomSpeed(this.sun, newPlanet);
        newPlanet.setVelocity(- speed * Math.sin(angle), speed * Math.cos(angle));
        this.bodies.push(newPlanet);
    }
}

Planet = function(x, y, color, size, mass) {
    this.mass = mass;
    this.customVel = new Phaser.Point();
    this.centerX = x;
    this.centerY = y;
    
    var bm = game.add.bitmapData(size, size);
    bm.ctx.fillStyle = color;
    bm.ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    bm.ctx.fill();
    
    Phaser.Sprite.call(this, game, x - size / 2, y - size / 2, bm);
    game.add.existing(this);
}

Planet.prototype = Object.create(Phaser.Sprite.prototype);
Planet.prototype.constructor = Planet;

Planet.prototype.setVelocity = function(x, y) {
    this.customVel.x = x;
    this.customVel.y = y;
}

Planet.prototype.move = function(timePassed) {
    var dx = timePassed * this.customVel.x;
    var dy = timePassed * this.customVel.y;
    
    this.x += dx;
    this.y += dy;
    this.centerX += dx;
    this.centerY += dy;
}

Planet.prototype.accelerate = function(bodies, timePassed) {
    var resForce = this.getResForce(bodies);
    this.customVel.x += timePassed * resForce.x;
    this.customVel.y += timePassed * resForce.y;
}

Planet.prototype.getResForce = function(bodies) {
    var resultant = new Phaser.Point();
    var angle, force;
    for(var i = 0; i < bodies.length; i++) {
        if(bodies[i] === this) continue;
        
        // Every force and angle is calculated twice this way. Probably move out of here into general loop?
        angle = Common.getAngle(this, bodies[i]);
        force = Common.getForce(this, bodies[i]);
        resultant.x += force/this.mass * Math.cos(angle);
        resultant.y += force/this.mass * Math.sin(angle);
    }
    //console.log(resultant);
    return resultant;
}