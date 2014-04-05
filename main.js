var game = new Phaser.Game(Main.width, Main.height, Phaser.CANVAS, 'gameFrame');

game.state.add('Loader', Main.Loader);
game.state.add('Playstate', Main.Playstate);

game.state.start('Loader');