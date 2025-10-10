(() => {
  // DOM Elements
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const template = document.getElementById("game-over-template");

  // Local storage
  const BEST_KEY = "meteor_best";
  let best = parseInt(localStorage.getItem(BEST_KEY)) || 0;
  bestEl.textContent = best;

  // Resize canvas
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resize);
  resize();

  // Game state
  let score = 0;
  let running = true;

  // Ship
  const ship = {
    x: canvas.width / 2,
    y: canvas.height - 80,
    size: 30,
    speed: 8,
  };

  // Objects
  const meteors = [];
  const stars = [];

  // Timers
  let meteorTimer = 0;
  let starTimer = 0;
  const meteorInterval = 30;   // frames
  const starInterval = 180;    // frames

  // Input
  const keys = {};
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
    }
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
  });

  // Draw ship (triangle)
  function drawShip() {
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.beginPath();
    ctx.moveTo(0, -ship.size);
    ctx.lineTo(-ship.size, ship.size);
    ctx.lineTo(ship.size, ship.size);
    ctx.closePath();
    ctx.fillStyle = "#00ffff";
    ctx.fill();
    ctx.strokeStyle = "#008888";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // Spawn meteor
  function spawnMeteor() {
    const x = Math.random() * canvas.width;
    meteors.push({
      x,
      y: -20,
      size: 20 + Math.random() * 30,
      speed: 3 + Math.random() * 5,
    });
  }

  // Spawn star
  function spawnStar() {
    const x = Math.random() * canvas.width;
    stars.push({
      x,
      y: -10,
      size: 10,
      speed: 4,
    });
  }

  // Draw meteors
  function drawMeteors() {
    ctx.fillStyle = "#ff5733";
    meteors.forEach((m) => {
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fill();

      // Add glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ff5733";
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  // Draw stars
  function drawStars() {
    ctx.fillStyle = "#ffff33";
    stars.forEach((s) => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();

      // Twinkle effect
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#ffff33";
      ctx.fill();
      ctx.shadowBlur = 0;
    });
  }

  // Move objects
  function moveObjects(dt) {
    const factor = dt * 60;
    meteors.forEach((m) => (m.y += m.speed * factor));
    stars.forEach((s) => (s.y += s.speed * factor));
  }

  // Move ship
  function moveShip() {
    if (keys["ArrowLeft"] && ship.x - ship.size > 0) {
      ship.x -= ship.speed;
    }
    if (keys["ArrowRight"] && ship.x + ship.size < canvas.width) {
      ship.x += ship.speed;
    }
  }

  // Collision detection
  function detectCollisions() {
    // Meteor collision
    for (let i = 0; i < meteors.length; i++) {
      const m = meteors[i];
      const dx = m.x - ship.x;
      const dy = m.y - ship.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < m.size + ship.size - 10) {
        endGame();
        return;
      }
    }

    // Star collection
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      const dx = s.x - ship.x;
      const dy = s.y - ship.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < s.size + ship.size) {
        score += 5;
        scoreEl.textContent = score;
        stars.splice(i, 1);
      }
    }
  }

  // Clean off-screen objects
  function cleanObjects() {
    for (let i = meteors.length - 1; i >= 0; i--) {
      if (meteors[i].y > canvas.height + 40) {
        meteors.splice(i, 1);
        score++;
        scoreEl.textContent = score;
      }
    }
    for (let i = stars.length - 1; i >= 0; i--) {
      if (stars[i].y > canvas.height + 20) {
        stars.splice(i, 1);
      }
    }
  }

  // Main update loop
  let lastTime = performance.now();
  function gameLoop(timestamp) {
    if (!running) return;

    const dt = Math.min(0.034, (timestamp - lastTime) / 1000);
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update
    moveShip();
    moveObjects(dt);
    detectCollisions();
    cleanObjects();

    // Spawn
    meteorTimer += dt * 60;
    starTimer += dt * 60;

    if (meteorTimer >= meteorInterval) {
      spawnMeteor();
      meteorTimer = 0;
    }

    if (starTimer >= starInterval) {
      spawnStar();
      starTimer = 0;
    }

    // Render
    drawMeteors();
    drawStars();
    drawShip();

    requestAnimationFrame(gameLoop);
  }

  // End game
  function endGame() {
    running = false;
    if (score > best) {
      best = score;
      localStorage.setItem(BEST_KEY, best);
      bestEl.textContent = best;
    }

    // Show modal
    const frag = document.importNode(template.content, true);
    frag.getElementById("final-score").textContent = score;
    frag.getElementById("final-best").textContent = best;
    frag.getElementById("restart-button").onclick = () => {
      document.body.removeChild(modal);
      restartGame();
    };
    const modal = frag.querySelector(".overlay");
    document.body.appendChild(modal);
  }

  // Restart game
  function restartGame() {
    score = 0;
    meteors.length = 0;
    stars.length = 0;
    meteorTimer = 0;
    starTimer = 0;
    ship.x = canvas.width / 2;
    scoreEl.textContent = score;
    running = true;
    requestAnimationFrame(gameLoop);
  }

  // Start
  requestAnimationFrame(gameLoop);
})();
