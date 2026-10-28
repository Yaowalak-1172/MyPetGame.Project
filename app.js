/* ==========================================
   MY PET GAME - WEB3 FULL JAVASCRIPT
   ใช้กับ ethers.js v6
   ========================================== */

// ==========================================
// 1. WEB3 CONFIG
// ==========================================

const PET_TOKEN_ADDR =
  "0xc310f5fBF788C6839eBf29836c7A899638588dD7";

const REWARD_CONTRACT_ADDR =
  "0xCd5256Dc4Ad30E49EDAc1c78FC66e172062CeE8d";

const SHOP_CONTRACT_ADDR =
  "0x0c7F4CaCC2138880F47182eb94C75585c7396357";

const erc20Abi = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function approve(address,uint256) returns (bool)",
  "function allowance(address,address) view returns (uint256)"
];

const rewardAbi = [
  "function claimMissionReward(uint256) external",
  "function hasCompletedMission(address,uint256) view returns (bool)"
];

const shopAbi = [
  "function buyItem(uint256 itemId) external",
  "function getItemPrice(uint256 itemId) view returns (uint256)",
  "function checkPurchased(address buyer,uint256 itemId) view returns (bool)",
  "function getPurchasedItemCount(address buyer) view returns (uint256)",
  "function getPurchasedItemAt(address buyer,uint256 index) view returns (uint256)"
];

const ITEM_ID_MAP = {
  hat: 1,
  glasses: 2,
  ribbon: 3,
  hoodie: 4,
  bed: 5,
  table: 6,
  frame: 7,
  garden: 8,
  forest: 9,
  beach: 10
};

const ITEM_NAMES = Object.fromEntries(
  Object.entries(ITEM_ID_MAP).map(([name, id]) => [id, name])
);

const ACCESSORIES = ["hat", "glasses", "ribbon", "hoodie"];
const FURNITURE = ["bed", "table", "frame"];
const SCENES = ["garden", "forest", "beach"];

let provider = null;
let signer = null;
let userAddress = null;
let petDecimals = 18;
let purchasing = false;

// ==========================================
// 2. GAME STATE
// ==========================================

let petStats = {
  hunger: 0,
  happiness: 0
};

let m1Count = 0;
let m2Count = 0;
let m3Count = 0;
let m4Count = 0;
let m5Count = 0;

let ownedItems = [];
let equippedAccessory = null;
let equippedScene = null;

let hasBed = false;
let hasTable = false;
let hasFrame = false;

let canvas = null;
let ctx = null;
let animFrame = 0;

let currentPetType = "capybara";
let petState = "idle";

let petPos = { x: 325, y: 300 };
let targetPos = { x: 325, y: 300 };

let ballPos = {
  x: -100,
  y: -100,
  visible: false,
  type: "ball"
};

let foodPos = {
  x: -100,
  y: -100,
  visible: false,
  icon: ""
};

let animationTimer = null;
let isPlayingToy = false;

const DECAY_INTERVAL_MS = 4000;

const petProfiles = {
  cat: {
    name: "น้องแมว",
    icon: "🐱",
    foodIcon: "🥫",
    color: "#ff9f43",
    talkEat: "เมี๊ยว~ อร่อยจัง! (+25 ความอิ่ม)"
  },
  dog: {
    name: "น้องหมา",
    icon: "🐶",
    foodIcon: "🦴",
    color: "#e09f53",
    talkEat: "โฮ่ง! อร่อยมาก! (+25 ความอิ่ม)"
  },
  capybara: {
    name: "คาปิบาร่า",
    icon: "🦫",
    foodIcon: "🍊",
    color: "#965d29",
    talkEat: "ส้มอร่อยมาก! (+25 ความอิ่ม)"
  },
  rabbit: {
    name: "กระต่ายน้อย",
    icon: "🐰",
    foodIcon: "🥕",
    color: "#f7d794",
    talkEat: "กรุบๆ อร่อยจัง! (+25 ความอิ่ม)"
  }
};

const accessoryOffsets = {
  capybara: {
    hat: { x: 18, y: -48, fontSize: "36px" },
    glasses: { x: 26, y: -24, fontSize: "28px" },
    ribbon: { x: -2, y: -42, fontSize: "32px" },
    hoodie: { x: -15, y: 15, fontSize: "40px" }
  },
  cat: {
    hat: { x: -5, y: -72, fontSize: "38px" },
    glasses: { x: -2, y: -28, fontSize: "28px" },
    ribbon: { x: -5, y: -16, fontSize: "30px" },
    hoodie: { x: -18, y: 18, fontSize: "42px" }
  },
  dog: {
    hat: { x: 0, y: -72, fontSize: "38px" },
    glasses: { x: 8, y: -32, fontSize: "28px" },
    ribbon: { x: 0, y: -16, fontSize: "30px" },
    hoodie: { x: -15, y: 18, fontSize: "42px" }
  },
  rabbit: {
    hat: { x: -2, y: -88, fontSize: "36px" },
    glasses: { x: 0, y: -26, fontSize: "28px" },
    ribbon: { x: -18, y: -68, fontSize: "30px" },
    hoodie: { x: -18, y: 18, fontSize: "40px" }
  }
};

// ==========================================
// 3. GENERAL UTILITIES
// ==========================================

function log(message) {
  console.log(message);

  const box = document.getElementById("logs");

  if (box) {
    const line = document.createElement("div");
    line.textContent = "> " + message;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
  }
}

function setSpeech(message) {
  const element = document.getElementById("petSpeech");
  if (element) element.innerText = message;
}

function updateMissionProgress() {
  const values = {
    m1Progress: m1Count,
    m2Progress: m2Count,
    m3Progress: m3Count,
    m4Progress: m4Count,
    m5Progress: Math.min(m5Count, 1)
  };

  Object.entries(values).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.innerText = value;
  });
}

function updateStatsDisplay() {
  const hungerBar = document.getElementById("hungerBar");
  const hungerVal = document.getElementById("hungerVal");
  const happinessBar = document.getElementById("happinessBar");
  const happinessVal = document.getElementById("happinessVal");

  if (hungerBar) hungerBar.style.width = petStats.hunger + "%";
  if (hungerVal) hungerVal.innerText = petStats.hunger + "/100";

  if (happinessBar) {
    happinessBar.style.width = petStats.happiness + "%";
  }

  if (happinessVal) {
    happinessVal.innerText = petStats.happiness + "/100";
  }
}

function checkPetStatus() {
  if (petStats.hunger === 0 && petStats.happiness === 0) {
    setSpeech("หิวมากและเหงามาก! มาดูแลหน่อยสิ 😿");
  } else if (petStats.hunger === 0) {
    setSpeech("หิวแล้วนะ ขออาหารหน่อย 🍖");
  } else if (petStats.happiness === 0) {
    setSpeech("เบื่อจัง มาเล่นกันหน่อย ⚽");
  }
}

function startStatDecay() {
  setInterval(() => {
    petStats.hunger = Math.max(0, petStats.hunger - 3);
    petStats.happiness = Math.max(0, petStats.happiness - 2);

    updateStatsDisplay();
    checkPetStatus();
  }, DECAY_INTERVAL_MS);
}

// ==========================================
// 4. PET ACTIONS
// ==========================================

function feedPet() {
  const profile = petProfiles[currentPetType];

  petState = "eat";

  foodPos = {
    x: petPos.x + 75,
    y: petPos.y + 25,
    visible: true,
    icon: profile.foodIcon
  };

  targetPos.x = petPos.x + 25;

  m1Count++;
  petStats.hunger = Math.min(100, petStats.hunger + 25);

  updateMissionProgress();
  updateStatsDisplay();

  setSpeech(profile.talkEat);
  log("ให้อาหาร " + profile.name);

  setTimeout(() => {
    foodPos.visible = false;
    if (petState === "eat") petState = "idle";
  }, 3000);
}

function startFetch(type, x, message) {
  petState = type;

  ballPos = {
    x,
    y: 340,
    visible: true,
    type: type === "fetch" ? "ball" : "bone"
  };

  targetPos.x = x;

  m2Count++;
  petStats.happiness = Math.min(100, petStats.happiness + 25);

  updateMissionProgress();
  updateStatsDisplay();

  setSpeech(message);
}

function playBall() {
  startFetch("fetch", 500, "เย้! เล่นลูกบอลสนุกจัง ⚽");
}

function fetchItem() {
  startFetch("fetchItem", 140, "วิ่งคาบกระดูกสนุกจัง 🦴");
}

function playCatToy() {
  petState = "catToy";

  ballPos = {
    x: 480,
    y: 260,
    visible: true,
    type: "catToy"
  };

  targetPos.x = 420;

  m2Count++;
  petStats.happiness = Math.min(100, petStats.happiness + 25);

  updateMissionProgress();
  updateStatsDisplay();

  setSpeech("กำลังเล่นไม้ตกแมว 🎣🐟");
}

// ==========================================
// แก้ไข: สั่งนั่งอย่างเดียว ไม่มีสั่งนอน
// ==========================================

function sitPet() {
  petState = "sit";
  targetPos.x = petPos.x;

  setSpeech("นั่งลงเรียบร้อยแล้ว 🐾");

  m4Count++;
  updateMissionProgress();

  log("สั่งสัตว์เลี้ยงนั่ง");
}

function walkPet() {
  petState = "walk";
  targetPos.x = petPos.x > 350 ? 180 : 470;

  m3Count++;
  updateMissionProgress();

  setSpeech("เดินเล่นในบ้านสนุกจัง 🐾");
  log("สัตว์เลี้ยงเดินเล่น");
}

function changePet(type) {
  if (!petProfiles[type]) return;

  currentPetType = type;
  petState = "idle";
  targetPos.x = 325;

  ballPos.visible = false;
  foodPos.visible = false;

  setSpeech("เปลี่ยนเป็น " + petProfiles[type].name + " แล้ว!");
  log("เปลี่ยนสัตว์เลี้ยง: " + type);
}

// ==========================================
// 5. CANVAS ENGINE
// ==========================================

function initCanvas() {
  canvas = document.getElementById("petCanvas");

  if (!canvas) {
    log("ไม่พบ Canvas สำหรับแสดงสัตว์เลี้ยง");
    return;
  }

  ctx = canvas.getContext("2d");

  if (!ctx) return;

  requestAnimationFrame(gameLoop);
}

function drawHouseBackground() {
  const w = canvas.width;
  const h = canvas.height;

  const sceneColors = {
    garden: ["#d7f9d2", "#81c784"],
    forest: ["#b5d8b0", "#5b8c5a"],
    beach: ["#bdefff", "#f5d7a1"]
  };

  if (equippedScene && sceneColors[equippedScene]) {
    const colors = sceneColors[equippedScene];

    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, w, h - 130);

    ctx.fillStyle = colors[1];
    ctx.fillRect(0, h - 130, w, 130);

    ctx.font = "65px sans-serif";

    if (equippedScene === "garden") {
      ctx.fillText("🌳", 45, h - 140);
      ctx.fillText("🌻", w - 130, h - 140);
    }

    if (equippedScene === "forest") {
      ctx.fillText("🌲", 45, h - 140);
      ctx.fillText("🌲", w - 130, h - 140);
    }

    if (equippedScene === "beach") {
      ctx.fillText("🏖️", 40, h - 145);
      ctx.fillText("🌴", w - 130, h - 145);
    }

    return;
  }

  ctx.fillStyle = "#fff3e0";
  ctx.fillRect(0, 0, w, h - 130);

  ctx.fillStyle = "rgba(255,224,178,0.35)";

  for (let x = 0; x < w; x += 40) {
    ctx.fillRect(x, 0, 20, h - 130);
  }

  // หน้าต่าง
  ctx.fillStyle = "#e0f7fa";
  ctx.fillRect(250, 40, 150, 110);

  ctx.strokeStyle = "#8d6e63";
  ctx.lineWidth = 6;
  ctx.strokeRect(250, 40, 150, 110);

  ctx.beginPath();
  ctx.moveTo(325, 40);
  ctx.lineTo(325, 150);
  ctx.moveTo(250, 95);
  ctx.lineTo(400, 95);
  ctx.stroke();

  // ผ้าม่าน
  ctx.fillStyle = "#ffab91";
  ctx.fillRect(238, 35, 15, 120);
  ctx.fillRect(397, 35, 15, 120);

  // พื้นไม้
  ctx.fillStyle = "#d7ccc8";
  ctx.fillRect(0, h - 145, w, 15);

  ctx.fillStyle = "#d7a15c";
  ctx.fillRect(0, h - 130, w, 130);

  ctx.strokeStyle = "#c68642";
  ctx.lineWidth = 2;

  for (let y = h - 130; y < h; y += 26) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // ต้นไม้
  ctx.font = "90px sans-serif";
  ctx.fillText("🪴", w - 150, h - 100);

  if (hasFrame) drawFrame(60, 50, 100, 75);
}

function drawFrame(x, y, w, h) {
  ctx.fillStyle = "#bcaaa4";
  ctx.fillRect(x - 6, y - 6, w + 12, h + 12);

  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = "#56ab2f";

  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w / 2, y + 25);
  ctx.lineTo(x + w, y + h);
  ctx.fill();

  ctx.fillStyle = "#ffa500";
  ctx.beginPath();
  ctx.arc(x + 25, y + 20, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawPetBed(x, y) {
  ctx.fillStyle = "#ff758c";

  ctx.beginPath();
  ctx.ellipse(x, y, 65, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff0f3";

  ctx.beginPath();
  ctx.ellipse(x, y - 4, 50, 18, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawDiningTable(x, y) {
  ctx.fillStyle = "#8d6e63";
  ctx.fillRect(x - 30, y, 8, 30);
  ctx.fillRect(x + 22, y, 8, 30);

  ctx.fillStyle = "#a1887f";

  ctx.beginPath();
  ctx.ellipse(x, y, 42, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "24px sans-serif";
  ctx.fillText("🍽️", x - 12, y - 8);
}

function drawShadow(x, y) {
  ctx.fillStyle = "rgba(0,0,0,0.15)";

  ctx.beginPath();
  ctx.ellipse(x, y + 55, 55, 14, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawLeg(x, y, angle, length, color, width = 14) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-width / 2, 0, width, length, width / 2);
  ctx.fill();

  ctx.restore();
}

function drawEye(x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(
    x - radius / 3,
    y - radius / 3,
    radius / 3,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function drawTriangle(x1, y1, x2, y2, x3, y3, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

function drawNewCapybara(leg1, leg2, state) {
  drawLeg(-35, 32, leg2, 28, "#5c3a17", 16);
  drawLeg(20, 32, leg1, 28, "#5c3a17", 16);

  ctx.fillStyle = "#965d29";
  ctx.beginPath();
  ctx.roundRect(-55, -15, 110, 65, 26);
  ctx.fill();

  drawLeg(-22, 35, leg1, 30, "#965d29", 16);
  drawLeg(35, 35, leg2, 30, "#965d29", 16);

  ctx.save();
  ctx.translate(22, -28);

  if (state === "eat") ctx.rotate(0.2);

  ctx.fillStyle = "#965d29";
  ctx.beginPath();
  ctx.roundRect(-15, -25, 62, 46, 15);
  ctx.fill();

  ctx.fillStyle = "#5c3a17";
  ctx.beginPath();
  ctx.arc(-8, -24, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#2c3e50";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(8, -8);
  ctx.lineTo(20, -8);
  ctx.stroke();

  ctx.fillStyle = "#5c3a17";
  ctx.beginPath();
  ctx.roundRect(33, -6, 15, 18, 4);
  ctx.fill();

  if (equippedAccessory !== "hat") {
    ctx.font = "38px sans-serif";
    ctx.fillText("🍊", 6, -26);
  }

  ctx.restore();
}

function drawNewCat(leg1, leg2, state) {
  ctx.save();
  ctx.translate(-40, 10);
  ctx.rotate(Math.sin(animFrame * 2) * 0.4 - 0.2);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-30, -30, -20, -65);
  ctx.lineWidth = 12;
  ctx.strokeStyle = "#ff9f43";
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();

  drawLeg(-25, 30, leg2, 32, "#ee5253", 14);
  drawLeg(20, 30, leg1, 32, "#ee5253", 14);

  ctx.fillStyle = "#ff9f43";
  ctx.beginPath();
  ctx.ellipse(0, 20, 48, 36, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff5eb";
  ctx.beginPath();
  ctx.ellipse(5, 24, 30, 22, 0, 0, Math.PI * 2);
  ctx.fill();

  drawLeg(-12, 32, leg1, 34, "#ff9f43", 14);
  drawLeg(30, 32, leg2, 34, "#ff9f43", 14);

  ctx.save();
  ctx.translate(15, -30);

  if (state === "eat") ctx.rotate(0.2);

  drawTriangle(-30, -20, -15, -60, 0, -20, "#ff9f43");
  drawTriangle(0, -20, 15, -60, 30, -20, "#ff9f43");

  ctx.fillStyle = "#ff9f43";
  ctx.beginPath();
  ctx.arc(0, -5, 38, 0, Math.PI * 2);
  ctx.fill();

  drawEye(-12, -12, 6, "#2e86de");
  drawEye(14, -12, 6, "#2e86de");

  ctx.fillStyle = "#ff6b6b";
  ctx.beginPath();
  ctx.arc(1, -2, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawNewDog(leg1, leg2, state) {
  ctx.save();
  ctx.translate(-45, 0);
  ctx.rotate(Math.sin(animFrame * 6) * 0.5);

  ctx.fillStyle = "#b8762d";
  ctx.beginPath();
  ctx.ellipse(0, -15, 10, 24, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  drawLeg(-25, 28, leg2, 34, "#b8762d", 15);
  drawLeg(22, 28, leg1, 34, "#b8762d", 15);

  ctx.fillStyle = "#e09f53";
  ctx.beginPath();
  ctx.ellipse(0, 18, 52, 38, 0, 0, Math.PI * 2);
  ctx.fill();

  drawLeg(-15, 32, leg1, 36, "#e09f53", 15);
  drawLeg(30, 32, leg2, 36, "#e09f53", 15);

  ctx.save();
  ctx.translate(20, -32);

  if (state === "eat") ctx.rotate(0.2);

  ctx.fillStyle = "#e09f53";
  ctx.beginPath();
  ctx.arc(0, -6, 40, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#b8762d";
  ctx.beginPath();
  ctx.ellipse(-32, -5, 12, 26, 0.3, 0, Math.PI * 2);
  ctx.ellipse(10, -5, 12, 26, -0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff8ed";
  ctx.beginPath();
  ctx.ellipse(14, 4, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  drawEye(-4, -14, 6, "#2c3e50");
  drawEye(18, -14, 6, "#2c3e50");

  ctx.fillStyle = "#2c3e50";
  ctx.beginPath();
  ctx.arc(24, -2, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawRabbitEar(x, y, rotation) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  ctx.fillStyle = "#f7d794";
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 36, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff7979";
  ctx.beginPath();
  ctx.ellipse(0, 2, 6, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawNewRabbit(leg1, leg2, state) {
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(-46, 18, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  drawLeg(-28, 24, leg2 * 1.2, 42, "#f5cd79", 16);
  drawLeg(15, 24, leg1 * 1.2, 42, "#f5cd79", 16);

  ctx.fillStyle = "#f7d794";
  ctx.beginPath();
  ctx.ellipse(-5, 16, 44, 38, 0, 0, Math.PI * 2);
  ctx.fill();

  drawLeg(-12, 34, leg1, 26, "#f7d794", 14);
  drawLeg(28, 34, leg2, 26, "#f7d794", 14);

  ctx.save();
  ctx.translate(15, -28);

  if (state === "eat") ctx.rotate(0.2);

  drawRabbitEar(-18, -68, -0.12);
  drawRabbitEar(6, -68, 0.12);

  ctx.fillStyle = "#f7d794";
  ctx.beginPath();
  ctx.arc(0, -8, 34, 0, Math.PI * 2);
  ctx.fill();

  drawEye(-10, -12, 6.5, "#2c3e50");
  drawEye(14, -12, 6.5, "#2c3e50");

  ctx.fillStyle = "#ff7979";
  ctx.beginPath();
  ctx.arc(2, -2, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-2, 2, 4, 7);
  ctx.fillRect(3, 2, 4, 7);

  ctx.restore();
}

function drawUniquePet(x, y, type, state) {
  ctx.save();
  ctx.translate(x, y);

  if (targetPos.x < petPos.x - 5) {
    ctx.scale(-1, 1);
  }

  let leg1 = 0;
  let leg2 = 0;
  let bodyY = 0;

  if (state === "fetch") {
    leg1 = Math.sin(animFrame * 5) * 0.8;
    leg2 = -leg1;
    bodyY = -Math.abs(Math.sin(animFrame * 4)) * 35;
  } else if (
    state === "walk" ||
    state === "fetchItem" ||
    state === "catToy"
  ) {
    leg1 = Math.sin(animFrame * 3.5) * 0.5;
    leg2 = -leg1;
    bodyY = -Math.abs(Math.sin(animFrame * 3.5)) * 10;
  } else if (state === "sit") {
    bodyY = 15;
    leg1 = -0.6;
    leg2 = 0.2;
  } else if (state === "eat") {
    bodyY = 10;
  } else {
    bodyY = Math.sin(animFrame * 1.5) * 3;
  }

  ctx.translate(0, bodyY);

  if (type === "cat") drawNewCat(leg1, leg2, state);
  if (type === "dog") drawNewDog(leg1, leg2, state);
  if (type === "capybara") drawNewCapybara(leg1, leg2, state);
  if (type === "rabbit") drawNewRabbit(leg1, leg2, state);

  const offsets = accessoryOffsets[type];

  if (equippedAccessory && offsets?.[equippedAccessory]) {
    const config = offsets[equippedAccessory];

    const icons = {
      hat: "🎩",
      glasses: "👓",
      ribbon: "🎀",
      hoodie: "🧥"
    };

    ctx.font = config.fontSize + " sans-serif";

    ctx.fillText(
      icons[equippedAccessory],
      config.x,
      config.y
    );
  }

  ctx.restore();
}

function drawFood(x, y, icon) {
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(x, y + 20, 36, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = "40px sans-serif";
  ctx.fillText(icon, x - 20, y + 15);
}

// ==========================================
// วาดลูกบอล กระดูก และไม้ตกแมวเป็นปลา
// ==========================================

function drawInteractiveItem(x, y, type) {
  ctx.save();
  ctx.translate(x, y);

  ctx.globalAlpha = 1;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.shadowColor = "rgba(0, 0, 0, 0.38)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  // ========================================
  // ⚽ ลูกฟุตบอล
  // ========================================

  if (type === "ball") {
    ctx.rotate(animFrame * 1.8);

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#17202a";
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.arc(0, 0, 29, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = "#111827";
    ctx.beginPath();

    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / 5;
      const px = Math.cos(angle) * 13;
      const py = Math.sin(angle) * 13;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }

    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 3;

    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / 5;

      ctx.beginPath();

      ctx.moveTo(
        Math.cos(angle) * 16,
        Math.sin(angle) * 16
      );

      ctx.lineTo(
        Math.cos(angle) * 27,
        Math.sin(angle) * 27
      );

      ctx.stroke();
    }

  // ========================================
  // 🦴 กระดูก
  // ========================================

  } else if (type === "bone") {
    ctx.rotate(-0.2);

    ctx.fillStyle = "#fff1c2";
    ctx.strokeStyle = "#75421d";
    ctx.lineWidth = 4;

    ctx.beginPath();

    ctx.moveTo(-19, -11);

    ctx.bezierCurveTo(
      -37, -28,
      -49, -6,
      -31, 2
    );

    ctx.bezierCurveTo(
      -46, 15,
      -27, 29,
      -16, 13
    );

    ctx.lineTo(19, 13);

    ctx.bezierCurveTo(
      34, 29,
      49, 11,
      31, 1
    );

    ctx.bezierCurveTo(
      47, -15,
      29, -29,
      18, -11
    );

    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(-12, -5);
    ctx.lineTo(12, -5);
    ctx.stroke();

  // ========================================
  // 🎣🐟 ไม้ตกแมว ปลาสีส้ม
  // ========================================

  } else if (type === "catToy") {
    const swing = Math.sin(animFrame * 2) * 7;

    // ด้ามไม้ตกแมว
    ctx.strokeStyle = "#704214";
    ctx.lineWidth = 7;

    ctx.beginPath();
    ctx.moveTo(-33, 30);
    ctx.lineTo(12, -43);
    ctx.stroke();

    // เชือก
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.strokeStyle = "#243447";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(12, -43);

    ctx.quadraticCurveTo(
      49,
      -39,
      39 + swing,
      8
    );

    ctx.stroke();

    // ตัวปลาแกว่งตามเชือก
    ctx.save();
    ctx.translate(39 + swing, 25);
    ctx.rotate(Math.sin(animFrame * 2) * 0.15);

    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    // หางปลา
    ctx.fillStyle = "#ff8c00";
    ctx.strokeStyle = "#9a3412";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(-17, 0);
    ctx.lineTo(-36, -14);
    ctx.lineTo(-36, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // ลำตัวปลา
    ctx.fillStyle = "#ff9f1c";

    ctx.beginPath();
    ctx.ellipse(0, 0, 23, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // ครีบบน
    ctx.fillStyle = "#ff6b00";

    ctx.beginPath();
    ctx.moveTo(-8, -12);
    ctx.lineTo(1, -23);
    ctx.lineTo(11, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // ตาปลา
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(12, -4, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#111827";

    ctx.beginPath();
    ctx.arc(13, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // ปากปลา
    ctx.strokeStyle = "#7c2d12";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(21, 4, 4, 0.2, 1.5);
    ctx.stroke();

    // เกล็ดปลา
    ctx.strokeStyle = "#c2410c";
    ctx.lineWidth = 1.5;

    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(i * 8 - 2, 2, 5, -0.8, 0.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  ctx.restore();
}

// ==========================================
// PHYSICS
// ==========================================

function updatePhysics() {
  const dx = targetPos.x - petPos.x;

  const running = [
    "fetch",
    "fetchItem",
    "catToy"
  ].includes(petState);

  if (Math.abs(dx) > 5) {
    petPos.x += dx * (running ? 0.12 : 0.06);

    if (!running && petState !== "eat") {
      petState = "walk";
    }
  } else if (petState === "walk") {
    petState = "idle";
  }

  if (running && Math.abs(dx) <= 20 && ballPos.visible) {
    if (petState === "catToy") {
      if (isPlayingToy) return;

      isPlayingToy = true;

      setTimeout(() => {
        ballPos.visible = false;
        isPlayingToy = false;
        targetPos.x = 325;
        petState = "idle";
        setSpeech("เล่นไม้ตกแมวเสร็จแล้ว 🎣🐟");
      }, 2500);
    } else {
      ballPos.visible = false;
      targetPos.x = 325;
      setSpeech("เก็บของได้แล้ว! 🐾");
    }
  }

  if (
    running &&
    !ballPos.visible &&
    Math.abs(petPos.x - 325) <= 20
  ) {
    petState = "idle";
  }
}

function gameLoop() {
  if (!ctx || !canvas) return;

  animFrame += 0.08;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawHouseBackground();
  updatePhysics();

  if (hasBed) drawPetBed(130, 395);
  if (hasTable) drawDiningTable(470, 385);

  drawShadow(petPos.x, petPos.y);

  if (foodPos.visible) {
    drawFood(foodPos.x, foodPos.y, foodPos.icon);
  }

  if (ballPos.visible) {
    drawInteractiveItem(
      ballPos.x,
      ballPos.y,
      ballPos.type
    );
  }

  drawUniquePet(
    petPos.x,
    petPos.y,
    currentPetType,
    petState
  );

  requestAnimationFrame(gameLoop);
}

// ==========================================
// 6. WEB3 HELPERS
// ==========================================

function requireEthers() {
  if (!window.ethers) {
    throw new Error("ไม่พบ ethers.js กรุณาโหลด ethers.js v6");
  }
}

function formatPetAmount(rawAmount) {
  requireEthers();
  return ethers.formatUnits(rawAmount, petDecimals);
}

function parsePetAmount(amount) {
  requireEthers();
  return ethers.parseUnits(String(amount), petDecimals);
}

function getErrorMessage(err) {
  return (
    err?.shortMessage ||
    err?.reason ||
    err?.message ||
    "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ"
  );
}

async function verifyShopToken() {
  const contract = new ethers.Contract(
    SHOP_CONTRACT_ADDR,
    ["function petToken() view returns (address)"],
    provider
  );

  const actualToken = await contract.petToken();

  if (actualToken.toLowerCase() !== PET_TOKEN_ADDR.toLowerCase()) {
    throw new Error(
      "ShopContract ใช้ PET Token คนละตัวกับหน้าเว็บ"
    );
  }

  return true;
}

// ==========================================
// 7. CONNECT METAMASK
// ==========================================

async function connectWallet() {
  if (!window.ethereum) {
    alert("กรุณาติดตั้ง MetaMask ก่อน!");
    return;
  }

  try {
    requireEthers();

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts"
    });

    if (!accounts.length) return;

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();

    const tokenContract = new ethers.Contract(
      PET_TOKEN_ADDR,
      erc20Abi,
      provider
    );

    petDecimals = Number(await tokenContract.decimals());

    const connectBtn = document.getElementById("connectBtn");
    const walletInfo = document.getElementById("walletInfo");
    const walletAddress = document.getElementById("walletAddress");

    if (connectBtn) {
      connectBtn.innerText = "✅ เชื่อมต่อแล้ว";
      connectBtn.classList.add("connected");
    }

    if (walletInfo) walletInfo.style.display = "block";

    if (walletAddress) {
      walletAddress.innerText =
        userAddress.slice(0, 6) +
        "..." +
        userAddress.slice(-4);
    }

    log("เชื่อมต่อ MetaMask สำเร็จ: " + userAddress);

    await refreshPetBalance();
    await checkWelcomeBonusStatus();

    try {
      await verifyShopToken();
      await loadPurchasedItems();
      await updateShopPrices();
    } catch (err) {
      log("ตรวจสอบร้านค้าไม่สำเร็จ: " + getErrorMessage(err));
    }

  } catch (err) {
    console.error(err);
    alert("เชื่อมต่อไม่สำเร็จ: " + getErrorMessage(err));
  }
}

if (window.ethereum?.on) {
  window.ethereum.on("accountsChanged", () => {
    location.reload();
  });

  window.ethereum.on("chainChanged", () => {
    location.reload();
  });
}

// ==========================================
// 8. PET TOKEN
// ==========================================

async function refreshPetBalance() {
  if (!provider || !userAddress) return;

  try {
    const tokenContract = new ethers.Contract(
      PET_TOKEN_ADDR,
      erc20Abi,
      provider
    );

    const balance = await tokenContract.balanceOf(userAddress);
    const formatted = formatPetAmount(balance);

    const element = document.getElementById("petBalance");

    if (element) {
      element.innerText = Number(formatted).toFixed(2);
    }

    log("ยอด PET: " + formatted);

  } catch (err) {
    log("อ่านยอด PET ไม่สำเร็จ: " + getErrorMessage(err));
  }
}

async function addPetTokenToWallet() {
  if (!window.ethereum) {
    alert("กรุณาติดตั้ง MetaMask ก่อน");
    return;
  }

  try {
    const result = await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: PET_TOKEN_ADDR,
          symbol: "PET",
          decimals: petDecimals
        }
      }
    });

    if (result) {
      alert("เพิ่มเหรียญ PET สำเร็จ!");
      log("เพิ่ม PET เข้า MetaMask แล้ว");
    }
  } catch (err) {
    alert(getErrorMessage(err));
  }
}

// ==========================================
// 9. REWARD SYSTEM
// ==========================================

async function checkWelcomeBonusStatus() {
  if (!provider || !userAddress) return;

  try {
    const contract = new ethers.Contract(
      REWARD_CONTRACT_ADDR,
      rewardAbi,
      provider
    );

    const claimed = await contract.hasCompletedMission(
      userAddress,
      0
    );

    setFaucetButtonClaimed(claimed);

  } catch (err) {
    log("ตรวจสอบโบนัสไม่สำเร็จ: " + getErrorMessage(err));
  }
}

function setFaucetButtonClaimed(claimed) {
  const btn = document.getElementById("faucetBtn");
  if (!btn) return;

  btn.disabled = claimed;

  if (claimed) {
    btn.innerText = "✅ รับเหรียญแรกเข้าแล้ว";
    btn.style.background = "#b2bec3";
    btn.style.cursor = "not-allowed";
  } else {
    btn.innerText = "🎁 รับเหรียญฟรี 10 PET";
    btn.style.background = "";
    btn.style.cursor = "";
  }
}

async function claimWelcomeBonus() {
  if (!signer) {
    alert("กรุณาเชื่อมต่อ MetaMask ก่อน!");
    return;
  }

  try {
    const contract = new ethers.Contract(
      REWARD_CONTRACT_ADDR,
      rewardAbi,
      signer
    );

    log("กำลังรับโบนัสเริ่มต้น...");

    const tx = await contract.claimMissionReward(0);
    await tx.wait();

    setFaucetButtonClaimed(true);
    await refreshPetBalance();

    alert("🎉 รับเหรียญเริ่มต้นสำเร็จ!");

  } catch (err) {
    alert("รับโบนัสไม่สำเร็จ: " + getErrorMessage(err));
  }
}

async function claimReward(missionId) {
  if (!signer) {
    alert("กรุณาเชื่อมต่อ MetaMask ก่อน!");
    return;
  }

  const requirements = {
    1: { count: m1Count, required: 3, name: "ให้อาหาร" },
    2: { count: m2Count, required: 2, name: "เล่นกับสัตว์" },
    3: { count: m3Count, required: 2, name: "เดินเล่น" },
    4: { count: m4Count, required: 2, name: "สั่งนั่ง" },
    5: { count: m5Count, required: 1, name: "ซื้อไอเทม" }
  };

  const mission = requirements[missionId];

  if (!mission) {
    alert("ไม่พบภารกิจ");
    return;
  }

  if (mission.count < mission.required) {
    alert(
      `ยังทำภารกิจไม่สำเร็จ!\n` +
      `${mission.name}: ${mission.count}/${mission.required}`
    );
    return;
  }

  try {
    const contract = new ethers.Contract(
      REWARD_CONTRACT_ADDR,
      rewardAbi,
      signer
    );

    const claimed = await contract.hasCompletedMission(
      userAddress,
      missionId
    );

    if (claimed) {
      alert("คุณเคยรับรางวัลภารกิจนี้แล้ว");
      return;
    }

    const tx = await contract.claimMissionReward(missionId);

    log("กรุณายืนยันธุรกรรมใน MetaMask");
    await tx.wait();

    await refreshPetBalance();

    alert("🎉 รับรางวัลภารกิจสำเร็จ!");

  } catch (err) {
    alert("รับรางวัลไม่สำเร็จ: " + getErrorMessage(err));
  }
}

// ==========================================
// 10. LOAD PURCHASED ITEMS
// ==========================================

async function loadPurchasedItems() {
  if (!provider || !userAddress) return;

  try {
    const contract = new ethers.Contract(
      SHOP_CONTRACT_ADDR,
      shopAbi,
      provider
    );

    const count = await contract.getPurchasedItemCount(
      userAddress
    );

    const purchased = [];

    for (let i = 0; i < Number(count); i++) {
      const numericId = await contract.getPurchasedItemAt(
        userAddress,
        i
      );

      const itemName = ITEM_NAMES[Number(numericId)];

      if (itemName && !purchased.includes(itemName)) {
        purchased.push(itemName);
      }
    }

    ownedItems = purchased;

    m5Count = ownedItems.length > 0 ? 1 : 0;

    updateMissionProgress();
    updateShopUI();

    log("โหลดสินค้าที่ซื้อแล้ว " + ownedItems.length + " รายการ");

  } catch (err) {
    console.error(err);
    log("โหลดประวัติการซื้อไม่สำเร็จ: " + getErrorMessage(err));
  }
}

// ==========================================
// 11. SHOP PRICE
// ==========================================

async function getRealItemPrice(itemId) {
  if (!provider) {
    throw new Error("กรุณาเชื่อมต่อ MetaMask ก่อน");
  }

  const numericId = ITEM_ID_MAP[itemId];

  if (!numericId) {
    throw new Error("ไม่พบไอเทม: " + itemId);
  }

  const contract = new ethers.Contract(
    SHOP_CONTRACT_ADDR,
    shopAbi,
    provider
  );

  return await contract.getItemPrice(numericId);
}

async function updateShopPrices() {
  if (!provider) return;

  const cards = document.querySelectorAll(".shop-card");

  for (const card of cards) {
    const itemId = card.getAttribute("data-item");

    if (!ITEM_ID_MAP[itemId]) continue;

    try {
      const rawPrice = await getRealItemPrice(itemId);
      const price = formatPetAmount(rawPrice);

      card.dataset.realPrice = price;

      const priceElement = card.querySelector(
        ".item-price, .shop-price, [data-price]"
      );

      if (priceElement) {
        priceElement.innerText = price + " PET";
      }

    } catch (err) {
      log("อ่านราคา " + itemId + " ไม่สำเร็จ");
    }
  }
}

// ==========================================
// 12. EQUIP ITEMS
// ==========================================

function equipOwnedItem(itemId) {
  if (!ownedItems.includes(itemId)) return;

  if (ACCESSORIES.includes(itemId)) {
    equippedAccessory =
      equippedAccessory === itemId ? null : itemId;

    setSpeech(
      equippedAccessory
        ? "สวมใส่ " + itemId + " แล้ว 😎"
        : "ถอดเครื่องประดับแล้ว"
    );
  }

  if (itemId === "bed") {
    hasBed = !hasBed;
    setSpeech(hasBed ? "วางที่นอนแล้ว 🛏️" : "เก็บที่นอนแล้ว");
  }

  if (itemId === "table") {
    hasTable = !hasTable;
    setSpeech(hasTable ? "วางโต๊ะแล้ว 🍽️" : "เก็บโต๊ะแล้ว");
  }

  if (itemId === "frame") {
    hasFrame = !hasFrame;
    setSpeech(hasFrame ? "ติดกรอบรูปแล้ว 🖼️" : "เก็บกรอบรูปแล้ว");
  }

  if (SCENES.includes(itemId)) {
    equippedScene = equippedScene === itemId ? null : itemId;

    setSpeech(
      equippedScene
        ? "เปลี่ยนฉากเป็น " + itemId + " แล้ว 🌳"
        : "กลับสู่ฉากบ้านแล้ว"
    );
  }

  updateShopUI();
}

// ==========================================
// 13. BUY ITEM
// ==========================================

async function buyItem(itemId, pricePET) {
  // pricePET คงไว้เพื่อรองรับ HTML เดิม

  if (purchasing) {
    alert("กรุณารอธุรกรรมก่อนหน้าให้เสร็จ");
    return;
  }

  if (ownedItems.includes(itemId)) {
    equipOwnedItem(itemId);
    return;
  }

  if (!signer || !userAddress) {
    alert("กรุณาเชื่อมต่อ MetaMask ก่อน!");
    return;
  }

  const numericId = ITEM_ID_MAP[itemId];

  if (!numericId) {
    alert("❌ ไม่พบไอเทมนี้");
    return;
  }

  purchasing = true;

  try {
    requireEthers();

    const tokenContract = new ethers.Contract(
      PET_TOKEN_ADDR,
      erc20Abi,
      signer
    );

    const shopContract = new ethers.Contract(
      SHOP_CONTRACT_ADDR,
      shopAbi,
      signer
    );

    await verifyShopToken();

    const alreadyPurchased = await shopContract.checkPurchased(
      userAddress,
      numericId
    );

    if (alreadyPurchased) {
      if (!ownedItems.includes(itemId)) {
        ownedItems.push(itemId);
      }

      m5Count = 1;
      updateMissionProgress();
      updateShopUI();

      alert("คุณเป็นเจ้าของไอเทมนี้แล้ว");
      return;
    }

    const priceWei = await shopContract.getItemPrice(
      numericId
    );

    const balanceWei = await tokenContract.balanceOf(
      userAddress
    );

    const realPrice = formatPetAmount(priceWei);
    const realBalance = formatPetAmount(balanceWei);

    log("สินค้า: " + itemId);
    log("ราคาจริง: " + realPrice + " PET");
    log("ยอดเงิน: " + realBalance + " PET");

    if (balanceWei < priceWei) {
      alert(
        "❌ ยอดเงินไม่พอ!\n" +
        "คุณมี " + realBalance + " PET\n" +
        "ต้องการ " + realPrice + " PET"
      );
      return;
    }

    const allowance = await tokenContract.allowance(
      userAddress,
      SHOP_CONTRACT_ADDR
    );

    if (allowance < priceWei) {
      log("กำลังขออนุมัติใช้เหรียญ PET...");

      const approveTx = await tokenContract.approve(
        SHOP_CONTRACT_ADDR,
        priceWei
      );

      log("กรุณายืนยัน Approve ใน MetaMask");

      const approveReceipt = await approveTx.wait();

      if (approveReceipt.status !== 1) {
        throw new Error("ธุรกรรม Approve ไม่สำเร็จ");
      }

      log("อนุมัติ PET สำเร็จ");
    }

    log("กำลังซื้อ " + itemId + " ราคา " + realPrice + " PET");

    const buyTx = await shopContract.buyItem(numericId);

    log("กรุณายืนยันการซื้อใน MetaMask");

    const buyReceipt = await buyTx.wait();

    if (buyReceipt.status !== 1) {
      throw new Error("ธุรกรรมซื้อสินค้าไม่สำเร็จ");
    }

    if (!ownedItems.includes(itemId)) {
      ownedItems.push(itemId);
    }

    m5Count = 1;
    updateMissionProgress();

    if (ACCESSORIES.includes(itemId)) {
      equippedAccessory = itemId;
    }

    if (itemId === "bed") hasBed = true;
    if (itemId === "table") hasTable = true;
    if (itemId === "frame") hasFrame = true;

    if (SCENES.includes(itemId)) {
      equippedScene = itemId;
    }

    setSpeech("ซื้อ " + itemId + " สำเร็จ! 🎉");

    log("🎉 ซื้อสินค้าเรียบร้อยแล้ว");

    await refreshPetBalance();
    updateShopUI();

    alert(
      "🎉 ซื้อสินค้าเรียบร้อย!\n" +
      "สินค้า: " + itemId + "\n" +
      "ราคา: " + realPrice + " PET"
    );

  } catch (err) {
    console.error(err);

    const message = getErrorMessage(err);

    log("❌ ซื้อสินค้าไม่สำเร็จ: " + message);
    alert("❌ ซื้อสินค้าไม่สำเร็จ!\n" + message);

  } finally {
    purchasing = false;
  }
}

// ==========================================
// 14. UPDATE SHOP UI
// ==========================================

function updateShopUI() {
  const cards = document.querySelectorAll(".shop-card");

  cards.forEach(card => {
    const itemId = card.getAttribute("data-item");
    const btn = card.querySelector(".btn-buy");

    if (!btn || !itemId) return;

    const owned = ownedItems.includes(itemId);

    const equipped =
      equippedAccessory === itemId ||
      equippedScene === itemId ||
      (itemId === "bed" && hasBed) ||
      (itemId === "table" && hasTable) ||
      (itemId === "frame" && hasFrame);

    if (equipped) {
      btn.innerText = "Equipped (ใช้งานอยู่)";
      btn.style.background = "#2ed573";

    } else if (owned) {
      btn.innerText = "Equip (ใช้งาน)";
      btn.style.background = "#e1b12c";

    } else {
      btn.innerText = "Purchase";
      btn.style.background = "#487eb0";
    }
  });
}

// ==========================================
// 15. GAME INITIALIZATION
// ==========================================

window.addEventListener("load", () => {
  initCanvas();

  updateStatsDisplay();
  updateMissionProgress();
  updateShopUI();

  startStatDecay();

  // เปลี่ยนข้อความปุ่มและภารกิจที่อยู่ใน HTML เดิม
  const sitButton = document.querySelector(
    'button[onclick*="sitPet"]'
  );

  if (sitButton) {
    sitButton.textContent = "🪑 สั่งนั่ง";
  }

  document.querySelectorAll("button, h1, h2, h3, h4, p, span, div, label").forEach(element => {
    if (
      element.children.length === 0 &&
      element.textContent.includes("นั่ง")
    ) {
      element.textContent = element.textContent.replaceAll(
        "นั่ง/นอน",
        "นั่ง"
      );
    }
  });

  log("ระบบเกมพร้อมทำงาน");
  log("กรุณาเชื่อมต่อ MetaMask เพื่อใช้ระบบ Web3");
});