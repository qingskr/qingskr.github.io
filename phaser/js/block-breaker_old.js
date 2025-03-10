const gameWidth = window.innerWidth;
const gameHeight = window.innerHeight;

const gameConfig = {
  type: Phaser.AUTO, // 游戏类型
  parent: 'game', // 父级元素
  width: gameWidth, // 宽度
  height: gameHeight, // 高度
  antialias: true, // 抗锯齿
  multiTexture: true, // 多纹理优化
  scale: {
    mode: Phaser.Scale.RESIZE, // 缩放模式
    autoCenter: Phaser.Scale.CENTER_BOTH, // 自动居中
  },
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
  physics: {
    default: 'arcade', // 默认物理引擎
    arcade: {
      gravity: false, // 重力
      // debug: true, // 开启调试模式
    }
  }
}

// 定义拍子配置
const playerConfig = {
  width: 128, // 宽度
  height: 32, // 高度
  speed: 500, // 速度
}

// 定义球配置
const ballConfig = {
  width: 32, // 宽度
  height: 32, // 高度
  speed: 500, // 速度
  bounce: 1, // 反弹系数
  level: 1, // 初始等级
  levelMax: 5, // 最大等级
}

// 定义砖块配置
const brickConfig = {
  width: 64, // 宽度
  height: 32, // 高度
  space: 15, // 作用范围
  level: 1, // 初始等级
  levelMax: 5, // 最大等级
}

// 定义BUFF配置
const buffsConfig = {
  width: 64.8, // 宽度
  height: 92, // 高度
  gravity: 150, // 重力
  children: [
    {
      texture: 'ball-speed',
      effect: (ball) => {
        ballConfig.speed *= 2;
        return {duration: 5000, revert: () => ballConfig.speed /= 2};
      },
    },
    {
      texture: 'player-speed',
      effect: (player) => {
        playerConfig.speed *= 1.5;
        return {duration: 5000, revert: () => playerConfig.speed /= 1.5};
      },
    },
    {
      texture: 'ball-big',
      effect: (ball) => {
        ball.setScale(2);
        return {duration: 5000, revert: () => ball.setScale(1)};
      },
    },
    {
      texture: 'player-width',
      effect: (player) => {
        player.setScale(2, 0.5);
        return {duration: 5000, revert: () => player.setScale(1, 0.5)};
      },
    },
  ]
}

const game = new Phaser.Game(gameConfig);

let player, ball, violetBricks, yellowBricks, redBricks, cursors, customKeys, activeBuffs;

let openingText, gameOverText, playerWonText;

// 游戏是否启动
let gameStarted = false;

// 玩家当前生效的BUFF
let currentBuffs = new Map();

// 预加载资源
function preload() {
  this.load.image('ball', 'assets/images/ball_32_32.png');
  this.load.image('ballBu', 'assets/images/ball_bu_32_32.png');
  this.load.image('ballVip', 'assets/images/ball_vip_32_32.png');
  this.load.image('brick1', 'assets/images/brick1_64_32.png');
  this.load.image('brick2', 'assets/images/brick2_64_32.png');
  this.load.image('brick3', 'assets/images/brick3_64_32.png');
  this.load.image('paddle', 'assets/images/paddle_128_32.png');
  this.load.spritesheet({
    key: 'buffs',       // 纹理集标识符 (必填)
    url: 'assets/images/buffs_258_275.png', // 图片路径 (必填)
    frameConfig: {       // 帧配置对象 (必填)
      frameWidth: buffsConfig.width,  // 单帧宽度 (像素)
      frameHeight: buffsConfig.height, // 单帧高度 (像素)
      // startFrame: 0,   // 起始帧 (默认0)
      // endFrame: 0,     // 结束帧
      // margin: 2,       // 图片外边框 (像素)
      // spacing: 0,      // 帧间距 (像素)
      // skipFrames: 0    // 跳过指定数量帧 (3.55新增)
    }
  });
}

// 创建游戏对象
function create() {
  const world = this.physics.world;

  // 添加拍子
  player = this.physics.add.sprite(gameWidth / 2, gameHeight - playerConfig.height, 'paddle');
  player.setCollideWorldBounds(true); // 设置防止拍子出界
  player.setImmovable(true); // 设置防止拍子移动
  player.setScale(1, 0.5); // 设置拍子缩放

  // 添加球
  ball = this.physics.add.sprite(gameWidth / 2, player.y - playerConfig.height + player.body.halfHeight * 0.5, 'ballBu');
  ball.setCollideWorldBounds(true); // 设置防止球出界
  ball.setBounce(ballConfig.bounce); // 设置反弹系数
  ball.level = ballConfig.level; // 设置球等级
  ball.text = this.add.text(
    ball.x,
    ball.y,
    ball.level,
    {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '16px',
      fill: '#333',
    }
  )
  ball.text.setOrigin(0.5); // 设置文字居中

  // 添加砖块组1
  violetBricks = this.physics.add.group({
    key: 'brick1', // 砖块类型
    repeat: Math.floor((gameWidth - (brickConfig.width * 2)) / (brickConfig.width + brickConfig.space)), // 砖块数量, 本身自带1个
    setXY: {
      x: brickConfig.width, // 砖块初始X位置
      y: brickConfig.height, // 砖块初始Y位置
      stepX: brickConfig.width + brickConfig.space, // x轴上重复的砖块之间的像素长度
    },
    immovable: true, // 碰撞对速度的影响
  });
  violetBricks.getChildren().forEach((brick, idx, arr) => {
    brick.level = Phaser.Math.Between(1, 5); // 设置砖块等级

    brick.text = this.add.text(
      brick.x,
      brick.y,
      brick.level,
      {
        fontFamily: 'Monaco, Courier, monospace',
        fontSize: '16px',
        fill: '#fff',
      }
    )
    brick.text.setOrigin(0.5); // 设置文字居中

    brick.tween = this.tweens.add({
      targets: brick,
      paused: true,
      duration: 100,
      y: '-=5',
      repeat: 0,
      yoyo: true,
      ease: 'Bounce.easeInOut',
    });
  });

  // 添加砖块组2
  yellowBricks = this.physics.add.group({
    key: 'brick2',
    repeat: Math.floor((gameWidth - (brickConfig.width * 2)) / (brickConfig.width + brickConfig.space)), // 砖块数量, 本身自带1个
    setXY: {
      x: brickConfig.width, // 砖块初始X位置
      y: brickConfig.height * 2 + brickConfig.space, // 砖块初始Y位置
      stepX: brickConfig.width + brickConfig.space // x轴上重复的砖块之间的像素长度
    },
    immovable: true,
  });
  yellowBricks.getChildren().forEach((brick, idx, arr) => {
    brick.level = Phaser.Math.Between(1, 5); // 设置砖块等级

    brick.text = this.add.text(
      brick.x,
      brick.y,
      brick.level,
      {
        fontFamily: 'Monaco, Courier, monospace',
        fontSize: '16px',
        fill: '#333',
      }
    )
    brick.text.setOrigin(0.5); // 设置文字居中

    brick.tween = this.tweens.add({
      targets: brick,
      paused: true,
      duration: 300,
      y: '-=5',
      repeat: 0,
      yoyo: true,
      ease: 'Bounce.easeInOut',
    });
  });

  // 添加砖块组3
  redBricks = this.physics.add.group({
    key: 'brick3',
    repeat: Math.floor((gameWidth - (brickConfig.width * 2)) / (brickConfig.width + brickConfig.space)), // 砖块数量, 本身自带1个
    setXY: {
      x: brickConfig.width, // 砖块初始X位置
      y: brickConfig.height * 3 + brickConfig.space * 2, // 砖块初始Y位置
      stepX: brickConfig.width + brickConfig.space // x轴上重复的砖块之间的像素长度
    },
    immovable: true,
  });
  redBricks.getChildren().forEach((brick, idx, arr) => {
    brick.level = Phaser.Math.Between(1, 5); // 设置砖块等级

    brick.text = this.add.text(
      brick.x,
      brick.y,
      brick.level,
      {
        fontFamily: 'Monaco, Courier, monospace',
        fontSize: '16px',
        fill: '#fff',
      }
    )
    brick.text.setOrigin(0.5); // 设置文字居中

    brick.tween = this.tweens.add({
      targets: brick,
      paused: true,
      duration: 300,
      y: '-=5',
      repeat: 0,
      yoyo: true,
      ease: 'Bounce.easeInOut',
    });
  });

  // 开启键盘输入
  cursors = this.input.keyboard.createCursorKeys();
  customKeys = this.input.keyboard.addKeys('ENTER'); // 创建自定义按键对象

  // 禁止游戏世界底部的碰撞检测
  world.checkCollision.down = false;

  // 绑定球与砖块的碰撞事件
  this.physics.add.collider(ball, violetBricks, hitBrick, null, this);
  this.physics.add.collider(ball, yellowBricks, hitBrick, null, this);
  this.physics.add.collider(ball, redBricks, hitBrick, null, this);

  // 绑定球与拍子的碰撞事件
  this.physics.add.collider(ball, player, hitPlayer, null, this);


  // 添加游戏开始文字
  openingText = this.add.text(
    world.bounds.width / 2,
    world.bounds.height / 2,
    '请按下空格开始游戏',
    {
      fontFamily: 'Arial',
      fontSize: '50px',
      fill: '#fff',
      boundsAlignV: 'millde',
    }
  )
  openingText.setShadow(3, 3, '#999', 2);
  openingText.setOrigin(0.5); // 设置文字居中

  // 添加游戏结束文字
  gameOverText = this.add.text(
    world.bounds.width / 2,
    world.bounds.height / 2,
    '游戏结束, 按下回车重新开始',
    {
      fontFamily: 'Arial',
      fontSize: '50px',
      fill: '#fff'
    }
  )
  gameOverText.setShadow(3, 3, '#f40', 2);
  gameOverText.setOrigin(0.5);
  gameOverText.setVisible(false); // 初始隐藏

  // 添加游戏胜利文字
  playerWonText = this.add.text(
    world.bounds.width / 2,
    world.bounds.height / 2,
    '你赢了, 按下回车重新开始',
    {
      fontFamily: 'Arial',
      fontSize: '50px',
      fill: '#fff'
    }
  )
  playerWonText.setShadow(3, 3, '#0f6', 2);
  playerWonText.setOrigin(0.5);
  playerWonText.setVisible(false);

  // 添加buff组
  activeBuffs = this.physics.add.group();
  this.physics.add.overlap(player, activeBuffs, hitBuff, null, this);
}

// 砖块被击中
function hitBrick(ball, brick) {
  brick.tween.play(); // 播放砖块的动画

  // 砖块等级等于1或小于等于球等级，则砖块消失
  if (brick.level === 1 || brick.level <= ball.level) {
    const isShowBuff = Math.random() > 0.5; // 随机生成buff
    if (isShowBuff) {
      const buffIndex = Math.floor(Math.random() * buffsConfig.children.length); // 随机buff索引
      console.log("🚀 ~ hitBrick ~ buffIndex:", buffIndex);
      const buff = activeBuffs.create(brick.x, brick.y, 'buffs');
      buff.setScale(0.5);
      buff.setFrame(buffIndex);
      // 物理设置
      this.physics.world.enable(buff);
      buff.body.setGravityY(buffsConfig.gravity);
      buff.body.setCollideWorldBounds(false);
      buff.setData('buffConfig', buffsConfig.children[buffIndex]);
      // 旋转动画
      this.tweens.add({
        targets: buff,
        angle: 360,
        duration: 1000,
        repeat: -1
      });
    }
    brick.text.destroy(); // 销毁砖块等级文字
    brick.disableBody(true, true); // 禁止砖块运动
  } else {
    brick.level -= ball.level;
    brick.text.setText(brick.level); // 更新砖块等级文字
  }

  ball.setVelocityY(ballConfig.speed);
  ball.level = Phaser.Math.Between(ballConfig.level, ballConfig.levelMax); // 球等级为1-5之间的随机数
  ball.text.setText(ball.level); // 更新球等级文字

  // 给球随机加X速度
  if (ball.body.velocity.x === 0) {
    const randNum = Math.random();

    if (randNum >= 0.5) {
      ball.setVelocityX(ballConfig.speed * randNum);
    } else {
      ball.setVelocityX(-ballConfig.speed * randNum);
    }
  }
}

// 拍子被击中
function hitPlayer(ball, player) {
  // 在球反弹后增加其速度
  ball.setVelocityY(-ballConfig.speed);

  const randNum = Math.random();
  // 让球在拍子的左右边缘反弹
  if (ball.x < player.x) {
    ball.setVelocityX(-ballConfig.speed * randNum);
  } else {
    ball.setVelocityX(ballConfig.speed * randNum);
  }
}

// buff被击中
function hitBuff(player, buff) {
  const config = buff.getData('buffConfig');
  const role = config.texture.indexOf('ball') > -1 ? ball : player;
  const effect = config.effect(role);

  // 立即生效型
  if (effect.duration <= 0) return;

  // 持续时间型
  const buffKey = Symbol(config.texture);
  currentBuffs.set(buffKey, effect);

  // 定时移除
  this.time.delayedCall(effect.duration, () => {
    effect.revert();
    currentBuffs.delete(buffKey);
  });
  buff.destroy(); // 销毁技能
}

// 游戏是否结束
function isGameOver(world) {
  return ball.body.y > world.bounds.height;
}

// 游戏是否胜利
function isWon() {
  return violetBricks.countActive() + yellowBricks.countActive() + redBricks.countActive() === 0;
}

// 更新游戏
function update() {
  const world = this.physics.world;

  // 如果没有按键，拍子就会保持静止
  player.setVelocityX(0);

  ball.text.setX(ball.x); // 设置球等级文字的位置
  ball.text.setY(ball.y); // 设置球等级文字的位置
  ball.text.setOrigin(0.5); // 设置文字居中

  activeBuffs.getChildren().forEach(obj => {
    // 检测是否超出世界底部边界
    if (obj.y > world.bounds.height || isGameOver(world) || isWon()) {
      // 安全销毁对象
      if (obj.body) world.disable(obj);
      obj.destroy();
    }
  });

  // 游戏是否进行
  if (isGameOver(world)) {
    gameOverText.setVisible(true); // 显示游戏结束文字
    ball.disableBody(true, true); // 禁止球运动
    gameStarted = false; // 游戏结束
    if (customKeys.ENTER.isDown) {
      this.registry.destroy(); // 销毁游戏对象
      this.events.off(); // 解绑事件
      this.scene.restart(); // 重新开始游戏
    }
  } else if (isWon()) {
    playerWonText.setVisible(true); // 显示游戏胜利文字
    ball.disableBody(true, true);
    gameStarted = false;
    if (customKeys.ENTER.isDown) {
      this.registry.destroy(); // 销毁游戏对象
      this.events.off(); // 解绑事件
      this.scene.restart(); // 重新开始游戏
    }
  } else {
    // 控制左右按键，让拍子动起来
    if (cursors.left.isDown) {
      player.setVelocityX(-playerConfig.speed);
    } else if (cursors.right.isDown) {
      player.setVelocityX(playerConfig.speed);
    }

    // 控制空格键，让球开始运动
    if (!gameStarted) {
      ball.setX(player.x);

      if (cursors.space.isDown) {
        gameStarted = true; // 开始游戏
        ball.setVelocityY(-ballConfig.speed); // 让球以设置速度向上飞起
        openingText.setVisible(false); // 隐藏游戏开始文字
      }
    }

  }

}
