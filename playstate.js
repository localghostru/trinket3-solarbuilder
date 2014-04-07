/* TODOs
    1. Scaling. --- done in a way
    2. Right(?) pane with
        2.1 Statistics
        2.2 ...?
    3. Score.
    4. Adding planets by time or by will of player/button
    5. Images instead of bitmapdata --- done
    6. Planet info on hover --- mostly done, add names/numbers?
    7. Time counter

*/

const MIN_SPEED_MACH1 = 0.9;    // multiplied by mach1 for the planet
const MAX_SPEED_MACH1 = 1.3;    // multiplied by mach1 for the planet (mach 2 is 1.414214 times mach 1)
const ARROW_SIZE = 72;          // pixels long, not sure how to get this scale-independent on runtime
const ARROW_MIN_SCALE = 0.25;
const ARROW_MAX_SCALE = 2;

Main.Playstate = function(game) {};

Main.Playstate.prototype = {
    create: function() {    
        game.world.setBounds(-Main.width * 2, -Main.height * 2, Main.width * 4, Main.height * 4);
        game.camera.focusOnXY(0, 0);
        
        this.bodies = game.add.group();
        
        this.sun = new Planet(0, 0, '#fff0a0', 40, 1000000, 'sun', 0.5);
        var planet = new Planet(this.sun.centerX + 100, this.sun.centerY, '#ff00ff', 15, 10, 'planet10', 15/80);
        planet.setVelocity(0, -Common.getRandomSpeed(this.sun, planet));
        
        this.bodies.add(this.sun);
        this.bodies.add(planet);
        
        this.arrow = game.add.sprite(0, 0, 'arrow');
        this.arrow.anchor.setTo(1, 0.5);
        this.arrow.kill();
        
        this.noUpdate = false;
        this.addingPlanet = false;
        this.game.onPause.add(this.pause, this);
        this.game.onResume.add(this.resume, this);      
        
        this.lastUpdateTime = game.time.now;
        game.input.onDown.add(this.onGameClick, this);
        
        var bmd = game.add.bitmapData(200, Main.height);
        bmd.ctx.rect(0, 0, bmd.width, bmd.height);
        bmd.ctx.fillStyle = '#808080';
        bmd.ctx.fill();
        this.menuBG = game.add.sprite(0, 0, bmd);
        this.menuBG.inputEnabled = true;
        this.menuBG.events.onInputOver.add(this.onMenuOver, this);
        this.menuBG.events.onInputOut.add(this.onMenuOut, this);    
        
        this.menuGroup = game.add.group();
        this.menuGroup.add(this.menuBG);
        this.menuGroup.x = Main.width - bmd.width;
        this.menuGroup.y = 0;
        this.menuGroup.alpha = 0.3;
        this.menuGroup.fixedToCamera = true;
        
        cursors = game.input.keyboard.createCursorKeys();
        
        scaleCloserKey = game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_ADD);
        scaleAwayKey = game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_SUBTRACT);
        scaleCloserKey.onDown.add(this.scaleCloser, this);
        scaleAwayKey.onDown.add(this.scaleAway, this);
    },
    
    scaleCloser: function () {
        game.world.scale.x = game.world.scale.y = 1;
        this.menuGroup.visible = true;
    },
    
    scaleAway: function () {
        game.world.scale.x = game.world.scale.y = 0.5;
        this.menuGroup.visible = false;
    },    
    
    onMenuOver: function() {
        this.menuGroup.alpha = 0.7;
    },
    
    onMenuOut: function() {
        this.menuGroup.alpha = 0.3;
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
        if(this.addingPlanet) {
            var px = (game.input.activePointer.x - Main.width / 2) / game.camera.scale.x;
            var py = (game.input.activePointer.y - Main.height / 2) / game.camera.scale.y;
            var distToPointer = Math.pow(Math.pow(this.arrow.x - px, 2) + Math.pow(this.arrow.y - py, 2), 0.5);
            if(distToPointer > ARROW_MAX_SCALE * ARROW_SIZE) distToPointer = ARROW_MAX_SCALE * ARROW_SIZE;
            if(distToPointer < ARROW_MIN_SCALE * ARROW_SIZE) distToPointer = ARROW_MIN_SCALE * ARROW_SIZE;
            this.arrow.scale.x = distToPointer / ARROW_SIZE;
            // For this particular png I want it to be slightly narrower
            this.arrow.scale.y = distToPointer / ARROW_SIZE / 1.5;
            this.arrow.rotation = Math.atan2(this.arrow.y - py, this.arrow.x - px);
        } else {
            if (cursors.up.isDown)  {
                game.camera.y -= 4;
            } else if (cursors.down.isDown) {
                game.camera.y += 4;
            } if (cursors.left.isDown) {
                game.camera.x -= 4;
            } else if (cursors.right.isDown) {
                game.camera.x += 4;
            }
        }
        
        if(!this.noUpdate) { 
            var dt = (game.time.now - this.lastUpdateTime)/1000;
            if(dt > 0.25) dt = 0.25;
            
            this.bodies.forEach(function(body) {
                    if(body !== this.sun) {
                        body.rotation = Common.getAngle(this.sun, body) - 1/4 * Math.PI;
                    }
                    body.accelerate(this.bodies, dt);
                    body.move(dt);
                    }, this);
            
            Common.checkGroupCollision(this.bodies, this.collisionHandler);
        }
        this.lastUpdateTime = game.time.now;
    },
        
    render: function () {
        //game.debug.cameraInfo(game.camera, 500, 32);
    },
    
    onGameClick: function(pointer) {
        if(!this.addingPlanet) {
            var size = Math.random() * 15 + 10;
            var worldXClicked = (pointer.x - Main.width / 2) / game.camera.scale.x;
            var worldYClicked = (pointer.y - Main.height / 2) / game.camera.scale.y;
            var type = Math.ceil(Math.random() * 9);
            this.newPlanet = new Planet(worldXClicked, worldYClicked, '#0000ff', size, Math.pow(10, (size / 5) - 2),
                                        'planet'+type, size/80);
            this.bodies.add(this.newPlanet);
            
            this.arrow.reset(worldXClicked, worldYClicked);
            this.arrow.scale.x = 0;
            this.arrow.scale.y = 0;
            
            this.addingPlanet = true;
            this.noUpdate = true;
        }  else {
            var mach1 = Common.getFirstSpeed(this.sun, this.newPlanet);
            var speed1 = mach1 * MIN_SPEED_MACH1;
            var speed2 = mach1 * MAX_SPEED_MACH1;
            var scaleFraction = (this.arrow.scale.x - ARROW_MIN_SCALE) / (ARROW_MAX_SCALE - ARROW_MIN_SCALE);
            var speed = speed1 + (speed2 - speed1) * scaleFraction;
            
            this.newPlanet.setVelocity(-speed * Math.cos(this.arrow.rotation), -speed * Math.sin(this.arrow.rotation));
            
            this.arrow.kill();
            this.addingPlanet = false;
            this.noUpdate = false;
            this.lastUpdateTime = game.time.now;            
        }
    },
    
    collisionHandler: function() {
        console.log("Crash!");
    }
}

Planet = function(x, y, color, size, mass, sprite, spritescale) {
    this.mass = mass;
    this.radius = size / 2;
    this.customVel = new Phaser.Point();
    this.centerX = x;
    this.centerY = y;    
    
    if(sprite) {
        Phaser.Sprite.call(this, game, x, y, sprite);
        this.scale.x = this.scale.y = spritescale;
    }
    else {
        var bm = game.add.bitmapData(size + 1, size + 1);
        bm.ctx.fillStyle = color;
        bm.ctx.arc(this.radius, this.radius, this.radius, 0, Math.PI * 2);
        bm.ctx.fill();
        Phaser.Sprite.call(this, game, x, y, bm);
    }
    
    this.anchor.set(0.5, 0.5);

    this.setUpInfo();
    game.add.existing(this);
    this.inputEnabled = true;
    this.events.onInputOver.add(this.onHover, this);
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
    this.info.x += dx;
    this.info.y += dy;
    
    if(this.info.alpha > 0) this.buildInfoText();
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

Planet.prototype.setUpInfo = function() {
    this.info = game.add.text(this.centerX + this.radius, this.centerY + this.radius,
                  '', { font: '10px Courier', fill: '#fff' });
    this.info.alpha = 0;
}

Planet.prototype.buildInfoText = function() {
    var infoText = 'Mass: ' + this.mass.toFixed(3) + '\n' +
                   'VelX: ' + this.customVel.x.toFixed(3) + '\n' +
                   'VelY: ' + this.customVel.y.toFixed(3);
    this.info.setText(infoText);
}

Planet.prototype.onHover = function() {
    this.info.alpha = 1;
    game.add.tween(this.info).to({alpha: 0}, 10000, Phaser.Easing.Quintic.In, true);
}