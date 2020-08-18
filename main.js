let platforms, player, cursors, stars, scoreText, bombs, gameOver, gameOverText;

let score = 0

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300 },
      debug: false
    }
  },
  scene: {
    preload,
    create,
    update,
  },
}

var game = new Phaser.Game(config)

function preload() {
  this.load.image('sky', 'assets/sky.png')
  this.load.image('ground', 'assets/platform.png')
  this.load.image('star', 'assets/star.png')
  this.load.image('bomb', 'assets/bomb.png')

  // loads the player as a spritesheet, because it contains animation frames
  this.load.spritesheet('dude', 'assets/dude.png', {
    frameWidth: 32,
    frameHeight: 48,
  })
}

function create() {
    // add image to the game - 400(x), 300(y) because in Phaser3 all Game Objects are positioned based on their center by default. The background image is 800 x 600, so if we were to display it centered at 0 x 0 we would ony see the bottom-right corner of it. NOTE: you can `setOrigin` to change this. For example: `this.add.image(0, 0, 'sky').setOrigin(0, 0)` would reset the drawing position of the image to the top-left.
  // The order in which game objects are displayed matched the order in which you create them.
  this.add.image(400, 300, 'sky')
  
  // creates a new Static Physics Game and assigns it to the the `platforms` variable.
  // In arcade physics there are two types of physics bodies: `Dynamic` and `Static`.
  // `Dynamic` is one that can move around via forces such as velocity or acceleration. It can bounce and collide with other objects and that collision is influenced by the mass of the body and other elements.
  // `Static Body` simply has a position and a size. It isn't touched by gravity, you cannot set velocity on i and when something collides with it, it never moves.
  // `Group` is a way of grouping similar objects and control them all as one single unit. Groups can create their own Game Objects via handy helper functions like `create`. A `Physics Group` will automatically create physics enabled children, saving you some leg-work in the process.
  platforms = this.physics.add.staticGroup()

  // to fill the whole bottom with the image use `setScale`, and now is 800 x 63. Then call `refreshBody` to let the physics world about the changes made
  platforms.create(400, 568, 'ground').setScale(2).refreshBody()
  platforms.create(600, 400, 'ground')
  platforms.create(50, 250, 'ground')
  platforms.create(750, 220, 'ground')

  // add player - creates the sprite positiones at 100 x 45 from the bottom of the game. It was created by the Physics Game Object Factory (this.physics.add), which means it has a Dynamic Physics body by default.
  player = this.physics.add.sprite(100, 450, 'dude')

  // add bounce value of 0.2 - when it lands after jumping it will bounce slightly.
  player.setBounce(0.2)

  // the sprite is set to collide with the world bounds, so the player won't be able to run outside of the arena.
  player.setCollideWorldBounds(true)

  // define the animations
  // the left animation contains the frames from 0 to 3 (included)
  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  })

  this.anims.create({
    key: 'turn',
    frames: [{ key: 'dude', frame: 4 }],
    frameRate: 20
  })

  this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
  })

  // when a physics sprite is created it is given a `body` property, which is a reference to its arcade physics body.
  // simulate the effects of gravity - arbitrary value, the higher the heavier is the object and the quicker it falls down.
  player.body.setGravityY(300)

  // create a Collider object that monitors 2 physics objects (can include Groups) and checks for collisions or overlap between them. If that occurs it can then optionally invoke your own callback (optional)
  this.physics.add.collider(player, platforms)

  // Phaser has a built-in Keyboard manager. Just populate the cursors object with four properties with this function below, and then update the movement on the `update` function.
  cursors = this.input.keyboard.createCursorKeys()

  // add stars group
  stars = this.physics.add.group({
    key: 'star',
    repeat: 11,                           // creates 12 children in total (it creates 1 automatically and repeats 11 times)
    setXY: { x: 12, y: 0, stepX: 70}      // set the position of the 12 children with a step horizontal of 70px. So, the first one is created at 12 x 0, second one at 82 x 0, third at 152 x 0 etc. Use step to space out the children during creating.
  })

  // iterates through all stars and give a random Y bounce value between 0.4 and 0.8. The range is between 0 (no bounce) and 1 (full bounce).
  stars.children.iterate(child => child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)))

  // stop the stars from falling from the bottom of the screen and bounce at the platforms.
  this.physics.add.collider(stars, platforms)

  // check if player overlaps with a star, if so run the callback (collectStar)
  this.physics.add.overlap(player, stars, collectStar, null, this)

  // create the score - 16x16 is the coordinate to display the test at. then comes the default string to display and the styling.
  scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' })
  
  // create the bombs group
  bombs = this.physics.add.group()

  // add the collider so the bomb stops at the floor
  this.physics.add.collider(bombs, platforms)

  // add the collider of the bomb with the player and the callback(hitBomb)
  this.physics.add.collider(player, bombs, hitBomb, null, this)
}

function update() {

  // check which key is pressed and play the animation setting the velocity
  if (cursors.left.isDown) {
    player.setVelocityX(-160)
    player.anims.play('left', true)
  } else if (cursors.right.isDown) {
    player.setVelocityX(160)
    player.anims.play('right', true)
  } else {
    player.setVelocityX(0)
    player.anims.play('turn')
  }

  // jumping, check if up is pressed and if the player is touching the floor, otherwise it could jump while in mid-air.
  if (cursors.up.isDown && player.body.touching.down) {
    player.setVelocityY(-500)
  }
}

// callback for when the player and a star overlap.
function collectStar(player, star) {
  // It just disable the body of the star, making it invisible and removing from display.
  star.disableBody(true, true)

  // set the score
  score += 10
  scoreText.setText(`Score: ${score}`)

  // if all stars are collected, release a bomb
  if (stars.countActive(true) === 0) {
    // if no more stars, add them again
    stars.children.iterate(child => child.enableBody(true, child.x, 0, true, true));

    // pick random x coordinate on the opposite side of the screen to the player
    let x =
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);
  
    // create the bombs
    let bomb = bombs.create(x, 16, 'bomb');
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
  }
}

function hitBomb(player, bomb) {
  this.physics.pause()
  player.setTint(0xff0000)
  player.anims.play('turn')
  gameOver = true
  gameOverText = this.add.text(250, 240, "Game Over", {
    fontSize: "54px",
    fill: "#000",
  });
}