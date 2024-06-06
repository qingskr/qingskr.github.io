// 宇宙特效
"use strict";
var canvas = document.getElementById('canvas'),
  ctx = canvas.getContext('2d'),
  w = canvas.width = window.innerWidth,
  h = canvas.height = window.innerHeight,
  hue = 217,
  stars = [],
  count = 0,
  maxStars = w; // 星星数量
canvas.height = window.innerHeight / 10 * 6;
var canvas2 = document.createElement('canvas'),
  ctx2 = canvas2.getContext('2d');
  canvas2.width = 100;
  canvas2.height = 100;
var half = canvas2.width / 2,
  gradient2 = ctx2.createRadialGradient(half, half, 0, half, half, half);
gradient2.addColorStop(0.025, '#CCC');
gradient2.addColorStop(0.1, 'hsl(' + hue + ', 61%, 33%)');
// gradient2.addColorStop(0.25, 'hsl(' + hue + ', 64%, 6%)');
gradient2.addColorStop(1, 'transparent');

ctx2.fillStyle = gradient2;
ctx2.beginPath();
ctx2.arc(half, half, half, 0, Math.PI * 2);
ctx2.fill();

function random(min, max) {
  if (arguments.length < 2) {
    max = min;
    min = 0;
  }

  if (min > max) {
    var hold = max;
    max = min;
    min = hold;
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function maxOrbit(x, y) {
  var max = Math.max(x, y),
    diameter = Math.round(Math.sqrt(max * max + max * max));
  return diameter / 2;
  //星星移动范围，值越大范围越小，
}

var Star = function() {
  this.orbitRadius = random(maxOrbit(w, h));
  this.radius = random(60, this.orbitRadius) / 18;
  // 星星大小
  this.orbitX = w / 2;
  this.orbitY = h / 2;
  this.timePassed = random(0, maxStars);
  this.speed = random(this.orbitRadius) / 500000;
  //星星移动速度
  this.alpha = random(2, 10) / 10;

  count++;
  stars[count] = this;
}

Star.prototype.draw = function () {
  var x = Math.sin(this.timePassed) * this.orbitRadius + this.orbitX,
    y = Math.cos(this.timePassed) * this.orbitRadius + this.orbitY,
    twinkle = random(10);

  if (twinkle === 1 && this.alpha > 0) {
    this.alpha -= 0.05;
  } else if (twinkle === 2 && this.alpha < 1) {
    this.alpha += 0.05;
  }

  ctx.globalAlpha = this.alpha;
  ctx.drawImage(canvas2, x - this.radius / 2, y - this.radius / 2, this.radius, this.radius);
  // this.timePassed += this.speed;
}

for (var i = 0; i < maxStars; i++) {
  new Star();
}

const startDate = new Date('2024/06/04 00:00:00').getTime();
const countdownDays = document.querySelector('.countdown__days .number');
const countdownHours = document.querySelector('.countdown__hours .number');
const countdownMinutes = document.querySelector('.countdown__minutes .number');
const countdownSeconds = document.querySelector('.countdown__seconds .number');
let prevDate = 0;
function fillTime(num) {
  if (num < 10) {
    return '0' + num;
  } else {
    return num;
  }
}

function animation() {
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.5; // 尾巴
  ctx.fillStyle = 'hsla(' + hue + ', 64%, 6%, 2)';
  ctx.fillRect(0, 0, w, h);

  ctx.globalCompositeOperation = 'lighter';
  ctx.clearRect(0, 0, w, h); // 清除上一帧
  for (var i = 1, l = stars.length; i < l; i++) {
    stars[i].draw();
  };

  const currentDate = new Date().getTime();
  if (prevDate === 0 || currentDate - prevDate > 1000) {
    prevDate = currentDate;
    const diff = currentDate - startDate;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    countdownDays.innerHTML = fillTime(days);
    countdownHours.innerHTML = fillTime(hours);
    countdownMinutes.innerHTML = fillTime(minutes);
    countdownSeconds.innerHTML = fillTime(seconds);
  }

  window.requestAnimationFrame(animation);
}

window.addEventListener('resize', function () {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  canvas.height = window.innerHeight / 10 * 6;
});

animation();
