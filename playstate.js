/* TODOs
    1. Scaling. --- done in a way
    2. Right(?) pane with --- done in a way
        2.1 Statistics
        2.2 Planetary forge
    3. Score. --- done in a way
    4. Adding planets by time or by will of player/button --- done
    5. Images instead of bitmapdata --- done
    6. Planet info on hover --- mostly done
        6.1 Distance to sun in planet info --- done
        6.2 add names/numbers?
    7. Time counter --- done
    8. Gameover on crash
    9. Zoom buttons or at least hint for grey +- 

*/

const MIN_SPEED_MACH1 = 0.95;    // multiplied by mach1 for the planet
const MAX_SPEED_MACH1 = 1.15;    // multiplied by mach1 for the planet (mach 2 is 1.414214 times mach 1)
const ARROW_SIZE = 72;          // pixels long, not sure how to get this scale-independent on runtime
const ARROW_MIN_SCALE = 0.25;
const ARROW_MAX_SCALE = 2;

Main.Playstate = function(game) {};

Main.Playstate.prototype = {
    create: function() {    
        game.world.setBounds(-Main.width * 2, -Main.height * 2, Main.width * 4, Main.height * 4);
        bg = game.add.sprite(-Main.width * 2, -Main.height * 2, 'back');
        bg.scale.x = bg.scale.y = Main.width * 4 / 1024;
        game.camera.setBoundsToWorld();
        game.camera.focusOnXY(0, 0);
        
        this.age = 0;
        this.score = 0;       
        
        this.ageLabel = game.add.text(10, 10, 'Age: ', {font: 'bold 14pt Arial', fill:'rgba(255, 255, 255, 0.8)'})
        this.ageLabel.fixedToCamera = true;
        this.updateAge();
        this.scoreLabel = game.add.text(10, 40, 'Score: ', {font: 'bold 14pt Arial', fill:'rgba(255, 255, 255, 0.8)'})
        this.scoreLabel.fixedToCamera = true;
        this.updateScore();
        
        this.createMenu();
        this.createHints();
        this.planetForgingTween.start();
        
        this.bodies = game.add.group();
        
        this.sun = new Planet('#fff0a0', 40, 1000000, 'sun', 0.5);
        this.initialPlanet = new Planet('#ff00ff', 15, 10, 'planet10', 15/80);
        this.initialPlanet.placeAt(this.sun.centerX - 150, this.sun.centerY);
        this.initialPlanet.setVelocity(0, Common.getRandomSpeed(this.sun, this.initialPlanet));
        this.initialPlanet.setUpNewYear(this);
        
        this.bodies.add(this.sun);
        this.bodies.add(this.initialPlanet);
        this.addMenuPlanetInfo(this.initialPlanet);
        
        this.noUpdate = false;
        this.addingPlanet = false;
        this.settingPlanetVel = false;
        this.lastUpdateTime = game.time.now;
        game.input.onDown.add(this.onGameClick, this);
        //cursors = game.input.keyboard.createCursorKeys();
        
        scaleCloserKey = game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_ADD);
        scaleAwayKey = game.input.keyboard.addKey(Phaser.Keyboard.NUMPAD_SUBTRACT);
        scaleCloserKey.onDown.add(this.scaleCloser, this);
        scaleAwayKey.onDown.add(this.scaleAway, this);
    },
    
    update: function() {
        if(this.settingPlanetVel) {
            this.drawVelocityArrow();
        } else if (!this.addingPlanet) {
            this.planetForgingBar.crop(this.planetForgingRect);
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
    
    updateAge: function() {
        this.ageLabel.setText('Years passed: ' + this.age);
    },
    
    updateScore: function() {
        this.scoreLabel.setText('Score: ' + this.score);
    },
    
    drawVelocityArrow: function() {
        var px = (game.input.activePointer.x - Main.width / 2) / game.camera.scale.x;
        var py = (game.input.activePointer.y - Main.height / 2) / game.camera.scale.y;
        var distToPointer = Math.sqrt(Math.pow(this.arrow.x - px, 2) + Math.pow(this.arrow.y - py, 2));
        if(distToPointer > ARROW_MAX_SCALE * ARROW_SIZE) distToPointer = ARROW_MAX_SCALE * ARROW_SIZE;
        if(distToPointer < ARROW_MIN_SCALE * ARROW_SIZE) distToPointer = ARROW_MIN_SCALE * ARROW_SIZE;
        this.arrow.scale.x = distToPointer / ARROW_SIZE;
        // For this particular png I want it to be slightly narrower
        this.arrow.scale.y = distToPointer / ARROW_SIZE / 1.5;
        this.arrow.rotation = Math.atan2(this.arrow.y - py, this.arrow.x - px);
    },
        
    scaleCloser: function () {
        game.world.scale.x = game.world.scale.y = 1;
        this.menuGroup.visible = true;
    },
    
    scaleAway: function () {
        if(this.addingPlanet || this.settingPlanetVel) return;
        game.world.scale.x = game.world.scale.y = 0.5;
        this.menuGroup.visible = false;
    },    
    
    onMenuOver: function() {
        this.menuGroup.alpha = 0.8;
    },
    
    onMenuOut: function() {
        this.menuGroup.alpha = 0.5;
    },
    
    createPlanet: function() {
        var size = Math.random() * 15 + 10;        
        var type = Math.ceil(Math.random() * 9);
        
        this.newPlanet = new Planet('#0000ff', size, Math.pow(10, (size / 5) - 2),
                                    'planet'+type, size/80);
        this.newPlanet.visible = false;
        this.bodies.add(this.newPlanet);
        this.addMenuPlanetInfo(this.newPlanet);
    },
    
    onGameClick: function(pointer) {
        if(this.addingPlanet) {
            var worldXClicked = (pointer.x - Main.width / 2) / game.camera.scale.x;
            var worldYClicked = (pointer.y - Main.height / 2) / game.camera.scale.y;
            this.newPlanet.placeAt(worldXClicked, worldYClicked);
            this.newPlanet.visible = true;
            
            // Change hint, set up arrow and state
            this.arrow.reset(worldXClicked, worldYClicked);
            this.arrow.scale.x = this.arrow.scale.y = 0;
            this.onPlanetPlaced();
        } else if(this.settingPlanetVel) {
            var mach1 = Common.getFirstSpeed(this.sun, this.newPlanet);
            var speed1 = mach1 * MIN_SPEED_MACH1;
            var speed2 = mach1 * MAX_SPEED_MACH1;
            var scaleFraction = (this.arrow.scale.x - ARROW_MIN_SCALE) / (ARROW_MAX_SCALE - ARROW_MIN_SCALE);
            var speed = speed1 + (speed2 - speed1) * scaleFraction;
            
            this.newPlanet.setVelocity(-speed * Math.cos(this.arrow.rotation), -speed * Math.sin(this.arrow.rotation));
            this.newPlanet.setUpNewYear(this);
            
            // Hide hints, arrow, change status
            this.arrow.kill();
            this.onPlanetRun();
        }
    },
    
    onPlanetReady: function() {
        this.noUpdate = true;
        this.addingPlanet = true;
        
        // Careful with this - it implicitly knows that there are currently only two zoom states.
        this.scaleCloser();
        
        this.planetForgingLabel.setText('New planet is ready!');
        this.placePlanetHint.visible = true;
        this.placePlanetHintBlink.resume();
        
        this.createPlanet();
    },
    
    onPlanetPlaced: function () {
        this.addingPlanet = false;
        this.settingPlanetVel = true;
        
        this.placePlanetHint.visible = false;
        this.placePlanetHintBlink.pause();
        
        this.startPlanetHint.visible = true;
        this.startPlanetHintBlink.resume();
    },
    
    onPlanetRun: function() {
        // Revert to the normal state        
        this.addingPlanet = false;
        this.settingPlanetVel = false;
        this.noUpdate = false;
        this.lastUpdateTime = game.time.now;
        
        this.planetForgingLabel.setText('Planetary forge is working...');
        this.startPlanetHint.visible = false;
        this.startPlanetHintBlink.pause();
        
        // Restart planet forging as well
        this.planetForgingRect.width = 0;
        this.planetForgingTween.start();
    },
    
    createMenu: function() {
        var bmd, grd;
        
        this.menuGroup = game.add.group();        
        this.menuGroup.x = Main.width - 200;
        this.menuGroup.y = 0;
        this.menuGroup.alpha = 0.5;
        this.menuGroup.fixedToCamera = true;
        
        // Background
        bmd = game.add.bitmapData(200, Main.height);
        bmd.ctx.rect(0, 0, bmd.width, bmd.height);
        bmd.ctx.fillStyle = '#808080';
        bmd.ctx.fill();
        this.menuBG = game.add.sprite(0, 0, bmd);
        this.menuBG.inputEnabled = true;
        this.menuBG.events.onInputOver.add(this.onMenuOver, this);
        this.menuBG.events.onInputOut.add(this.onMenuOut, this);
        this.menuBGCrop = new Phaser.Rectangle(0, 0, bmd.width, 130);
        this.menuBG.crop(this.menuBGCrop);
        
        this.menuGroup.add(this.menuBG);
        
        var planetCreation = game.add.text(10, 10, "Planet creation",
                                        {font: 'bold 14pt Arial', fill:'#fff'});
        this.menuGroup.add(planetCreation);
        
        var planetList = game.add.text(10, 100, "Planet list",
                                        {font: 'bold 14pt Arial', fill:'#fff'});
        this.menuGroup.add(planetList);
        
        // Planet creation progress bar
        bmd = game.add.bitmapData(180, 40);
        bmd.ctx.rect(0, 0, bmd.width, bmd.height);
        grd = bmd.ctx.createLinearGradient(0, 0, bmd.width, 0);
        grd.addColorStop(0, "#60ff00");
        grd.addColorStop(1, "#ff6000");
        bmd.ctx.fillStyle = grd;
        bmd.ctx.fill();
        
        this.planetForgingBar = game.add.sprite(10, 35, bmd);
        
        this.planetForgingRect = new Phaser.Rectangle(0, 0, 0, this.planetForgingBar.height);
        this.planetForgingTween = game.add.tween(this.planetForgingRect).
                                    to({width: this.planetForgingBar.width}, 10000, Phaser.Easing.Linear.None, false);
        this.planetForgingTween.onComplete.add(this.onPlanetReady, this);
        
        this.menuGroup.add(this.planetForgingBar);
        
        this.planetForgingLabel = game.add.text(15, 45, "Planetary forge is working...",
                                           {font: '11pt Arial', fill:'#fff'});
        this.menuGroup.add(this.planetForgingLabel);
    },
    
    addMenuPlanetInfo: function(planet) {
        var textY = 125 + (this.bodies.length - 2) * 20;
        var newMenuText = game.add.text(10, textY, '', {font: '11pt Arial', fill:'#fff'});
        planet.setMenuInfoText(newMenuText);
        this.menuBGCrop.height += 20;
        this.menuBG.crop(this.menuBGCrop);
        
        this.menuGroup.add(newMenuText);
    },
    
    createHints: function() {
        // Velocity arrow is also a kind of hint :)        
        this.arrow = game.add.sprite(0, 0, 'arrow');
        this.arrow.anchor.setTo(1, 0.5);
        this.arrow.kill();
        
        // Text hints from now on
        this.placePlanetHint = game.add.text(Main.width / 2, Main.height - 100, 'Place new planet',
                                             {font: 'bold 18pt Arial', fill:'#fff'});
        this.placePlanetHint.fixedToCamera = true;
        this.placePlanetHint.anchor.setTo(0.5);
        this.placePlanetHint.visible = false;
        this.placePlanetHintBlink = game.add.tween(this.placePlanetHint).
                                    to({alpha: 0.1}, 1000, Phaser.Easing.Quadratic.Out, true, 0, Number.MAX_VALUE, true);
        this.placePlanetHintBlink.pause();
        
        this.startPlanetHint = game.add.text(Main.width / 2, Main.height - 100, 'Choose starting velocity',
                                             {font: 'bold 18pt Arial', fill:'#fff'});
        this.startPlanetHint.fixedToCamera = true;
        this.startPlanetHint.anchor.setTo(0.5);
        this.startPlanetHint.visible = false;
        this.startPlanetHintBlink = game.add.tween(this.startPlanetHint).
                                    to({alpha: 0.1}, 1000, Phaser.Easing.Quadratic.Out, true, 0, Number.MAX_VALUE, true);
        this.startPlanetHintBlink.pause();
    },    
    
    yearPassed: function(planet) {
        if(planet === this.initialPlanet) {
            // Every revolution of the first planet we increase score for the number of planets already in (behind first).
            this.score += (this.bodies.length - 2);
            this.age++;
            this.updateAge();
        }
        else {
            this.score++;
        }
        this.updateScore();
    },
    
    collisionHandler: function() {
        console.log("Crash!");
    }
}

Planet = function(color, size, mass, sprite, spritescale) {
    this.mass = mass;
    this.radius = size / 2;
    this.customVel = new Phaser.Point();
    this.centerX = this.centerY = 0;
    this.age = 0;    
    
    Phaser.Sprite.call(this, game, 0, 0, sprite);
    this.scale.x = this.scale.y = spritescale;
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
    this.birthTime = game.time.now;
}

Planet.prototype.placeAt = function(x, y) {
    dx = x - this.x;
    dy = y - this.y;
    this.x += dx;
    this.y += dy;    
    this.centerX += dx;
    this.centerY += dy;
    this.info.x += dx;
    this.info.y += dy;
}

Planet.prototype.move = function(timePassed) {
    var dx = timePassed * this.customVel.x;
    var dy = timePassed * this.customVel.y;
    
    if(this.star) {
        var preAngle = Common.getAngle(this.star, this);
    }
    
    this.x += dx;
    this.y += dy;    
    this.centerX += dx;
    this.centerY += dy;
    this.info.x += dx;
    this.info.y += dy;
    
    if(this.info.alpha > 0) this.buildHoverInfoText();
    if(this.star) {
        var postAngle = Common.getAngle(this.star, this);
        if(Common.isAngleBetween(this.initialAngle, preAngle, postAngle) &&
           game.time.now - this.birthTime > 1000) {
            // First condition in each conjunction is just checking for rotation direction. PI/12 is just something small.
            this.callbackContext.yearPassed(this);
            this.age++;
            this.menuText.setText('Planet mass: ' + this.mass.toFixed(1) + ', age: ' + this.age);
        }
    }
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

Planet.prototype.buildHoverInfoText = function() {
    var infoText = 'Mass: ' + this.mass.toFixed(3) + '\n' +
                   'VelX: ' + this.customVel.x.toFixed(3) + '\n' +
                   'VelY: ' + this.customVel.y.toFixed(3);
    if(this.star)
        infoText += '\nDist: ' + Math.sqrt(Common.getSquaredDistance(this.star, this)).toFixed(3);
    this.info.setText(infoText);
}

Planet.prototype.setMenuInfoText = function(textDisplayObject) {
    this.menuText = textDisplayObject;
    this.menuText.setText('Planet mass: ' + this.mass.toFixed(1) + ', age: ' + this.age);
}

Planet.prototype.onHover = function() {
    this.info.alpha = 1;
    game.add.tween(this.info).to({alpha: 0}, 5000, Phaser.Easing.Quintic.In, true);
}

Planet.prototype.setUpNewYear = function(context) {
    // This is a bad way of creating a callback :D
    this.star = context.sun;
    this.initialAngle = Common.getAngle(this.star, this);
    this.callbackContext = context;
}