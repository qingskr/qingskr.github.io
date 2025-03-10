const gameWidth = window.innerWidth;
const gameHeight = window.innerHeight;

function isMobile() {
  var userAgent = navigator.userAgent;
  return /Mobile/i.test(userAgent);
}

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

const game = new Phaser.Game(gameConfig);

let world, player, balls, bricks, cursors, customKeys, activeBuffs, bgMusic, sfx;

let gameStartText, gameOverText, playerWonText, currentScoreText, currentLivesText;

// 游戏是否启动
let gameStarted = false;

// 玩家当前生效的BUFF
let currentBuffs = new Map();

// 玩家当前分数
let currentScore = 0;

// 玩家当前生命数
let currentLives = 3;

// buff文本对象池
const buffTextPool = [];

// 定义拍子配置
const playerConfig = {
  key: 'paddleJing', // 砖块key
  width: 128, // 宽度
  height: 32, // 高度
  speed: 600, // 速度
}

// 定义球配置
const ballConfig = {
  key: 'ballVip', // 砖块key
  width: 32, // 宽度
  height: 32, // 高度
  speed: 450, // 速度
  bounce: 1, // 反弹系数
  level: 1, // 初始等级
  levelMax: 5, // 最大等级
}

// if (isMobile()) {
//   ballConfig.speed = 600;
// }

// 定义砖块配置
const brickConfig = {
  key: 'block', // 砖块key
  width: 64, // 宽度
  height: 32, // 高度
  space: 23, // 间距
  level: 1, // 初始等级
  levelMax: 7, // 最大等级
  score: 1, // 分值
  scoreMax: 10, // 最大分值
  colors: [0x2BA4CF, 0x7451C9, 0xF25DA2, 0xFFC30C, 0xFC7417, 0xEC283B, 0x82D523], // 颜色
  rows: 3, // 行数
  cols: Math.floor((gameWidth - (64 * 2)) / (64 + 23)), // 列数
}

// 调整球的速度
function adjustBallVelocity(isAdd) {
  balls.getChildren().forEach(obj => {
    if (obj.body) {
      if (isAdd) {
        obj.setVelocity(
          obj.body.velocity.x * 2,
          obj.body.velocity.y * 2
        );
      } else {
        obj.setVelocity(
          obj.body.velocity.x / 2,
          obj.body.velocity.y / 2
        );
      }
    }
  });
}

// 调整球的缩放
function adjustBallScale(scale) {
  balls.getChildren().forEach(obj => {
    obj.setScale(scale);
  });
}

// 更新生命数
function updateLives(isAdd) {
  if (isAdd) {
    currentLives++;
  } else {
    currentLives--;
  }
  currentLivesText.setText(`生命数: ${currentLives}`);
}

// 定义BUFF配置
const buffsConfig = {
  width: 64.5, // 宽度
  height: 92, // 高度
  gravity: 150, // 重力
  children: [
    {
      name: '球加速度',
      texture: 'ball-velocity-add',
      effect: () => {
        ballConfig.speed *= 2;
        adjustBallVelocity(true);
        return {
          duration: 5000, revert: () => {
          ballConfig.speed /= 2;
          adjustBallVelocity(false);
        }};
      },
    },
    {
      name: '拍子加速度',
      texture: 'player-speed-add',
      effect: () => {
        playerConfig.speed *= 2;
        return {duration: 5000, revert: () => playerConfig.speed /= 2};
      },
    },
    {
      name: '球变大',
      texture: 'ball-scale-add',
      effect: () => {
        adjustBallScale(2);
        return {duration: 5000, revert: () => adjustBallScale(1)};
      },
    },
    {
      name: '拍子变长',
      texture: 'player-scale-add',
      effect: (player) => {
        player.setScale(2, 0.5);
        return {duration: 5000, revert: () => player.setScale(1, 0.5)};
      },
    },
    {
      name: '球分裂',
      texture: 'ball-copy',
      effect: (balls) => {
        balls.getChildren().forEach((b) => {
          copyBall(balls, b, 2);
        });
        return {duration: 16, revert: () => {}};
      },
    },
    {
      name: '生命数加一',
      texture: 'player-lives-add',
      effect: () => {
        updateLives(true);
        return {duration: 16, revert: () => {}};
      },
    },
    {
      name: '球减速度',
      texture: 'ball-velocity-subtract',
      effect: () => {
        ballConfig.speed /= 2;
        adjustBallVelocity(false);
        return {
          duration: 5000, revert: () => {
          ballConfig.speed *= 2;
          adjustBallVelocity(true);
        }};
      },
    },
    {
      name: '拍子减速度',
      texture: 'player-speed-subtract',
      effect: () => {
        playerConfig.speed /= 2;
        return {duration: 5000, revert: () => playerConfig.speed *= 2};
      },
    },
    {
      name: '砖块等级加一',
      texture: 'brick-level-add',
      effect: () => {
        bricks.getChildren().forEach((b) => {
          if (b.level < 7) {
            b.level++;
            // b.levelText.setText(b.level.toString());
            b.setTint(brickConfig.colors[b.level - 1]);
          }
        });
        return {duration: 16, revert: () => {}};
      },
    },
    {
      name: '生命数减一',
      texture: 'player-lives-subtract',
      effect: () => {
        updateLives(false);
        return {duration: 16, revert: () => {}};
      },
    },
    {
      name: '球变小',
      texture: 'ball-scale-subtract',
      effect: () => {
        adjustBallScale(0.5);
        return {duration: 5000, revert: () => adjustBallScale(1)};
      },
    },
    {
      name: '拍子变短',
      texture: 'player-scale-subtract',
      effect: (player) => {
        player.setScale(0.5, 0.5);
        return {duration: 5000, revert: () => player.setScale(1, 0.5)};
      },
    },
  ]
}

// 预加载资源
function preload() {
  // 加载音频文件
  this.load.audio('bgm', ['assets/audio/bgm.mp3']);
  this.load.audio('hit', 'assets/audio/hit.wav');
  this.load.audio('point', 'assets/audio/point.wav');
  this.load.audio('wing', 'assets/audio/wing.wav');
  this.load.audio('success', 'assets/audio/success.mp3');
  this.load.audio('fail', 'assets/audio/fail.mp3');

  this.load.image('bg', 'assets/images/bg2.jpg');
  this.load.image('bg1', 'assets/images/bg1.jpg');
  this.load.image('bg2', 'assets/images/bg2.jpg');
  this.load.image('ball', 'assets/images/ball_32_32.png');
  this.load.image('ballBu', 'assets/images/ball_bu_32_32.png');
  this.load.image('ballVip', 'assets/images/ball_vip_32_32.png');
  this.load.image('brick1', 'assets/images/brick1_64_32.png');
  this.load.image('brick2', 'assets/images/brick2_64_32.png');
  this.load.image('brick3', 'assets/images/brick3_64_32.png');
  this.load.image('paddle', 'assets/images/paddle_128_32.png');
  this.load.image('paddleJing', 'assets/images/paddle_jing_128_32.png');
  this.load.spritesheet({
    key: 'buffs',       // 纹理集标识符 (必填)
    url: 'assets/images/buffs_258_275.png', // 图片路径 (必填)
    frameConfig: {       // 帧配置对象 (必填)
      frameWidth: buffsConfig.width,  // 单帧的像素宽度 (必填)
      frameHeight: buffsConfig.height, // 单帧的像素高度 (必填)
      startFrame: 0,   // 起始帧索引（从 0 开始）
      endFrame: 11,     // 结束帧索引（根据图集尺寸自动计算）
      // margin: 0,       // 图片外边框 (像素)
      // spacing: 0,      // 帧间距 (像素)
      // skipFrames: 0    // 跳过指定数量帧 (3.55新增)
    }
    // xhrSettings?: XHRSettingsObject  // 高级网络请求配置
  });
  this.load.image('block1', 'assets/images/block.png');
  this.load.image('block', 'assets/images/block_64_32.png');
}

// 创建游戏球
function createBall(group) {
  const ball = group.create(gameWidth / 2, player.y - playerConfig.height + player.body.halfHeight * 0.5, ballConfig.key);
  ball.setCollideWorldBounds(true); // 设置防止球出界
  ball.setBounce(ballConfig.bounce); // 设置弹性系数
  ball.level = ballConfig.level; // 设置球等级
}

// 复制游戏球
function copyBall(group, b, num) {
  for (let i = 0; i < num; i++) {
    const r = Phaser.Math.RND.integerInRange(ballConfig.width / 4, ballConfig.width);
    const ball = group.create(b.x + r, b.y + r, b.texture.key);
    ball.setScale(b.scaleX, b.scaleY); // 设置球缩放
    ball.setCollideWorldBounds(true); // 设置防止球出界
    ball.level = b.level; // 设置球等级

    // 复制物理属性
    if (b.body) {
      ball.setBounce(
        b.body.bounce.x,
        b.body.bounce.y
      );
      ball.body.setVelocity(
        b.body.velocity.x,
        b.body.velocity.y
      );
      ball.body.setAllowGravity(b.body.allowGravity);
      ball.body.setSize(
        b.body.width,
        b.body.height
      );
    }
  }
}

// 创建游戏砖0
function createBricks(_this, group) {
  for (let j = 0; j < brickConfig.rows; j++) {
    const posY = brickConfig.height + brickConfig.height * j + 10 + brickConfig.space * j;
    // const color = Phaser.Math.RND.pick(brickConfig.colors);

    for (let i = 0; i <= brickConfig.cols; i++) {
      const posX = brickConfig.width + brickConfig.width * i + brickConfig.space * i;
      const b = group.create(posX, posY, brickConfig.key, 0, true, true, 10, 10, 10, 10);
      // 设置砖块分数
      b.score = Phaser.Math.RND.integerInRange(brickConfig.score, brickConfig.scoreMax);
      // 设置砖块等级
      b.level = Phaser.Math.Between(brickConfig.level, brickConfig.levelMax);
      // 设置砖块层级
      b.setDepth(1);
      // 设置砖块等级文字
      // b.levelText = _this.add.text(
      //   b.x,
      //   b.y,
      //   b.level,
      //   {
      //     fontFamily: 'Monaco, Courier, monospace',
      //     fontSize: '16px',
      //     fill: '#333',
      //   }
      // );
      // b.levelText.setDepth(2);
      // b.levelText.setOrigin(0.5);
      // b.levelText.setText(b.level.toString());
      // 设置砖块颜色
      const color = brickConfig.colors[b.level - 1];
      b.setTint(color);
      // 设置砖块动画: 往上跳动
      b.animation = _this.tweens.add({
        targets: b,
        paused: true, // 开始时暂停
        duration: 100, // 持续时间
        y: '-=5', // 移动距离
        repeat: 0, // 重复次数
        yoyo: true, // 反转
        ease: 'Bounce.easeInOut',
      });
    }
  }
}

// 创建游戏文字
function createGameText(_this, text, color, isShow) {
  const gameText = _this.add.text(
    world.bounds.width / 2,
    world.bounds.height / 2,
    text,
    {
      fontFamily: 'Arial',
      fontSize: '3em',
      fill: '#fff',
    }
  );
  gameText.setShadow(3, 3, color, 2);
  gameText.setOrigin(0.5); // 设置文字居中
  gameText.setVisible(isShow); // 显示或隐藏文字

  return gameText;
}

// 创建游戏对象
function create() {
  world = this.physics.world;

  // 开启键盘输入
  cursors = this.input.keyboard.createCursorKeys();

  // 创建自定义按键对象
  customKeys = this.input.keyboard.addKeys('ENTER');

  // 隐藏鼠标光标
  this.input.setDefaultCursor('none');

  // 初始化背景音乐（自动选择最佳格式）
  bgMusic = this.sound.add('bgm', {
    loop: true, // 循环播放
    volume: 0.3, // 设置音量
  });

  // 音效管理器快捷方式
  sfx = this.sound;

  // 添加背景图片
  const bg = this.add.image(0, 0, 'bg1').setOrigin(0, 0);
  bg.displayWidth = gameWidth;
  bg.displayHeight = gameHeight;

  // 添加拍子
  player = this.physics.add.sprite(gameWidth / 2, gameHeight - playerConfig.height, playerConfig.key);
  player.setCollideWorldBounds(true); // 设置防止拍子出界
  player.setImmovable(true); // 设置拍子不可移动
  player.setScale(1, 0.5); // 设置拍子缩放

  // 添加球
  balls = this.physics.add.group({
    immovable: false // 允许相互推动
  });
  createBall(balls);

  // 添加砖块
  bricks = this.physics.add.staticGroup();
  createBricks(this, bricks);

  // 禁止游戏世界底部的碰撞检测
  world.checkCollision.down = false;

  // 绑定球与砖块的碰撞事件
  this.physics.add.collider(balls, bricks, hitBrick, null, this);

  // 绑定球与拍子的碰撞事件
  this.physics.add.collider(player, balls, hitPlayer, null, this);

  // 绑定球与球的碰撞事件
  this.physics.add.collider(balls, balls, null, null, this);

  // 添加游戏开始文字
  gameStartText = createGameText(this, '请按下空格开始游戏', '#999', true);

  // 添加游戏结束文字
  gameOverText = createGameText(this, '挑战失败, 按下回车重新开始', '#f40', false);

  // 添加游戏胜利文字
  playerWonText = createGameText(this, '挑战成功, 按下回车再玩一次', '#0f6', false);

  // 添加buff组
  activeBuffs = this.physics.add.group();
  this.physics.add.overlap(player, activeBuffs, hitBuff, null, this);

  // 添加游戏分数文字
  currentScoreText = this.add.text(
    5,
    world.bounds.height - 25,
    `分数: ${currentScore}`,
    {
      fontFamily: 'Arial',
      fontSize: '20px',
      fill: '#fff'
    }
  );

  // 添加游戏分数文字
  currentLivesText = this.add.text(
    world.bounds.width - 100,
    world.bounds.height - 25,
    `生命数: ${currentLives}`,
    {
      fontFamily: 'Arial',
      fontSize: '20px',
      fill: '#fff'
    }
  );
}

// 创建buff
function createBuff(_this, brick) {
  const buffIndex = Phaser.Math.RND.integerInRange(0, buffsConfig.children.length - 1); // 随机buff索引
  const buff = activeBuffs.create(brick.x, brick.y, 'buffs');
  buff.setScale(0.5);
  buff.setFrame(buffIndex);
  // 物理设置
  world.enable(buff);
  buff.body.setGravityY(buffsConfig.gravity);
  buff.body.setCollideWorldBounds(false);
  buff.setData('buffConfig', buffsConfig.children[buffIndex]);
  // 旋转动画
  _this.tweens.add({
    targets: buff,
    angle: 360,
    duration: 1000,
    repeat: -1
  });
}

// 更新分数
function updateScore(score) {
  currentScore += score; // 加分
  currentScoreText.setText(`分数: ${currentScore}`); // 更新分数文字
}

// 砖块被击中
function hitBrick(ball, brick) {
  brick.animation.play(); // 播放砖块的动画
  sfx.play('hit', { volume: 0.8 });

  // 砖块等级等于1或小于等于球等级，则砖块消失
  if (brick.level === 1 || brick.level <= ball.level) {
    const isShowBuff = Math.random() > 0.5; // 随机生成buff
    if (isShowBuff) {
      createBuff(this, brick);
    }

    updateScore(brick.score * brick.level);

    // brick.levelText.destroy(); // 销毁砖块等级文字
    brick.disableBody(true, true); // 禁止砖块运动
  } else {
    updateScore(brick.score * ball.level);

    brick.level -= ball.level; // 砖块等级减少
    // brick.levelText.setText(brick.level.toString()); // 更新砖块等级文字
    brick.setTint(brickConfig.colors[brick.level - 1]); // 更新砖块颜色
  }

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
function hitPlayer(player, ball) {
  sfx.play('wing', { volume: 0.8 });

  // 在球反弹后增加其速度
  ball.setVelocityY(-ballConfig.speed);
  // 球等级为1-5之间的随机数
  ball.level = Phaser.Math.Between(ballConfig.level, ballConfig.levelMax);

  const randNum = Math.random();
  // 让球在拍子的左右边缘反弹
  if (ball.body.x < player.body.x) {
    ball.body.setVelocityX(-ballConfig.speed * randNum);
  } else {
    ball.body.setVelocityX(ballConfig.speed * randNum);
  }
}

// 显示buff提示
function showBuffTips(_this, text, color = 0xffffff) {
  // 复用对象池中的文本或创建新实例
  const txt = buffTextPool.find(t => !t.active) || createBuffText(_this);

  txt.setText(text)
    .setColor(`#${color.toString(16)}`)
    .setAlpha(1)
    .setPosition(gameWidth / 2, gameHeight / 2) // 屏幕居中
    .setActive(true)
    .setVisible(true);

  // 动画：上浮渐隐
  _this.tweens.add({
    targets: txt,
    y: -10, // 移动到屏幕外
    alpha: 0, // 渐隐
    duration: 1500, // 持续时间
    onComplete: () => {
      txt.setActive(false).setVisible(false); // 重置状态以便复用
    }
  });
}

// 创建可复用的文本对象
function createBuffText(_this) {
  const text = _this.add.text(0, 0, '', {
    fontFamily: 'Arial',
    fontSize: '24px',
    stroke: '#000000',
    strokeThickness: 2
  }).setOrigin(0.5, 0.5)
    .setDepth(1000) // 确保在最顶层
    .setActive(false)
    .setVisible(false);

  buffTextPool.push(text);
  return text;
}

// buff被击中
function hitBuff(player, buff) {
  if (gameStarted) {
    const config = buff.getData('buffConfig');
    const role = config.texture.indexOf('ball') > -1 ? balls : player;
    const effect = config.effect(role);
    console.log("🚀 ~ hitBuff ~ texture:", config.texture);

    showBuffTips(this, config.name);

    sfx.play('point', { volume: 0.8 });

    // 立即生效型
    if (effect.duration <= 0) return;

    // 持续时间型
    const buffKey = Symbol(config.texture);

    currentBuffs.set(buffKey, effect);

    // 定时移除
    effect.timer = this.time.delayedCall(effect.duration, () => {
      effect.revert();
      currentBuffs.delete(buffKey);
    }, [], this);
  }
  buff.destroy(); // 销毁技能
}

// 游戏是否结束
function isGameOver(_this) {
  if (currentLives > 0 && balls.countActive() === 0) {
    gameStarted = false; // 停止游戏
    clearBuffs(_this);
    player.setX(gameWidth / 2);
    player.setY(gameHeight - playerConfig.height);
    createBall(balls);
  }
  return (currentLives === 0 && balls.countActive() === 0) || currentLives < 0;
}

// 游戏是否胜利
function isWon() {
  return bricks.countActive() === 0;
}

// 清空buff组
function clearBuffs(_this) {
  currentBuffs.forEach((obj) => {
    if (obj.timer) {
      obj.revert();
      _this.time.removeEvent(obj.timer);
      obj.timer.remove();
    }
  });
  currentBuffs.clear();
}

// 重置游戏参数
function resetGameParams(_this) {
  gameStarted = false; // 停止游戏
  bgMusic.stop(); // 停止背景音乐
  clearBuffs(_this);
}

// 重新开始游戏
function restart() {
  if (customKeys.ENTER.isDown) {
    // _this.registry.destroy(); // 销毁游戏对象
    // _this.events.off(); // 解绑事件
    // _this.scene.restart(); // 重新开始游戏
    // currentScore = 0; // 重置分数
    // currentScoreText.setText(`分数: ${currentScore}`); // 更新分数文字
    // currentLives = 3; // 重置生命数
    // currentLivesText.setText(`生命数: ${currentScore}`); // 更新生命数文字

    location.reload(); // 刷新页面
  }
}

// 更新游戏
function update() {
  world = this.physics.world;

  // 如果没有按键，拍子就会保持静止
  player.setVelocityX(0);

  balls.getChildren().forEach(obj => {
    // 检测是否超出世界底部边界
    if (obj.y > world.bounds.height || isGameOver(this) || isWon()) {
      if (obj.body) world.disable(obj);
      obj.destroy();
    }
  });

  activeBuffs.getChildren().forEach(obj => {
    // 检测是否超出世界底部边界
    if (obj.y > world.bounds.height || isGameOver(this) || isWon()) {
      // 安全销毁对象
      if (obj.body) world.disable(obj);
      obj.destroy();
    }
  });

  // 游戏是否进行
  if (isWon() && gameStarted) {
    playerWonText.setVisible(true); // 显示游戏胜利文字
    sfx.play('success', { volume: 0.8 }); // 播放成功音效
    resetGameParams(this); // 重置游戏
  } else if (isGameOver(this) && gameStarted) {
    gameOverText.setVisible(true); // 显示游戏结束文字
    sfx.play('fail', { volume: 0.8 }); // 播放失败音效
    resetGameParams(this); // 重置游戏
  } else if (isWon() || isGameOver(this)) {
    restart();
  } else {
    // 控制左右按键，让拍子动起来
    if (cursors.left.isDown) {
      player.setVelocityX(-playerConfig.speed);
    } else if (cursors.right.isDown) {
      player.setVelocityX(playerConfig.speed);
    }

    // 游戏开始
    if (!gameStarted) {
      // 让球跟随拍子移动
      balls.getChildren().forEach(ball => {
        ball.setX(player.x);
      });

      // 控制空格键，让球开始运动
      if (cursors.space.isDown) {
        gameStarted = true; // 开始游戏
        updateLives(false); // 更新生命数文字
        balls.getChildren().forEach(ball => {
          ball.setVelocityY(-ballConfig.speed); // 让球以设置速度向上飞起
        });
        gameStartText.setVisible(false); // 隐藏游戏开始文字
        bgMusic.play(); // 播放背景音乐
      }
    }
  }
}
