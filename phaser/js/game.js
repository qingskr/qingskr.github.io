var gameWidth = 1000;
var gameHeight = window.innerHeight-20;

var config = {
  parent: 'phaser-example', // 父级 DOM 元素
  type: Phaser.AUTO, // 渲染模式: AUTO/WEBGL/CANVAS
  width: gameWidth,        // 画布宽度
  height: gameHeight,       // 画布高度
  backgroundColor: "#9bd4c3", // 背景颜色
  // 场景生命周期方法
  scene: {
    init: init,      // 初始化场景
    preload: preload, // 资源加载
    create: create,   // 创建场景
    update: update,    // 更新场景
    render: render    // 渲染场景
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
    },
  },
}

var drt = false;

const heroOptions = {
  playerGravity: 900, // 玩家重力
  playerGrip: 100, // 墙壁摩擦力下的重力
  playerSpeed: 200, // 行走速度
  playerJump: 400, // 跳跃力
  playerDoubleJump: 300, // 二段跳越力
  playerBounce: 0.2, // 反弹系数
}

var game = new Phaser.Game(config);

function init() {
  console.log("🚀 ~ init ~ game:", game);
  this.cursors = this.input.keyboard.createCursorKeys(); // 创建方向键对象
  this.keys = this.input.keyboard.addKeys('A,D,W,S'); // 创建自定义按键对象
}

// 加载资源
function preload() {
  this.load.image('boy', 'assets/00.png');
  this.load.image('bird', 'assets/red_bird_normal.png');
  this.load.image('happy', 'assets/red_bird_happy.png');
  this.load.image('yuck', 'assets/red_bird_yuck.png');
}

// 创建游戏场景
function create() {

  this.platforms = this.physics.add.staticGroup();

  var img = this.physics.add.image(100, gameHeight / 2, 'boy').setScale(0.1).setImmovable();
  img.displayWidth = 200;
  img.displayHeight = 200;
  // img.setInteractive();

  // 创建底部
  const graphics = this.add.graphics();
  graphics.fillStyle(0xF56327);
  this.bottomDom = new Phaser.Geom.Rectangle(0, gameHeight - 50, gameWidth, 50);
  graphics.fillRectShape(this.bottomDom);


  // 创建角色
  this.hero = this.physics.add.sprite(70, 70, 'boy').setScale(0.1);
  this.hero.setCollideWorldBounds(true); // 碰撞边界

  // 创建鸟
  this.bird = this.physics.add.sprite(175, 175, 'bird');

  this.bird.setCollideWorldBounds(true); // 碰撞边界
  this.bird.setBounce(heroOptions.playerBounce); // 反弹系数
  this.bird.setGravityY(heroOptions.playerGravity); // 重力
  this.bird.setDrag(heroOptions.playerGrip); // 摩擦力
  this.bird.setVelocityX(heroOptions.playerSpeed); // 速度
  this.bird.setVelocityY(heroOptions.playerJump); // 跳跃力
  this.bird.setInteractive(); // 交互对象
  // this.bird.setOrigin(0, 0); // 锚点
  // this.bird.setImmovable(false); // 碰撞移动
  this.bird.setFlipX(true); // 翻转图片



   // 设置移动速度
  // this.bird.body.velocity.x = heroOptions.playerSpeed;
  // console.log("🚀 ~ create ~ hero:", this.bird)

  // 攻击动作（播放一次后回到空闲状态）
  // this.anims.create({
  //   key: 'happy',
  //   frames: this.load.spritesheet('happy',
  //     'images/red_bird_happy.png',
  //     { frameWidth: 350, frameHeight: 350 }
  //   ),
  //   frameRate: 15,
  //   repeat: 0 // 只播放一次
  // });

  // this.anims.create({
  //   key: 'yuck',
  //   frames: this.load.spritesheet('yuck',
  //     'images/red_bird_yuck.png',
  //     { frameWidth: 350, frameHeight: 350 }
  //   ),
  //   frameRate: 15,
  //   repeat: 0 // 只播放一次
  // });

  // 启用单点触摸输入
  // this.input.addPointer(1);

  // 监听鼠标点击事件
  this.bird.on('pointerdown', function(pointer) {
    console.log("🚀 ~ this.bird.on ~ pointer:", pointer)
    this.bird.setTexture('happy');
  }, this);

  // 监听鼠标松开事件
  this.bird.on('pointerup', function(pointer) {
    this.bird.setTexture('bird');
  }, this);

  // 监听鼠标移动事件
  // this.input.on('pointermove', function (pointer) {
  //   if (pointer.x > pointer.prevPosition.x) {
  //     this.bird.setVelocityX(heroOptions.playerSpeed);
  //   } else {
  //     this.bird.setVelocityX(-heroOptions.playerSpeed);
  //   }
  // }, this);

  // 隐藏鼠标光标
  // this.input.setDefaultCursor('none');
  // 设置默认指针为第一个触摸点
  // this.input.setDefaultPointer(1);
  this.input.topOnly = true; // 只响应顶层对象事件

  // 配置碰撞器
  this.physics.add.collider(
    img,
    this.bird,
  );
}

function isGameOver(world) {
  return ball.body.y > world.bounds.height;
}

// 更新游戏逻辑
function update() {
  // var sprite = this.children.getByName('make');
  // if (sprite.x >= 900) {
  //   drt = true;
  // }
  // if (sprite.x <= 100) {
  //   drt = false;
  // }
  // if (drt) {
  //   sprite.x -= 1;
  // } else {
  //   sprite.x += 1;
  // }

  if (this.cursors.left.isDown) {
    this.hero.x -= 5;
  }
  if (this.cursors.right.isDown) {
    this.hero.x += 5;
  }
  if (this.cursors.up.isDown) {
    this.hero.y -= 5;
  }
  if (this.cursors.down.isDown) {
    this.hero.y += 5;
  }


  if (this.keys.A.isDown) {
    this.bird.setVelocityX(-heroOptions.playerSpeed);
  }
  if (this.keys.D.isDown) {
    this.bird.setVelocityX(heroOptions.playerSpeed);
  }
  if (this.keys.W.isDown && !this.bird.body.touching.down) {
    this.bird.setVelocityY(-heroOptions.playerJump);
  }
  if (this.keys.S.isDown && !this.bird.body.touching.down) {
    this.bird.setVelocityY(heroOptions.playerJump);
  }
}

function render() {
  console.log("🚀 ~ render ~ game:", game);
  // this.input.mouse.disableContextMenu(); // 禁用右键菜单


}
