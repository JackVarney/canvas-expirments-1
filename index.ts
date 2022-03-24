// Import stylesheets
import './style.css';

// Write TypeScript code!
import SimplexNoise from 'simplex-noise';

const width = window.outerWidth;
const height = window.innerHeight;

let simplex = new SimplexNoise();
const hsla = (h: number, s: number, l: number, a: number) =>
  `hsl(${h}, ${s}%, ${l}%, ${a})`;
const rgba = (r: number, g: number, b: number, a: number) =>
  `rgba(${r}, ${g}, ${b}, ${a})`;
const lerp = (v0: number, v1: number, t: number) => v0 * (1 - t) + v1 * t;

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.width = width;
canvas.height = height;

const ctx = canvas.getContext('2d');
ctx.fillStyle = rgba(0, 0, 0, 0.1);
ctx.fillRect(0, 0, width, height);

// modify these to change render
const constants = Object.freeze({
  count: 125, // increasing this can cause browser to crash
  margin: width * 0.1, // * max 1
  blur: 0.1, // max 1
  pointWidth: 20,
  pointHeight: 20,
  alterationIncremation: 0.5,
});

let pointsState = createPointsState();
const globalState = {
  alpha: 0,
  alteration: 0,
  carnage: false,
};

function createPointsState() {
  const { count } = constants;

  const rotation = 0;
  const points: {
    h: number;
    x: number;
    y: number;
    r: number;
  }[] = [];
  for (let x = 0; x < count; x += 1) {
    for (let y = 0; y < count; y += 1) {
      const defaultHue = (count - y) * (360 / 100);

      points.push({
        h: defaultHue,
        x: x / count,
        y: y / count,
        r: 0,
      });
    }
  }

  return {
    rotation,
    points: points.filter(() => Boolean(Math.random() > 0.8)),
  };
}

function setState() {
  if (globalState.alpha < 1) {
    globalState.alpha += 0.01;
  }
  const userAlteration = globalState.alteration / 20000;

  pointsState.points.forEach((point) => {
    const noise = simplex.noise2D(point.x * point.x, point.y * point.y);

    point.h += 1;
    point.x = userAlteration === 0 ? point.x : point.x + noise * userAlteration;
    point.y = userAlteration === 0 ? point.y : point.y + noise * userAlteration;

    if (globalState.carnage) {
      point.r = userAlteration === 0 ? point.r : point.r + noise;
    }
  });
}

function cleanSlate() {
  let blur = constants.blur;

  if (globalState.alteration === 0) {
    blur *= 2;
  }

  ctx.fillStyle = rgba(255, 255, 255, blur);
  ctx.fillRect(0, 0, width, height);
}

function renderGrid() {
  const { margin } = constants;
  ctx.save();

  pointsState.points.forEach(({ x, y, r, h }) => {
    ctx.rotate(r * r);

    ctx.fillStyle = hsla(h, 75, 80, globalState.alpha);
    ctx.fillRect(
      lerp(margin, width - margin, x),
      lerp(margin, height - margin, y),
      constants.pointWidth,
      constants.pointHeight
    );
  });

  ctx.restore();
}

function render() {
  setState();
  cleanSlate();
  renderGrid();

  window.requestAnimationFrame(render);
}
window.requestAnimationFrame(render);

(() => {
  const firstButtons = document.getElementById('first-buttons');
  const secondButtons = document.getElementById('second-buttons');
  const reverseButton = document.getElementById('reverse-button');
  const plusButton = document.getElementById('plus-button');
  const minusButton = document.getElementById('minus-button');
  const carnageButton = document.getElementById('carnage-button');
  const pauseButton = document.getElementById('pause-button');
  const restartButton = document.getElementById('restart-button');

  secondButtons.classList.add('hidden');

  plusButton.onclick = () => {
    globalState.alteration = constants.alterationIncremation;
    firstButtons.classList.add('hidden');
    secondButtons.classList.remove('hidden');
  };

  minusButton.onclick = () => {
    globalState.alteration = -constants.alterationIncremation;
    firstButtons.classList.add('hidden');
    secondButtons.classList.remove('hidden');
  };

  reverseButton.onclick = () => {
    reverseButton.innerHTML = reverseButton.innerHTML === '⏩' ? '⏪' : '⏩';

    globalState.alteration = -globalState.alteration;
  };

  pauseButton.onclick = () => {
    pauseButton.innerHTML = pauseButton.innerHTML === '▶️' ? '⏸' : '▶️';

    globalState.alteration =
      globalState.alteration === 0 ? constants.alterationIncremation : 0;
  };

  carnageButton.onclick = () => {
    globalState.carnage = true;
  };

  restartButton.onclick = () => {
    globalState.carnage = false;
    simplex = new SimplexNoise();
    pointsState = createPointsState();
    globalState.alteration = 0;

    firstButtons.classList.remove('hidden');
    secondButtons.classList.add('hidden');
  };
})();
