/* TODOs
    1. Scaling. --- seems to be done
    2. Right(?) pane with
        2.1 Statistics
        2.2 ...?
    3. Score.
    4. Adding planets by time or by will of player/button
    5. Images instead of bitmapdata
    6. Planet info on hover
    

*/

Main.Playstate = function(game) {};

Main.Playstate.prototype = {
    create: function() {    
        game.world.setBounds(-Main.width * 2, -Main.height * 2, Main.width * 4, Main.height * 4);
        game.camera.focusOnXY(0, 0);
        
        this.bodies = game.add.group();
        
        this.sun = new Planet(0, 0, '#fff0a0', 40, 1000000);
        var planet = new Planet(this.sun.centerX + 100, this.sun.centerY, '#ff00ff', 15, 10);
        planet.setVelocity(0, -Common.getRandomSpeed(this.sun, planet));
        
        this.bodies.add(this.sun);
        this.bodies.add(planet);
        this.lastUpdateTime = game.time.now;
        
        this.noUpdate = false;
        this.game.onPause.add(this.pause, this);
        this.game.onResume.add(this.resume, this);
        systemPauseCheck(this.pause, this.resume);
        
        upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        
        upKey.onDown.add(this.scaleUp);
        downKey.onDown.add(this.scaleDown);
        
        game.input.onDown.add(this.onGameClick, this);
    },
    
    scaleUp: function () {
        game.camera.scale.x -= 0.1;
        game.camera.scale.y -= 0.1;
        game.camera.focusOnXY(0, 0);
    },
    
    scaleDown: function () {
        game.camera.scale.x += 0.1;
        game.camera.scale.y += 0.1;
        game.camera.focusOnXY(0, 0);
    },
    
    pause: function() {
//        console.log("Paused: " + game.time.now);
        this.noUpdate = true;
    },
    
    resume: function() {
//        console.log("Resumed: " + game.time.now);
        this.noUpdate = false;
        this.lastUpdateTime = game.time.now;
    },
    
    update: function() {
        if(this.noUpdate) return;
        var dt = (game.time.now - this.lastUpdateTime)/1000;
        
        this.bodies.forEach(function(body) {
                body.accelerate(this.bodies, dt);
                body.move(dt);
                }, this);
        
        this.lastUpdateTime = game.time.now;
        
        Common.checkGroupCollision(this.bodies, this.collisionHandler);
    },
    
    render: function () {
        //game.debug.cameraInfo(game.camera, 500, 32);
    },
    
    onGameClick: function(pointer) {
        var size = Math.random() * 15 + 10;
        var worldXClicked = (pointer.x - Main.width / 2) / game.camera.scale.x;
        var worldYClicked = (pointer.y - Main.height / 2) / game.camera.scale.y;
        var newPlanet = new Planet(worldXClicked, worldYClicked, '#0000ff', size, Math.pow(10, (size / 5) - 2));
        var angle = Common.getAngle(newPlanet, this.sun);        
        var speed = Common.getRandomSpeed(this.sun, newPlanet);
        newPlanet.setVelocity(- speed * Math.sin(angle), speed * Math.cos(angle));
        
        this.bodies.add(newPlanet);
    },
    
    collisionHandler: function() {
        console.log("Crash!");
    }
}

Planet = function(x, y, color, size, mass) {
    this.mass = mass;
    this.radius = size / 2;
    this.customVel = new Phaser.Point();
    this.centerX = x;
    this.centerY = y;    
    
    var bm = game.add.bitmapData(size, size);
    bm.ctx.fillStyle = color;
    bm.ctx.arc(this.radius, this.radius, this.radius, 0, Math.PI * 2);
    bm.ctx.fill();
    
    Phaser.Sprite.call(this, game, x - this.radius, y - this.radius, bm);
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
    var angle, force, other;
    for(var i = 0; i < bodies.length; i++) {
        other = bodies.getAt(i);
        if(other === this) continue;
        
        // Every force and angle is calculated twice this way. Probably move out of here into general loop?
        angle = Common.getAngle(this, other);
        force = Common.getForce(this, other);
        resultant.x += force/this.mass * Math.cos(angle);
        resultant.y += force/this.mass * Math.sin(angle);
    }
    return resultant;
}