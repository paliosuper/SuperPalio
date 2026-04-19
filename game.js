const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreValue');
const finalScoreElement = document.getElementById('finalScore');
const healthContainer = document.getElementById('health-container');
const uiOverlay = document.getElementById('ui-overlay');
const waveOverlay = document.getElementById('wave-overlay');
const waveText = document.getElementById('wave-text');
const startScreen = document.getElementById('start-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const restartBtn = document.getElementById('restartBtn');

// Dialogue UI Elements
const dialogueOverlay = document.getElementById('dialogue-overlay');
const dialogueText = document.getElementById('dialogue-text');
const dialogueRecruitBtn = document.getElementById('dialogue-recruit-btn');
const dialogueCloseBtn = document.getElementById('dialogue-close-btn');
const recruitCostSpan = document.getElementById('recruit-cost');

// Shop UI Elements
const shopOverlay = document.getElementById('shop-overlay');
const shopCloseBtn = document.getElementById('shop-close-btn');
const buyRefriBtn = document.getElementById('buy-refri-btn');
const refriSlot = document.getElementById('refri-slot');
const refriIcon = document.getElementById('refri-icon');

// Boss Bar UI Elements
const bossBarContainer = document.getElementById('boss-bar-container');
const bossHealthBarFill = document.getElementById('boss-health-bar-fill');
const bossIntroOverlay = document.getElementById('boss-intro-overlay');
const bossIntroText = document.getElementById('boss-intro-text');
const screenEffects = document.getElementById('screen-effects');

// Password Modal Elements
const passwordModal = document.getElementById('password-modal');
const passwordInput = document.getElementById('password-input');
const passwordFeedback = document.getElementById('password-feedback');
const passwordConfirmBtn = document.getElementById('password-confirm-btn');
const passwordCancelBtn = document.getElementById('password-cancel-btn');

// Pause & Mobile UI Elements
const pauseOverlay = document.getElementById('pause-overlay');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const menuBtn = document.getElementById('menuBtn');
const pauseFullscreenBtn = document.getElementById('pauseFullscreenBtn');
const mobileControls = document.getElementById('mobile-controls');
const joystickContainer = document.getElementById('joystick-container');
const joystickStick = document.getElementById('joystick-stick');
const platformSelection = document.getElementById('platform-selection');
const pcSelectionBtn = document.getElementById('pcSelectionBtn');
const mobileSelectionBtn = document.getElementById('mobileSelectionBtn');
const clickStart = document.getElementById('click-start');

// Joystick config state
let joystickSide = 'right'; // 'right' ou 'left'
let joystickSize = 150;     // px
let joystickOpacity = 0.8;  // 0..1

// Configurações do Mapa e Câmera
const MAP_WIDTH = 2752;
const MAP_HEIGHT = 1536;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let gameActive = false;
let animationId;
let isPaused = false;
let isMobileMode = false;

// Gerenciamento de Ondas
let currentWave = 1;
let enemiesRemaining = 0;
let enemiesToSpawn = 0;
let waveActive = false;
let spawnInterval;

// Joystick State
let joystick = {
    active: false,
    originX: 0,
    originY: 0,
    moveX: 0,
    moveY: 0,
    vectorX: 0,
    vectorY: 0
};

// Imagens
const images = {
    idle: new Image(), run1: new Image(), run2: new Image(), run3: new Image(),
    namao: new Image(), jogando: new Image(), jogou: new Image(),
    maca: new Image(), background: new Image(), celeiro: new Image(),
    anao: new Image(), arun1: new Image(), arun2: new Image(), arun3: new Image(),
    vendor: new Image(), refri: new Image(),
    // Sprites do inimigo/zombie - ramo1,2,3
    ramo1: new Image(), ramo2: new Image(), ramo3: new Image(),
    // Sprites animados do Dayniel
    drun1: new Image(), drun2: new Image(), dattack: new Image()
};

let inventory = { soda: 0 };
let isDraggingItem = false;
let draggedItemType = null; // 'soda'
let dragIcon = null; // Elemento visual de arraste

function updateInventoryUI() {
    const refriSlot = document.getElementById('refri-slot');
    const refriCount = document.getElementById('refri-count');
    
    if (inventory.soda > 0) {
        refriSlot.classList.remove('hidden');
        if(refriCount) refriCount.innerText = inventory.soda > 1 ? inventory.soda : '';
    } else {
        refriSlot.classList.add('hidden');
    }
}

function loadSmart(img, baseName, originalExt = '.png') {
    img.src = baseName + originalExt;
    img.onerror = () => {
        if (img.src.includes(originalExt + originalExt)) return;
        img.src = baseName + originalExt + originalExt;
    };
}

loadSmart(images.idle, 'idle');
loadSmart(images.run1, 'run1');
loadSmart(images.run2, 'run2');
loadSmart(images.run3, 'run3');
loadSmart(images.namao, 'namao');
loadSmart(images.jogando, 'jogando');
loadSmart(images.jogou, 'jogou');
loadSmart(images.maca, 'maca');
images.background.src = 'cenario.png.png';
images.celeiro.src = 'celeiro.png.png';
loadSmart(images.anao, 'anao');
loadSmart(images.arun1, 'arun1');
loadSmart(images.arun2, 'arun2');
loadSmart(images.arun3, 'arun3');
loadSmart(images.vendor, 'daynielsupimpa');
loadSmart(images.refri, 'refri');
// Sprites de inimigo/zumbi
loadSmart(images.ramo1, 'ramo1');
loadSmart(images.ramo2, 'ramo2');
loadSmart(images.ramo3, 'ramo3');
// Sprites animados do Dayniel (gerados separadamente)
loadSmart(images.drun1, 'dayniel_run1');
loadSmart(images.drun2, 'dayniel_run2');
loadSmart(images.dattack, 'dayniel_attack');

// ==========================================
// CONFIGURAÇÕES DE TAMANHO (PERSPECTIVA)
// ==========================================
// Ajuste os valores abaixo para mudar o tamanho dos personagens e monstros.
// Tente mudar os números ex: 1.0 é o tamanho real do PNG, 0.5 é a metade, 2.0 é o dobro.

// ESCALAS DE PERSPECTIVA
let SCALE_OUTDOOR_MIN = 0.8;
let SCALE_OUTDOOR_MAX = 1.2;
let SCALE_INDOOR_MIN = 16;
let SCALE_INDOOR_MAX = 5;

// ==========================================
// CONFIGURAÇÕES DE TELEPORTE DA PORTA (ZONAS)
// ==========================================
// PORTA DE ENTRADA (Mundo de fora para dentro)
let PORTA_ENTRADA_X_MIN = 810;
let PORTA_ENTRADA_X_MAX = 1010;
let PORTA_ENTRADA_Y_MIN = 850;
let PORTA_ENTRADA_Y_MAX = 930;
let NASCER_DENTRO_X = 1958;
let NASCER_DENTRO_Y = 1286;
let PORTA_SAIDA_X = 2308;
let NASCER_FORA_X = 1016;
let NASCER_FORA_Y = 1083;

function getDepthScale(y) {
    const percentY = y / MAP_HEIGHT;
    if (currentScene === 'indoor') {
        return SCALE_INDOOR_MIN + (percentY * (SCALE_INDOOR_MAX - SCALE_INDOOR_MIN));
    }
    return SCALE_OUTDOOR_MIN + (percentY * (SCALE_OUTDOOR_MAX - SCALE_OUTDOOR_MIN));
}

// Colisões Refinadas (Com base na Print 2 do usuário)
let worldCollisions = [
    { x: 0, y: 0, w: 2752, h: 100, name: 'Borda Norte' },
    { x: 0, y: 0, w: 80, h: 1536, name: 'Borda Esquerda' },
    { x: 0, y: 1400, w: 2752, h: 136, name: 'Borda Sul' },
    { x: 2600, y: 0, w: 152, h: 1536, name: 'Borda Direita (Rio)' },
    { x: 80, y: 100, w: 850, h: 250, name: 'Floresta Noroeste' },
    { x: 80, y: 350, w: 300, h: 200, name: 'Bosque Oeste' },
    { x: 1950, y: 0, w: 650, h: 240, name: 'Rio Norte (Troncos e margem)' },
    { x: 1942, y: 594, w: 220, h: 180, name: 'Arvore do Rio' },
    { x: 1410, y: 496, w: 530, h: 280, name: 'Celeiro Telhado' },
    { x: 1298, y: 696, w: 220, h: 80, name: 'Celeiro Parede Esq' },
    { x: 1089, y: 699, w: 210, h: 80, name: 'Celeiro Parede Dir' },
    { x: 2164, y: 592, w: 440, h: 192, name: 'Box' },
    { x: 297, y: 1263, w: 89, h: 76, name: 'Box' },
    { x: 101, y: 784, w: 247, h: 114, name: 'Box' },
    { x: 344, y: 709, w: 35, h: 97, name: 'Box' },
    { x: 387, y: 802, w: 184, h: 39, name: 'Box' },
    { x: 605, y: 785, w: 94, h: 136, name: 'Box' },
    { x: 500, y: 845, w: 95, h: 28, name: 'Box' },
    { x: 572, y: 882, w: 30, h: 23, name: 'Box' },
    { x: 703, y: 882, w: 12, h: 25, name: 'Box' },
    { x: 721, y: 894, w: 86, h: 36, name: 'Box' },
    { x: 716, y: 880, w: 13, h: 12, name: 'Box' },
    { x: 1011, y: 851, w: 74, h: 66, name: 'Box' },
    { x: 1063, y: 762, w: 24, h: 152, name: 'Box' },
    { x: 698, y: 843, w: 381, h: 48, name: 'Box' },
];

let foregroundBoxes = [
    { x: 2247, y: 855, w: 51, h: 18, name: 'Box' },
    { x: 2258, y: 844, w: 35, h: 39, name: 'Box' },
    { x: 2233, y: 866, w: 75, h: 29, name: 'Box' },
    { x: 2223, y: 889, w: 94, h: 23, name: 'Box' },
    { x: 287, y: 1232, w: 107, h: 27, name: 'Box' },
    { x: 412, y: 1136, w: 15, h: 178, name: 'Box' },
    { x: 251, y: 1141, w: 22, h: 183, name: 'Box' },
    { x: 262, y: 1100, w: 156, h: 48, name: 'Box' },
    { x: 455, y: 1206, w: 11, h: 12, name: 'Box' },
    { x: 432, y: 1181, w: 16, h: 14, name: 'Box' },
    { x: 437, y: 1199, w: 12, h: 18, name: 'Box' },
    { x: 430, y: 1165, w: 13, h: 13, name: 'Box' },
];

let barnCollisions = [
    { x: 0, y: 0, w: 2752, h: 200, name: 'Parede Norte Interna' },
    { x: 0, y: 0, w: 80, h: 1536, name: 'Parede Esq Interna' },
    { x: -22, y: 1474, w: 2752, h: 136, name: 'Parede Sul Interna' },
    { x: 2600, y: 0, w: 152, h: 480, name: 'Parede Dir Interna Cima' },
    { x: 2552, y: 802, w: 152, h: 736, name: 'Parede Dir Interna Baixo' },
];

let barnForegroundBoxes = [];

let enemySpawns = [
    { x: 1500, y: 1257, w: 375, h: 81, name: 'Spawn' },
    { x: 1758, y: 838, w: 232, h: 52, name: 'Spawn' },
    { x: 2497, y: 1043, w: 73, h: 96, name: 'Spawn' },
];

let particles = [];
let damageNumbers = [];
let screenShake = 0; // Intensidade do tremor de tela
let activeBoss = null; // Referência ao boss ativo
let bossIntroActive = false;

// Cenário (outdoor ou indoor)
let currentScene = 'outdoor';
let sceneAlpha = 0; // Para fade effect

// Ponte (Espaço livre no Rio)
const bridgeZone = { x: 1750, y: 245, w: 600, h: 110 };

function checkWorldCollision(x, y, radius) {
    // Truque de Profundidade: A colisão checa principalmente a BASE do personagem (pés)
    const feetY = y; 
    const feetX = x;
    
    if (currentScene === 'outdoor') {
        // Ponte é área livre no outdoor
        if (feetX > bridgeZone.x && feetX < bridgeZone.x + bridgeZone.w &&
            feetY > bridgeZone.y && feetY < bridgeZone.y + bridgeZone.h) {
            return false; 
        }

        for (let box of worldCollisions) {
            let closestX = Math.max(box.x, Math.min(feetX, box.x + box.w));
            let closestY = Math.max(box.y, Math.min(feetY, box.y + box.h));
            let distanceX = feetX - closestX;
            let distanceY = feetY - closestY;
            if ((distanceX * distanceX) + (distanceY * distanceY) < (radius * radius)) return true;
        }
    } else {
        for (let box of barnCollisions) {
            let closestX = Math.max(box.x, Math.min(feetX, box.x + box.w));
            let closestY = Math.max(box.y, Math.min(feetY, box.y + box.h));
            let distanceX = feetX - closestX;
            let distanceY = feetY - closestY;
            if ((distanceX * distanceX) + (distanceY * distanceY) < (radius * radius)) return true;
        }
    }
    return false;
}

// Câmera com Suavização (Lerp)
class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.lerp = 0.15;
        this.zoom = 1;
        this.targetZoom = 1;
    }
    update(target) {
        // Cálculo do Zoom Mínimo para NUNCA sobrar tela preta
        // O zoom deve ser grande o suficiente para cobrir a largura OU a altura do canvas
        const minZoomX = canvas.width / MAP_WIDTH;
        const minZoomY = canvas.height / MAP_HEIGHT;
        const autoMinZoom = Math.max(minZoomX, minZoomY);

        // Zoom desejado (Lá fora 100%, Lá dentro ~45% ou o mínimo necessário)
        this.targetZoom = currentScene === 'indoor' ? Math.max(0.45, autoMinZoom) : 1.0;
        this.zoom += (this.targetZoom - this.zoom) * 0.05;

        const scale = getDepthScale(target.y);
        
        // Foco da Câmera
        const targetX = target.x - (canvas.width / this.zoom) / 2;
        const targetY = (target.y - (target.spriteHeight / 2 * scale)) - (canvas.height / this.zoom) / 2;
        
        this.x += (targetX - this.x) * this.lerp;
        this.y += (targetY - this.y) * this.lerp;
        
        // Limites do mapa (Garante que a câmera não mostre o "vazio" fora do PNG)
        const limitX = Math.max(0, MAP_WIDTH - (canvas.width / this.zoom));
        const limitY = Math.max(0, MAP_HEIGHT - (canvas.height / this.zoom));
        
        // Se o mapa for menor que a tela (zoom muito baixo), centraliza
        if (MAP_WIDTH * this.zoom < canvas.width) {
            this.x = -(canvas.width / this.zoom - MAP_WIDTH) / 2;
        } else {
            this.x = Math.max(0, Math.min(this.x, limitX));
        }

        if (MAP_HEIGHT * this.zoom < canvas.height) {
            this.y = -(canvas.height / this.zoom - MAP_HEIGHT) / 2;
        } else {
            this.y = Math.max(0, Math.min(this.y, limitY));
        }
    }
    apply(ctx) {
        let sx = 0, sy = 0;
        if (screenShake > 0) {
            sx = (Math.random() - 0.5) * screenShake;
            sy = (Math.random() - 0.5) * screenShake;
            screenShake *= 0.9;
            if (screenShake < 0.1) screenShake = 0;
        }

        // Aplica Zoom e Translação
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-Math.floor(this.x + sx), -Math.floor(this.y + sy));
    }
}

const camera = new Camera();
const DEBUG_MODE = false; // Desativado para a jogabilidade final

// Controles
const keys = { w: false, a: false, s: false, d: false };
window.addEventListener('keydown', e => { 
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true; 
    if (typeof undoHistory === 'function' && e.key.toLowerCase() === 'z') undoHistory();
});
window.addEventListener('keyup', e => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false; });

let mouse = { x: 0, y: 0 };
let isDraggingEditor = false;
let editorUIPanelOffset = { x: 0, y: 0 };
const editorUI = document.getElementById('editor-ui');
const editorHeader = document.getElementById('editor-header');

if (editorHeader) {
    editorHeader.addEventListener('mousedown', (e) => {
        isDraggingEditor = true;
        editorUIPanelOffset = {
            x: e.clientX - editorUI.offsetLeft,
            y: e.clientY - editorUI.offsetTop
        };
        e.stopPropagation();
    });
}

window.addEventListener('pointermove', e => {
    mouse.x = e.clientX / camera.zoom + camera.x;
    mouse.y = e.clientY / camera.zoom + camera.y;
    
    if (isDraggingEditor) {
        editorUI.style.right = 'auto';
        editorUI.style.left = (e.clientX - editorUIPanelOffset.x) + 'px';
        editorUI.style.top = (e.clientY - editorUIPanelOffset.y) + 'px';
        return;
    }

    if (isDraggingItem) updateDragIcon(e);

    if (typeof isDraggingBox !== 'undefined' && isDraggingBox && draggedBox) {
        draggedBox.x = Math.round(mouse.x - dragOffset.x);
        draggedBox.y = Math.round(mouse.y - dragOffset.y);
    } else if (isDraggingSpecial) {
        // ... (lógica de arraste do editor mantida)
        if (isDraggingSpecial === 'porta_entrada') {
            const w = PORTA_ENTRADA_X_MAX - PORTA_ENTRADA_X_MIN;
            const h = PORTA_ENTRADA_Y_MAX - PORTA_ENTRADA_Y_MIN;
            PORTA_ENTRADA_X_MIN = Math.round(mouse.x - dragOffset.x);
            PORTA_ENTRADA_Y_MIN = Math.round(mouse.y - dragOffset.y);
            PORTA_ENTRADA_X_MAX = PORTA_ENTRADA_X_MIN + w;
            PORTA_ENTRADA_Y_MAX = PORTA_ENTRADA_Y_MIN + h;
        } else if (isDraggingSpecial === 'porta_saida') {
            PORTA_SAIDA_X = Math.round(mouse.x);
        } else if (isDraggingSpecial === 'spawn_fora') {
            NASCER_FORA_X = Math.round(mouse.x);
            NASCER_FORA_Y = Math.round(mouse.y);
        } else if (isDraggingSpecial === 'spawn_dentro') {
            NASCER_DENTRO_X = Math.round(mouse.x);
            NASCER_DENTRO_Y = Math.round(mouse.y);
        } else if (isDraggingSpecial === 'dwarf') {
            dwarf.x = Math.round(mouse.x - dragOffset.x);
            dwarf.y = Math.round(mouse.y - dragOffset.y);
            dwarf.spawnX = dwarf.x;
            dwarf.spawnY = dwarf.y;
        } else if (isDraggingSpecial === 'vendor') {
            vendor.x = Math.round(mouse.x - dragOffset.x);
            vendor.y = Math.round(mouse.y - dragOffset.y);
            vendor.spawnX = vendor.x;
            vendor.spawnY = vendor.y;
        }
        updateEditorUIFromVars();
    }
});

let editorMode = false;
let isDrawingCol = false;
let drawStart = { x: 0, y: 0 };
let currentTool = 'col';

let isDraggingBox = false;
let draggedBox = null;
let isDraggingSpecial = null; // 'porta_entrada', 'porta_saida', 'spawn_fora', 'spawn_dentro', 'dwarf'
let dragOffset = { x: 0, y: 0 };

let historyStack = [];
function saveHistory() {
    historyStack.push({
        cols: JSON.parse(JSON.stringify(worldCollisions)),
        barnCols: JSON.parse(JSON.stringify(barnCollisions)),
        fgs: JSON.parse(JSON.stringify(foregroundBoxes)),
        barnFgs: JSON.parse(JSON.stringify(barnForegroundBoxes))
    });
}
function undoHistory() {
    if (historyStack.length > 0) {
        let state = historyStack.pop();
        worldCollisions = state.cols;
        barnCollisions = state.barnCols || [];
        foregroundBoxes = state.fgs;
        barnForegroundBoxes = state.barnFgs || [];
    }
}

const toggleEditorBtn = document.getElementById('toggleEditorBtn');
const editorTools = document.getElementById('editor-tools');
const exportTxtBtn = document.getElementById('exportTxtBtn');
const clearColsBtn = document.getElementById('clearColsBtn');
const undoBtn = document.getElementById('undoBtn');

function updateEditorUIFromVars() {
    const ids = {
        'uiScaleInMin': SCALE_INDOOR_MIN, 'uiScaleInMax': SCALE_INDOOR_MAX,
        'uiScaleOutMin': SCALE_OUTDOOR_MIN, 'uiScaleOutMax': SCALE_OUTDOOR_MAX,
        'uiSpawnDentroX': NASCER_DENTRO_X, 'uiSpawnDentroY': NASCER_DENTRO_Y,
        'uiSpawnForaX': NASCER_FORA_X, 'uiSpawnForaY': NASCER_FORA_Y
    };
    for (let id in ids) {
        const el = document.getElementById(id);
        if (el) el.value = Math.round(ids[id] * 10) / 10;
    }
}

if (toggleEditorBtn) {
    document.getElementById('uiScaleInMin')?.addEventListener('input', e => SCALE_INDOOR_MIN = parseFloat(e.target.value) || SCALE_INDOOR_MIN);
    document.getElementById('uiScaleInMax')?.addEventListener('input', e => SCALE_INDOOR_MAX = parseFloat(e.target.value) || SCALE_INDOOR_MAX);
    document.getElementById('uiScaleOutMin')?.addEventListener('input', e => SCALE_OUTDOOR_MIN = parseFloat(e.target.value) || SCALE_OUTDOOR_MIN);
    document.getElementById('uiScaleOutMax')?.addEventListener('input', e => SCALE_OUTDOOR_MAX = parseFloat(e.target.value) || SCALE_OUTDOOR_MAX);
    
    // Teleporte Bindings
    document.getElementById('uiSpawnDentroX')?.addEventListener('input', e => NASCER_DENTRO_X = parseFloat(e.target.value) || NASCER_DENTRO_X);
    document.getElementById('uiSpawnDentroY')?.addEventListener('input', e => NASCER_DENTRO_Y = parseFloat(e.target.value) || NASCER_DENTRO_Y);
    document.getElementById('uiSpawnForaX')?.addEventListener('input', e => NASCER_FORA_X = parseFloat(e.target.value) || NASCER_FORA_X);
    document.getElementById('uiSpawnForaY')?.addEventListener('input', e => NASCER_FORA_Y = parseFloat(e.target.value) || NASCER_FORA_Y);

    document.querySelectorAll('input[name="editor-tool"]').forEach(el => {
        el.addEventListener('change', (e) => { currentTool = e.target.value; });
    });

    undoBtn.addEventListener('click', (e) => { undoHistory(); e.stopPropagation(); });

    const editorRecruitDwarfBtn = document.getElementById('editorRecruitDwarfBtn');
    const editorFlipDwarfBtn = document.getElementById('editorFlipDwarfBtn');
    const editorDwarfSize = document.getElementById('editorDwarfSize');

    if (editorRecruitDwarfBtn) {
        editorRecruitDwarfBtn.addEventListener('click', (e) => {
            dwarf.recruited = !dwarf.recruited;
            editorRecruitDwarfBtn.innerText = dwarf.recruited ? "Des-recrutar (Teste)" : "Forçar Recrutar (Teste)";
            e.stopPropagation();
        });
        editorFlipDwarfBtn.addEventListener('click', (e) => {
            dwarf.facingLeft = !dwarf.facingLeft;
            e.stopPropagation();
        });
        editorDwarfSize.addEventListener('input', (e) => {
            dwarf.scaleMult = parseFloat(e.target.value) || 1.0;
            e.stopPropagation();
        });
    }

    // --- CONTROLES DO DAYNIEL (VENDOR) NO EDITOR ---
    const editorFlipVendorBtn = document.getElementById('editorFlipVendorBtn');
    const editorVendorSize = document.getElementById('editorVendorSize');
    const editorVendorAnimateBtn = document.getElementById('editorVendorAnimateBtn');
    const editorVendorAttackBtn = document.getElementById('editorVendorAttackBtn');

    if (editorFlipVendorBtn) {
        editorFlipVendorBtn.addEventListener('click', (e) => {
            vendor.facingLeft = !vendor.facingLeft;
            e.stopPropagation();
        });
    }
    if (editorVendorSize) {
        editorVendorSize.addEventListener('input', (e) => {
            vendor.scaleMult = parseFloat(e.target.value) || 1.0;
            e.stopPropagation();
        });
    }
    if (editorVendorAnimateBtn) {
        editorVendorAnimateBtn.addEventListener('click', (e) => {
            vendor.useAnimations = !vendor.useAnimations;
            editorVendorAnimateBtn.innerText = vendor.useAnimations
                ? '🎬 Animar: LIGADO'
                : '🎬 Animar: DESLIGADO';
            e.stopPropagation();
        });
    }
    if (editorVendorAttackBtn) {
        editorVendorAttackBtn.addEventListener('click', (e) => {
            vendor.isAttacking = true;
            setTimeout(() => { vendor.isAttacking = false; }, 800);
            e.stopPropagation();
        });
    }

    toggleEditorBtn.addEventListener('click', (e) => {
        if (!editorMode) {
            // Requisitar senha
            passwordModal.classList.remove('hidden');
            passwordInput.value = '';
            passwordInput.focus();
            passwordFeedback.innerText = '';
        } else {
            // Desativar editor
            editorMode = false;
            toggleEditorBtn.innerText = "ATIVAR MODO EDITOR";
            editorTools.classList.add('hidden');
        }
        e.stopPropagation();
    });

    // Lógica da senha do editor
    const tryPassword = () => {
        if (passwordInput.value === '1234') {
            passwordInput.classList.remove('error');
            passwordInput.classList.add('success');
            passwordFeedback.className = 'success-text';
            passwordFeedback.innerText = '✓ ACESSO LIBERADO';
            
            setTimeout(() => {
                passwordModal.classList.add('hidden');
                editorMode = true;
                window.editorUnlocked = true;
                toggleEditorBtn.innerText = "DESATIVAR EDITOR";
                editorTools.classList.remove('hidden');
                passwordInput.classList.remove('success');
            }, 800);
        } else {
            passwordInput.classList.remove('success');
            passwordInput.classList.add('error');
            passwordFeedback.className = 'error-text';
            passwordFeedback.innerText = '✗ SENHA INCORRETA';
            
            setTimeout(() => {
                passwordInput.classList.remove('error');
            }, 400);
        }
    };

    passwordConfirmBtn.addEventListener('click', tryPassword);
    passwordCancelBtn.addEventListener('click', () => {
        passwordModal.classList.add('hidden');
    });
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') tryPassword();
    });

    // SHOP EVENT LISTENERS
    shopCloseBtn.addEventListener('click', () => {
        shopOverlay.classList.add('hidden');
        vendor.shopClosedManually = true;
    });

    buyRefriBtn.addEventListener('click', () => {
        if (score >= 4000) {
            score -= 4000;
            scoreElement.innerText = score;
            inventory.soda++;
            updateInventoryUI();
            updateHUDText("REFRIGERANTE COMPRADO!");
        } else {
            updateHUDText("XP INSUFICIENTE!");
        }
    });

    // (controles do vendor já registrados acima)

    exportTxtBtn.addEventListener('click', (e) => {
        let txt = "let worldCollisions = [\n";
        worldCollisions.forEach((c, idx) => { txt += `    { x: ${c.x}, y: ${c.y}, w: ${c.w}, h: ${c.h}, name: '${c.name || 'Box '+idx}' },\n`; });
        txt += "];\n\nlet foregroundBoxes = [\n";
        foregroundBoxes.forEach((c, idx) => { txt += `    { x: ${c.x}, y: ${c.y}, w: ${c.w}, h: ${c.h}, name: '${c.name || 'Box '+idx}' },\n`; });
        txt += "];\n\nlet barnCollisions = [\n";
        if (typeof barnCollisions !== 'undefined') {
            barnCollisions.forEach((c, idx) => { txt += `    { x: ${c.x}, y: ${c.y}, w: ${c.w}, h: ${c.h}, name: '${c.name || 'Box '+idx}' },\n`; });
        }
        txt += "];\n\nlet barnForegroundBoxes = [\n";
        if (typeof barnForegroundBoxes !== 'undefined') {
            barnForegroundBoxes.forEach((c, idx) => { txt += `    { x: ${c.x}, y: ${c.y}, w: ${c.w}, h: ${c.h}, name: '${c.name || 'Box '+idx}' },\n`; });
        }
        txt += "];\n\nlet enemySpawns = [\n";
        enemySpawns.forEach((c, idx) => { txt += `    { x: ${c.x}, y: ${c.y}, w: ${c.w}, h: ${c.h}, name: 'Spawn' },\n`; });
        txt += "];\n\n";

        txt += `// VARIÁVEIS DE TELEPORTE\n`;
        txt += `PORTA_ENTRADA_X_MIN = ${PORTA_ENTRADA_X_MIN};\n`;
        txt += `PORTA_ENTRADA_X_MAX = ${PORTA_ENTRADA_X_MAX};\n`;
        txt += `PORTA_ENTRADA_Y_MIN = ${PORTA_ENTRADA_Y_MIN};\n`;
        txt += `PORTA_ENTRADA_Y_MAX = ${PORTA_ENTRADA_Y_MAX};\n`;
        txt += `NASCER_DENTRO_X = ${NASCER_DENTRO_X};\n`;
        txt += `NASCER_DENTRO_Y = ${NASCER_DENTRO_Y};\n`;
        txt += `PORTA_SAIDA_X = ${PORTA_SAIDA_X};\n`;
        txt += `NASCER_FORA_X = ${NASCER_FORA_X};\n`;
        txt += `NASCER_FORA_Y = ${NASCER_FORA_Y};\n\n`;

        txt += `// ESCALAS DE PERSPECTIVA\n`;
        txt += `SCALE_OUTDOOR_MIN = ${SCALE_OUTDOOR_MIN};\n`;
        txt += `SCALE_OUTDOOR_MAX = ${SCALE_OUTDOOR_MAX};\n`;
        txt += `SCALE_INDOOR_MIN = ${SCALE_INDOOR_MIN};\n`;
        txt += `SCALE_INDOOR_MAX = ${SCALE_INDOOR_MAX};\n\n`;

        txt += `// CONFIGURAÇÃO DO ANÃO\n`;
        txt += `dwarf.x = ${dwarf.x};\n`;
        txt += `dwarf.y = ${dwarf.y};\n`;
        txt += `dwarf.scaleMult = ${dwarf.scaleMult};\n`;
        txt += `dwarf.facingLeft = ${dwarf.facingLeft};\n\n`;

        txt += `// CONFIGURAÇÃO DO VENDEDOR (DAYNIEL)\n`;
        txt += `vendor.x = ${vendor.x};\n`;
        txt += `vendor.y = ${vendor.y};\n`;
        txt += `vendor.scaleMult = ${vendor.scaleMult};\n`;
        txt += `vendor.facingLeft = ${vendor.facingLeft};\n\n`;
        
        try {
            const ta = document.createElement('textarea');
            ta.value = txt;
            ta.style.position = 'fixed';
            ta.style.top = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            alert("📋 CÓDIGO COPIADO COM SUCESSO!\n\nAs colisões de todo o jogo estão salvas na sua Área de Transferência.\n\nAgora você só precisa clicar no chat e apertar (CTRL + V) ou (Botão Direito -> Colar)!");
        } catch(err) {
            alert("Não foi possível copiar. Seu navegador bloqueou a ação.");
        }
        e.stopPropagation();
    });

    clearColsBtn.addEventListener('click', (e) => {
        saveHistory();
        worldCollisions.length = 0;
        foregroundBoxes.length = 0;
        e.stopPropagation();
    });

    // ===== SCORE TEST BUTTONS =====
    function addTestScore(amount) {
        score += amount;
        scoreElement.innerText = score;
        const editorScoreDisplay = document.getElementById('editorScoreDisplay');
        if (editorScoreDisplay) editorScoreDisplay.innerText = score;
    }

    document.getElementById('editorAdd1k')?.addEventListener('click', (e) => { addTestScore(1000); e.stopPropagation(); });
    document.getElementById('editorAdd5k')?.addEventListener('click', (e) => { addTestScore(5000); e.stopPropagation(); });
    document.getElementById('editorAdd10k')?.addEventListener('click', (e) => { addTestScore(10000); e.stopPropagation(); });
    document.getElementById('editorAddCustom')?.addEventListener('click', (e) => {
        const val = parseInt(document.getElementById('editorCustomScore')?.value) || 0;
        addTestScore(val);
        e.stopPropagation();
    });

    // Atualizar display de score no editor periodicamente
    setInterval(() => {
        const editorScoreDisplay = document.getElementById('editorScoreDisplay');
        if (editorScoreDisplay) editorScoreDisplay.innerText = score;
    }, 500);

    // ===== SIMULAR MOBILE =====
    const editorSimMobileBtn = document.getElementById('editorSimMobileBtn');
    if (editorSimMobileBtn) {
        editorSimMobileBtn.addEventListener('click', (e) => {
            isMobileMode = !isMobileMode;
            if (isMobileMode) {
                mobileControls.classList.remove('hidden');
                editorSimMobileBtn.innerText = '🖥️ DESATIVAR MODO MOBILE';
                editorSimMobileBtn.style.borderColor = '#ff4444';
                editorSimMobileBtn.style.color = '#ff4444';
            } else {
                mobileControls.classList.add('hidden');
                editorSimMobileBtn.innerText = '📱 ATIVAR MODO MOBILE';
                editorSimMobileBtn.style.borderColor = '#00aaff';
                editorSimMobileBtn.style.color = '#00aaff';
            }
            e.stopPropagation();
        });
    }

    // ===== CONTROLES DO JOYSTICK =====
    const editorJoySideBtn = document.getElementById('editorJoySideBtn');
    const editorJoySizeSlider = document.getElementById('editorJoySizeSlider');
    const editorJoySizeVal = document.getElementById('editorJoySizeVal');
    const editorJoyOpacitySlider = document.getElementById('editorJoyOpacitySlider');
    const editorJoyOpacityVal = document.getElementById('editorJoyOpacityVal');

    if (editorJoySideBtn) {
        editorJoySideBtn.addEventListener('click', (e) => {
            joystickSide = (joystickSide === 'right') ? 'left' : 'right';
            editorJoySideBtn.innerText = joystickSide === 'right' ? 'DIREITA ▶' : '◀ ESQUERDA';
            applyJoystickStyle();
            e.stopPropagation();
        });
    }
    if (editorJoySizeSlider) {
        editorJoySizeSlider.addEventListener('input', (e) => {
            joystickSize = parseInt(e.target.value);
            editorJoySizeVal.innerText = joystickSize;
            applyJoystickStyle();
            e.stopPropagation();
        });
    }
    if (editorJoyOpacitySlider) {
        editorJoyOpacitySlider.addEventListener('input', (e) => {
            joystickOpacity = parseInt(e.target.value) / 100;
            editorJoyOpacityVal.innerText = e.target.value + '%';
            applyJoystickStyle();
            e.stopPropagation();
        });
    }

    // ===== TESTE DE INIMIGOS ESPECIAIS =====
    const editorSpawnEliteTank = document.getElementById('editorSpawnEliteTank');
    const editorSpawnEliteFast = document.getElementById('editorSpawnEliteFast');
    const editorSpawnEliteRanged = document.getElementById('editorSpawnEliteRanged');

    function spawnTestElite(variant) {
        if (!gameActive) return;
        const x = player.x > MAP_WIDTH/2 ? player.x - 400 : player.x + 400;
        const y = player.y > MAP_HEIGHT/2 ? player.y - 400 : player.y + 400;
        enemies.push(new EliteEnemy(x, y, variant));
        enemiesRemaining++; // Adiciona para a onda não acabar instantaneamente
    }

    if (editorSpawnEliteTank) {
        editorSpawnEliteTank.addEventListener('click', (e) => { spawnTestElite('tank'); e.stopPropagation(); });
    }
    if (editorSpawnEliteFast) {
        editorSpawnEliteFast.addEventListener('click', (e) => { spawnTestElite('fast'); e.stopPropagation(); });
    }
    if (editorSpawnEliteRanged) {
        editorSpawnEliteRanged.addEventListener('click', (e) => { spawnTestElite('ranged'); e.stopPropagation(); });
    }
}

window.addEventListener('mousedown', e => { 
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.closest('#editor-ui')) return;
    
    if (editorMode) {
        saveHistory();

        // 1. CHECAR ARRASTE DE ENTIDADES ESPECIAIS (SPAWNS E PORTAIS)
        let foundSpecial = false;
        
        // Helper para checar clique em ponto (spawn)
        const hitPoint = (px, py) => Math.hypot(mouse.x - px, mouse.y - py) < 25;
        // Helper para checar clique em caixa (porta)
        const hitBox = (b) => mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h;

        if (currentScene === 'outdoor') {
            if (hitPoint(NASCER_FORA_X, NASCER_FORA_Y)) { isDraggingSpecial = 'spawn_fora'; foundSpecial = true; }
            else if (hitBox({x: PORTA_ENTRADA_X_MIN, y: PORTA_ENTRADA_Y_MIN, w: PORTA_ENTRADA_X_MAX - PORTA_ENTRADA_X_MIN, h: PORTA_ENTRADA_Y_MAX - PORTA_ENTRADA_Y_MIN})) {
                isDraggingSpecial = 'porta_entrada';
                dragOffset = { x: mouse.x - PORTA_ENTRADA_X_MIN, y: mouse.y - PORTA_ENTRADA_Y_MIN };
                foundSpecial = true;
            }
        } else {
            if (hitPoint(NASCER_DENTRO_X, NASCER_DENTRO_Y)) { isDraggingSpecial = 'spawn_dentro'; foundSpecial = true; }
            else if (mouse.x > PORTA_SAIDA_X) { // Faixa de saída
                isDraggingSpecial = 'porta_saida';
                foundSpecial = true;
            }
        }
        
        // Checklist Anão no Editor
        if (hitBox({x: dwarf.x - dwarf.spriteWidth/2, y: dwarf.y - dwarf.spriteHeight + 20, w: dwarf.spriteWidth, h: dwarf.spriteHeight})) {
            isDraggingSpecial = 'dwarf';
            dragOffset = { x: mouse.x - dwarf.x, y: mouse.y - dwarf.y };
            foundSpecial = true;
        }
        
        // Checklist Vendor no Editor
        if (hitBox({x: vendor.x - vendor.spriteWidth/2, y: vendor.y - vendor.spriteHeight + 20, w: vendor.spriteWidth, h: vendor.spriteHeight})) {
            isDraggingSpecial = 'vendor';
            dragOffset = { x: mouse.x - vendor.x, y: mouse.y - vendor.y };
            foundSpecial = true;
        }

        if (e.button === 2) {
            let hit = false;
            for (let i = enemySpawns.length - 1; i >= 0; i--) {
                const c = enemySpawns[i];
                if (hitBox(c)) { enemySpawns.splice(i, 1); hit = true; break; }
            }
            if (!hit) {
                let targetFgs = currentScene === 'outdoor' ? foregroundBoxes : barnForegroundBoxes;
                for (let i = targetFgs.length - 1; i >= 0; i--) {
                    const c = targetFgs[i];
                    if (hitBox(c)) { targetFgs.splice(i, 1); hit = true; break; }
                }
            }
            if (!hit) {
                let targetArray = currentScene === 'outdoor' ? worldCollisions : barnCollisions;
                for (let i = targetArray.length - 1; i >= 0; i--) {
                    const c = targetArray[i];
                    if (hitBox(c)) { targetArray.splice(i, 1); hit = true; break; }
                }
            }
            if (!hit) historyStack.pop();
        } else if (e.button === 0) {
            let hit = false;
            let targetCols = currentScene === 'outdoor' ? worldCollisions : barnCollisions;
            let targetFgs = currentScene === 'outdoor' ? foregroundBoxes : barnForegroundBoxes;
            for (let arr of [enemySpawns, targetFgs, targetCols]) {
                for (let i = arr.length - 1; i >= 0; i--) {
                     const c = arr[i];
                     if (hitBox(c)) {
                         isDraggingBox = true; draggedBox = c; dragOffset = { x: mouse.x - c.x, y: mouse.y - c.y };
                         hit = true; break;
                     }
                }
                if (hit) break;
            }
            if (!hit) {
                isDrawingCol = true; drawStart.x = mouse.x; drawStart.y = mouse.y;
            }
        }
    } else {
        // LÓGICA DE JOGO
        if (gameActive && e.button === 0) {
            // Tiro Carregado
            if (player.shootCooldown <= 0 && dialogueOverlay.classList.contains('hidden')) {
                player.isCharging = true;
                player.chargeFactor = 0;
            }
        }
    }
});

window.addEventListener('pointerup', e => {
    if (isDraggingItem) {
        if (dragIcon) { document.body.removeChild(dragIcon); dragIcon = null; }
        isDraggingItem = false;
        const dropX = mouse.x; const dropY = mouse.y;

        // Drop no Player
        if (Math.hypot(dropX - player.x, dropY - (player.y - 50)) < 90) {
            inventory.soda--;
            player.health = Math.min(player.maxHealth, player.health + player.maxHealth * 0.25);
            updateHUD(); updateHUDText("VIDA REGENERADA!"); updateInventoryUI();
            return;
        }
        // Drop no Anão (acumula refri na barra)
        if (dwarf.recruited && currentScene === 'outdoor') {
            if (Math.hypot(dropX - dwarf.x, dropY - (dwarf.y - 50)) < 90) {
                inventory.soda--;
                dwarf.sodaCount = (dwarf.sodaCount || 0) + 1;
                if (dwarf.sodaCount >= 5) {
                    dwarf.sodaCount = 0;
                    dwarf.megaBurp();
                    updateHUDText("MEGA ARROTO! RAJADA EM ÁREA!");
                } else {
                    updateHUDText(`REFRI ${dwarf.sodaCount}/5 - CONTINUE DANDO REFRIS!`);
                }
                updateInventoryUI();
                return;
            }
        }
    }

    isDraggingEditor = false;

    if (editorMode) {
        if (isDraggingBox) {
            isDraggingBox = false; draggedBox = null;
        } else if (isDraggingSpecial) {
            isDraggingSpecial = null;
        } else if (isDrawingCol && e.button === 0) {
            isDrawingCol = false;
            let w = mouse.x - drawStart.x; let h = mouse.y - drawStart.y;
            let finalX = drawStart.x; let finalY = drawStart.y;
            if (w < 0) { finalX = mouse.x; w = -w; }
            if (h < 0) { finalY = mouse.y; h = -h; }
            if (w > 10 && h > 10) {
                const newB = { x: Math.round(finalX), y: Math.round(finalY), w: Math.round(w), h: Math.round(h), name: 'Box' };
                if (currentTool === 'col') {
                    if (currentScene === 'outdoor') worldCollisions.push(newB);
                    else barnCollisions.push(newB);
                } else if (currentTool === 'fg') {
                    if (currentScene === 'outdoor') foregroundBoxes.push(newB);
                    else barnForegroundBoxes.push(newB);
                } else if (currentTool === 'spawn') {
                    enemySpawns.push(newB);
                }
            } else { historyStack.pop(); }
        }
    } else {
        if (player.isCharging && e.button === 0) {
            player.shoot(player.chargeFactor);
            player.isCharging = false;
            player.chargeFactor = 0;
            player.shootCooldown = 25; // Cooldown de ~0.4s
        }
    }
});

window.addEventListener('contextmenu', e => { if (editorMode) e.preventDefault(); });

dialogueCloseBtn.addEventListener('click', () => {
    dialogueOverlay.classList.add('hidden');
});

dialogueRecruitBtn.addEventListener('click', () => {
    if (score >= dwarf.cost) {
        score -= dwarf.cost;
        scoreElement.innerText = score;
        dwarf.recruited = true;
        updateHUDText("O ANÃO SE JUNTOU A VOCÊ! VAMOS À LUTA!");
        dialogueOverlay.classList.add('hidden');
    }
});

function updateInventoryUI() {
    if (inventory.soda > 0) {
        refriSlot.classList.remove('hidden');
    } else {
        refriSlot.classList.add('hidden');
    }
}

// DRAG AND DROP LISTENERS (POINTER EVENTS)
refriSlot.addEventListener('pointerdown', (e) => {
    if (inventory.soda <= 0) return;
    isDraggingItem = true;
    draggedItemType = 'soda';
    
    dragIcon = document.createElement('img');
    dragIcon.src = images.refri.src;
    dragIcon.id = 'drag-image';
    document.body.appendChild(dragIcon);
    
    updateDragIcon(e);
    e.preventDefault();
});

function updateDragIcon(e) {
    if (dragIcon) {
        dragIcon.style.left = (e.clientX - 20) + 'px';
        dragIcon.style.top = (e.clientY - 20) + 'px';
    }
}

class Player {
    constructor() {
        this.x = NASCER_FORA_X; // Começa onde a porta de saída está
        this.y = NASCER_FORA_Y;
        this.radius = 14;
        this.speed = 6;
        this.health = 100;
        this.maxHealth = 100;
        this.ammo = 5;
        this.maxAmmo = 5;
        this.isReloading = false;
        this.reloadTimer = 0;
        this.facingLeft = false;
        this.isMoving = false;
        this.isThrowing = false;
        this.throwFrame = 0;
        this.throwTimer = 0;
        
        // Novas variáveis de Combate Pro
        this.isCharging = false;
        this.chargeFactor = 0; // 0 a 1
        this.shootCooldown = 0;
        this.chargeColor = '#00ff88';

        this.frame = 0;
        this.frameCounter = 0;
        this.frameSpeed = 8;
        this.spriteWidth = 105;
        this.spriteHeight = 133;
    }

    getVisualCenter() {
        const scale = getDepthScale(this.y);
        return {
            x: this.x,
            y: this.y - (this.spriteHeight / 2 * scale) // Sobe do pé para o umbigo/peito
        };
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const scale = getDepthScale(this.y);
        ctx.scale(this.facingLeft ? -scale : scale, scale);
        let currentImg = images.idle;
        if (this.isThrowing) {
            currentImg = [images.namao, images.jogando, images.jogou][this.throwFrame] || images.idle;
        } else if (this.isMoving) {
            currentImg = [images.run1, images.run2, images.run3][this.frame % 3] || images.idle;
        }
        if (currentImg.complete && currentImg.naturalWidth !== 0) {
            // Desenho com ajuste para os pés ficarem na coordenada Y
            ctx.drawImage(currentImg, -this.spriteWidth/2, -this.spriteHeight + 21, this.spriteWidth, this.spriteHeight);
        } else {
            ctx.fillStyle = '#00ff88';
            ctx.fillRect(-this.radius, -50, this.radius * 2, 50);
        }
        ctx.restore();

        // Barra de Carga Pro (HUD em cima da cabeça)
        if (this.isCharging) {
            const barW = 60, barH = 8;
            const scale = getDepthScale(this.y);
            const bx = this.x - barW/2;
            const by = this.y - (this.spriteHeight * scale) - 20;
            
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(bx, by, barW, barH);
            
            // Cor muda conforme a carga
            if (this.chargeFactor < 0.5) ctx.fillStyle = '#00ff88';
            else if (this.chargeFactor < 0.9) ctx.fillStyle = 'yellow';
            else ctx.fillStyle = 'white';
            
            ctx.fillRect(bx, by, barW * this.chargeFactor, barH);
        }
    }

    update() {
        // Lógica de Recarga (1 maçã por segundo)
        if (this.isReloading) {
            this.reloadTimer++;
            if (this.reloadTimer >= 60) { // 60 frames = 1 segundo
                this.ammo++;
                this.reloadTimer = 0;
                if (this.ammo >= this.maxAmmo) {
                    this.ammo = this.maxAmmo;
                    this.isReloading = false;
                }
                updateHUD();
            }
        }

        // Lógica de Carga de tiro
        if (this.shootCooldown > 0) this.shootCooldown--;
        
        if (this.isCharging) {
            this.chargeFactor += 0.025; // Sobe em ~0.7 segundos
            if (this.chargeFactor > 1) this.chargeFactor = 1;
        } else {
            this.chargeFactor = 0;
        }

        let dx = 0, dy = 0;
        let currentSpeed = currentScene === 'indoor' ? 10 : 6; 
        
        // Fica MAIS LENTO se estiver carregando
        if (this.isCharging) currentSpeed *= 0.4;
        
        if (isMobileMode && joystick.active) {
            dx = joystick.vectorX * currentSpeed;
            dy = joystick.vectorY * currentSpeed;
        } else {
            if (keys.w && currentScene === 'outdoor') dy -= currentSpeed;
            if (keys.s && currentScene === 'outdoor') dy += currentSpeed;
            if (keys.a) dx -= currentSpeed;
            if (keys.d) dx += currentSpeed;
        }

        this.isMoving = (dx !== 0 || dy !== 0);
        if (dx < 0) this.facingLeft = true; else if (dx > 0) this.facingLeft = false;

        // Movimento independente nos eixos para fluidez
        const scale = getDepthScale(this.y);
        const dynamicRadius = this.radius;

        if (dx !== 0 && !checkWorldCollision(this.x + dx, this.y, dynamicRadius)) this.x += dx;
        if (dy !== 0 && !checkWorldCollision(this.x, this.y + dy, dynamicRadius)) this.y += dy;

        // SISTEMA ANTI-TRAVAMENTO DO PLAYER
        if (checkWorldCollision(this.x, this.y, this.radius)) {
            let pushed = false;
            const pushDirs = [[0,-4],[0,4],[-4,0],[4,0],[-3,-3],[3,-3],[-3,3],[3,3]];
            for (let dir of pushDirs) {
                if (!checkWorldCollision(this.x + dir[0], this.y + dir[1], this.radius)) {
                    this.x += dir[0]; this.y += dir[1]; pushed = true; break;
                }
            }
            if (!pushed) { this.x += 8; this.y += 8; }
        }

        // Transition Logic
        if (currentScene === 'outdoor') {
            if (this.x > PORTA_ENTRADA_X_MIN && this.x < PORTA_ENTRADA_X_MAX && 
                this.y > PORTA_ENTRADA_Y_MIN && this.y < PORTA_ENTRADA_Y_MAX && 
                !isTransitioning) {
                startTransition('indoor', NASCER_DENTRO_X, NASCER_DENTRO_Y);
            }
        } else if (currentScene === 'indoor') {
            if (this.x > PORTA_SAIDA_X && !isTransitioning) {
                startTransition('outdoor', NASCER_FORA_X, NASCER_FORA_Y);
            }
        }

        if (this.isThrowing) {
            this.throwTimer++;
            if (this.throwTimer % 6 === 0) {
                this.throwFrame++;
                if (this.throwFrame >= 3) { this.isThrowing = false; this.throwFrame = 0; this.throwTimer = 0; }
            }
        }

        if (this.isMoving) {
            this.frameCounter++;
            if (this.frameCounter >= this.frameSpeed) { this.frame++; this.frameCounter = 0; }
        } else { this.frame = 0; }
        // NÃO desenha aqui - o z-sort do animate() cuida disso
    }

    shoot(power) {
        if (this.ammo <= 0) return;
        
        this.ammo--;
        updateHUD();
        
        if (this.ammo === 0) {
            this.isReloading = true;
            this.reloadTimer = 0;
        }

        this.isThrowing = true;
        this.throwFrame = 0; this.throwTimer = 0;
        const pCenter = this.getVisualCenter();
        const angle = Math.atan2(mouse.y - pCenter.y, mouse.x - pCenter.x);
        
        // Efeito Pro: Tremor e Recuo no tiro máximo (COM ANTI-BUG DE PAREDE)
        if (power > 0.9) {
            screenShake = 15;
            const recoilX = -Math.cos(angle) * 20;
            const recoilY = -Math.sin(angle) * 20;
            // Só aplica recuo se NÃO colidir com parede
            if (!checkWorldCollision(this.x + recoilX, this.y + recoilY, this.radius)) {
                this.x += recoilX;
                this.y += recoilY;
            }
        }

        projectiles.push(new Apple(pCenter.x, pCenter.y, angle, power));
    }

    takeDamage() {
        if (this.health <= 0) return;
        this.health -= 20;
        screenShake = 15;
        
        // Partículas de dano variadas
        const dmgColors = ['#ff0000','#ff3333','#cc0000','#ff6644','#ffaa00'];
        for(let i=0; i<15; i++) particles.push(new Particle(this.x, this.y - 30, dmgColors[Math.floor(Math.random()*dmgColors.length)]));
        
        // Flash vermelho na tela
        triggerDamageFlash();
        updateHUD();

        if (this.health <= 0) {
            this.health = 0;
            endGame();
        }
    }
}

class Apple {
    constructor(x, y, angle, power = 0.1) {
        this.x = x; this.y = y;
        this.power = power;
        this.speed = 10 + (power * 25); // Velocidade escala com a carga
        this.damage = 1 + Math.floor(power * 4); // Dano 1 a 5
        this.velocity = { x: Math.cos(angle) * this.speed, y: Math.sin(angle) * this.speed };
        this.size = 20 + (power * 20); // Tamanho visual
        this.pierce = power > 0.9; // Atravessa se for tiro carregado
        this.spent = false; // Para evitar múltiplos hits sem pierce
        this.hitEnemies = []; // Evita dano múltiplo em piercing
    }
    draw() {
        const scale = getDepthScale(this.y);
        ctx.save();
        ctx.translate(this.x, this.y);
        // Brilho se estiver forte
        if (this.power > 0.9) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'yellow';
        }
        if (images.maca.complete && images.maca.naturalWidth !== 0) {
            ctx.drawImage(images.maca, -(this.size*scale)/2, -(this.size*scale)/2, this.size*scale, this.size*scale);
        } else {
            ctx.fillStyle = this.power > 0.9 ? 'white' : 'red';
            ctx.beginPath(); ctx.arc(0, 0, (this.size/2)*scale, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
    update() {
        this.x += this.velocity.x; this.y += this.velocity.y;
        this.draw();
    }
}

class Particle {
    constructor(x, y, color, options = {}) {
        this.x = x; this.y = y;
        const ang = Math.random() * Math.PI * 2;
        const spd = options.speed || (Math.random() * 5 + 2);
        this.vx = Math.cos(ang) * spd;
        this.vy = Math.sin(ang) * spd - (options.rise || 0);
        this.life = 1.0;
        this.color = color;
        this.size = options.size || (Math.random() * 5 + 2);
        this.gravity = options.gravity || 0;
        this.glow = options.glow || false;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.vy += this.gravity;
        this.vx *= 0.98; this.vy *= 0.98;
        this.life -= 0.03;
        this.draw();
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        if (this.glow) { ctx.shadowBlur = 8; ctx.shadowColor = this.color; }
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.restore();
    }
}

// Números de dano flutuantes
class DamageNumber {
    constructor(x, y, value, color = '#fff') {
        this.x = x + (Math.random() - 0.5) * 20;
        this.y = y;
        this.value = value;
        this.color = color;
        this.life = 1.0;
        this.vy = -2.5;
    }
    update() {
        this.y += this.vy;
        this.vy *= 0.96;
        this.life -= 0.025;
        this.draw();
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.font = `bold ${18 + this.value * 2}px VT323`;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(`-${this.value}`, this.x, this.y);
        ctx.fillText(`-${this.value}`, this.x, this.y);
        ctx.restore();
    }
}

function triggerDamageFlash() {
    if (screenEffects) {
        screenEffects.classList.add('damage-flash');
        setTimeout(() => screenEffects.classList.remove('damage-flash'), 300);
    }
}

// Projétil do Boss
class BossProjectile {
    constructor(x, y, angle, speed = 5) {
        this.x = x; this.y = y;
        this.speed = speed;
        this.velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
        this.size = 14;
        this.damage = 15;
        this.life = 1.0;
    }
    draw() {
        const s = getDepthScale(this.y);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = this.life;
        ctx.shadowBlur = 12; ctx.shadowColor = '#ff0000';
        ctx.fillStyle = '#cc0000';
        ctx.beginPath(); ctx.arc(0, 0, (this.size/2)*s, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff4400';
        ctx.beginPath(); ctx.arc(0, 0, (this.size/3)*s, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    update() {
        this.x += this.velocity.x; this.y += this.velocity.y;
        this.life -= 0.005;
        // Trail
        if (Math.random() < 0.5) particles.push(new Particle(this.x, this.y, '#ff3300', { size: 3, speed: 1 }));
        this.draw();
    }
}

let bossProjectiles = [];

class Enemy {
    constructor(x, y, isBoss = false) {
        this.x = x; this.y = y;
        this.isBoss = isBoss;
        this.radius = isBoss ? 60 : 25;
        this.maxHealth = isBoss ? 500 : 2 + Math.floor(currentWave / 2);
        this.health = this.maxHealth;
        this.speed = isBoss ? 2 : (2.5 + Math.random() * (currentWave * 0.15));
        this.baseSpeed = this.speed;
        this.opacity = isBoss ? 0 : 1;
        
        // XP Escala com a dificuldade da onda. Normal base = 100
        this.xpValue = isBoss ? 5000 : Math.floor(100 + (currentWave * 15) + (this.maxHealth * 5));
        
        // Animação sprite
        this.frame = 0;
        this.frameCounter = 0;
        this.frameSpeed = isBoss ? 5 : 8; // Boss anima mais rápido
        this.spriteWidth = isBoss ? 120 : 80;
        this.spriteHeight = isBoss ? 140 : 100;
        
        // Anti-Bug
        this.stuckTimer = 0;
        this.lastX = x;
        this.lastY = y;
        
        // Boss Attack Patterns
        if (isBoss) {
            this.attackPattern = 'chase';
            this.attackTimer = 0;
            this.attackCooldown = 180;
            this.chargeDir = { x: 0, y: 0 };
            this.chargeTimer = 0;
            this.stompLanding = false;
            this.stompJumpY = 0;
            activeBoss = this;
        }
    }
    draw() {
        const scale = getDepthScale(this.y);
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x, this.y - (this.stompJumpY || 0));
        
        // Espelhamento baseado na posição do player
        let facingLeft = (player.x < this.x);
        // O sprite ramo original parece estar desenhado olhando para a esquerda.
        // Logo, se ele deve olhar para a direita (facingLeft = false), precisamos fatiar com -scale.
        ctx.scale(facingLeft ? scale : -scale, scale);
        
        // Avançar frame de animação
        this.frameCounter++;
        if (this.frameCounter >= this.frameSpeed) {
            this.frameCounter = 0;
            this.frame = (this.frame + 1) % 3;
        }
        const ramos = [images.ramo1, images.ramo2, images.ramo3];
        const currentRamo = ramos[this.frame];
        const spriteOk = currentRamo && currentRamo.complete && currentRamo.naturalWidth !== 0;
        
        if (this.isBoss) {
            const bossScale = 2.0; // Boss é 2x maior
            const bW = this.spriteWidth * bossScale;
            const bH = this.spriteHeight * bossScale;
            
            if (spriteOk) {
                // Glow vermelho antes de desenhar o sprite
                ctx.shadowBlur = 30 + Math.sin(Date.now() / 200) * 10;
                ctx.shadowColor = '#ff0000';
                
                // Desenhar sprite com tint vermelho via compositing
                const offC = document.createElement('canvas');
                offC.width = bW; offC.height = bH;
                const offCtx = offC.getContext('2d');
                offCtx.drawImage(currentRamo, 0, 0, bW, bH);
                offCtx.globalCompositeOperation = 'source-atop';
                offCtx.fillStyle = 'rgba(255, 0, 0, 0.45)';
                offCtx.fillRect(0, 0, bW, bH);
                
                ctx.drawImage(offC, -bW/2, -bH + 21);
                
                // Anel externo brilhante
                ctx.shadowBlur = 25; ctx.shadowColor = '#ff2200';
                ctx.strokeStyle = '#ff2200'; ctx.lineWidth = 4;
                ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.stroke();
                
                // Olhos brilhantes sobrepostos
                ctx.fillStyle = '#ff0033'; ctx.shadowBlur = 20; ctx.shadowColor = '#ff0000';
                ctx.beginPath(); ctx.arc(-18, -bH*0.55, 10, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(18, -bH*0.55, 10, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#ffcc00'; ctx.shadowBlur = 0;
                ctx.beginPath(); ctx.arc(-18, -bH*0.55, 4, 0, Math.PI*2); ctx.fill();
                ctx.beginPath(); ctx.arc(18, -bH*0.55, 4, 0, Math.PI*2); ctx.fill();
            } else {
                // Fallback sem sprite
                ctx.shadowBlur = 20; ctx.shadowColor = '#ff0000';
                ctx.fillStyle = '#440000';
                ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#ff2200'; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(0, 0, this.radius + 5, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = '#ff0033';
                ctx.beginPath(); ctx.arc(-20, -15, 12, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(20, -15, 12, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ffcc00';
                ctx.beginPath(); ctx.arc(-20, -15, 5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(20, -15, 5, 0, Math.PI * 2); ctx.fill();
            }
            
            // Partículas ambientais do boss
            if (this.opacity >= 1 && Math.random() < 0.15) {
                particles.push(new Particle(this.x + (Math.random()-0.5)*60, this.y + (Math.random()-0.5)*60, '#ff2200', { size: 3, speed: 1, glow: true }));
            }
        } else {
            // Inimigo normal com sprite ramo
            if (spriteOk) {
                ctx.shadowBlur = 8; ctx.shadowColor = '#440000';
                ctx.drawImage(currentRamo, -this.spriteWidth/2, -this.spriteHeight + 15, this.spriteWidth, this.spriteHeight);
            } else {
                ctx.fillStyle = '#444';
                ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#ff0033';
                ctx.beginPath(); ctx.arc(-8, -10, 4, 0, Math.PI * 2);
                ctx.arc(8, -10, 4, 0, Math.PI * 2); ctx.fill();
            }
        }
        
        ctx.restore();
        
        // Atualiza barra do boss no HUD
        if (this.isBoss && this.opacity >= 1 && bossHealthBarFill) {
            const pct = Math.max(0, this.health / this.maxHealth) * 100;
            bossHealthBarFill.style.width = pct + '%';
        }
    }
    
    bossAttackUpdate() {
        if (!this.isBoss || this.opacity < 1) return;
        const pCenter = player.getVisualCenter();
        const dist = Math.hypot(pCenter.x - this.x, pCenter.y - this.y);
        
        this.attackTimer++;
        
        if (this.attackPattern === 'chase') {
            this.speed = this.baseSpeed;
            if (this.attackTimer >= this.attackCooldown) {
                this.attackTimer = 0;
                const hpPct = this.health / this.maxHealth;
                // Escolher ataque baseado em HP
                const rng = Math.random();
                if (hpPct < 0.3) {
                    // Baixo HP = mais agressivo
                    this.attackPattern = rng < 0.4 ? 'charge' : (rng < 0.7 ? 'bullets' : 'stomp');
                } else if (hpPct < 0.6) {
                    this.attackPattern = rng < 0.5 ? 'charge' : 'bullets';
                } else {
                    this.attackPattern = rng < 0.6 ? 'charge' : 'bullets';
                }
                
                if (this.attackPattern === 'charge') {
                    const angle = Math.atan2(pCenter.y - this.y, pCenter.x - this.x);
                    this.chargeDir = { x: Math.cos(angle), y: Math.sin(angle) };
                    this.chargeTimer = 90; // 1.5s
                    screenShake = 5;
                    updateHUDText('BOSS INVESTIDA!');
                } else if (this.attackPattern === 'bullets') {
                    // Atira 8 projéteis circulares
                    for (let i = 0; i < 8; i++) {
                        const angle = (Math.PI * 2 / 8) * i;
                        bossProjectiles.push(new BossProjectile(this.x, this.y, angle, 4));
                    }
                    screenShake = 10;
                    for (let i = 0; i < 15; i++) particles.push(new Particle(this.x, this.y, '#ff3300', { glow: true }));
                    this.attackPattern = 'chase';
                    this.attackCooldown = 300;
                } else if (this.attackPattern === 'stomp') {
                    this.stompJumpY = 0;
                    this.chargeTimer = 60;
                    updateHUDText('BOSS PISÃO!');
                }
            }
        } else if (this.attackPattern === 'charge') {
            this.speed = 8;
            this.chargeTimer--;
            // Trail de partículas
            particles.push(new Particle(this.x, this.y, '#ff4400', { size: 6, glow: true }));
            if (this.chargeTimer <= 0) {
                this.attackPattern = 'chase';
                this.attackCooldown = 180;
                this.speed = this.baseSpeed;
            }
        } else if (this.attackPattern === 'stomp') {
            this.chargeTimer--;
            this.speed = 0;
            if (this.chargeTimer > 30) {
                this.stompJumpY = Math.min(80, this.stompJumpY + 5);
            } else if (this.chargeTimer > 0) {
                this.stompJumpY = Math.max(0, this.stompJumpY - 8);
            } else {
                this.stompJumpY = 0;
                // Onda de choque empurra player
                screenShake = 25;
                for (let i = 0; i < 30; i++) particles.push(new Particle(this.x, this.y, '#ffaa00', { size: 5, speed: 6, glow: true }));
                if (dist < 200) {
                    const pushAngle = Math.atan2(pCenter.y - this.y, pCenter.x - this.x);
                    const pushX = player.x + Math.cos(pushAngle) * 80;
                    const pushY = player.y + Math.sin(pushAngle) * 80;
                    if (!checkWorldCollision(pushX, pushY, player.radius)) {
                        player.x = pushX; player.y = pushY;
                    }
                    player.takeDamage();
                }
                this.attackPattern = 'chase';
                this.attackCooldown = 360;
                this.speed = this.baseSpeed;
            }
        }
    }
    
    update() {
        if (currentScene === 'outdoor') {
            // Boss fade-in
            if (this.isBoss && this.opacity < 1) {
                this.opacity += 0.008;
                if (this.opacity >= 1) {
                    this.opacity = 1;
                    bossBarContainer.classList.add('active');
                }
            }
            
            // Boss attacks
            if (this.isBoss) this.bossAttackUpdate();
            
            const pCenter = player.health > 0 ? player.getVisualCenter() : { x: player.x, y: player.y };
            let moveAngle;
            if (this.isBoss && this.attackPattern === 'charge') {
                moveAngle = Math.atan2(this.chargeDir.y, this.chargeDir.x);
            } else {
                moveAngle = Math.atan2(pCenter.y - this.y, pCenter.x - this.x);
            }
            const dx = Math.cos(moveAngle) * this.speed, dy = Math.sin(moveAngle) * this.speed;
            
            let moved = false;
            if (!checkWorldCollision(this.x + dx, this.y, this.radius)) { this.x += dx; moved = true; }
            if (!checkWorldCollision(this.x, this.y + dy, this.radius)) { this.y += dy; moved = true; }

            // Anti-clumping (separa inimigos próximos levemente)
            enemies.forEach(other => {
                if (other !== this && Math.hypot(this.x - other.x, this.y - other.y) < this.radius + other.radius) {
                    const ang = Math.atan2(this.y - other.y, this.x - other.x);
                    this.x += Math.cos(ang) * 1.5;
                    this.y += Math.sin(ang) * 1.5;
                }
            });

            if (Math.hypot(this.x - this.lastX, this.y - this.lastY) < 0.5) {
                this.stuckTimer++;
            } else { this.stuckTimer = 0; }

            if (this.stuckTimer > 90) {
                this.stuckTimer = 0;
                this.x += Math.cos(moveAngle) * 30;
                this.y += Math.sin(moveAngle) * 30;
            }
            
            this.lastX = this.x;
            this.lastY = this.y;

            if (checkWorldCollision(this.x, this.y, this.radius)) {
                const angleOut = Math.atan2(this.y - pCenter.y, this.x - pCenter.x);
                this.x += Math.cos(angleOut) * 10;
                this.y += Math.sin(angleOut) * 10;
            }
            
            // Boss partículas ambientais
            if (this.isBoss && this.opacity >= 1 && Math.random() < 0.15) {
                particles.push(new Particle(this.x + (Math.random()-0.5)*60, this.y + (Math.random()-0.5)*60, '#ff2200', { size: 3, speed: 1, glow: true }));
            }
        }
        this.draw();
    }
}

// INIMIGOS ELITE (Intermediários pré-boss)
class EliteEnemy extends Enemy {
    constructor(x, y, variant) {
        super(x, y, false);
        this.variant = variant; // 'tank', 'fast', 'ranged'
        this.isElite = true;
        this.shootCooldown = 0;
        
        if (variant === 'tank') {
            this.radius = 35;
            this.maxHealth = (2 + Math.floor(currentWave / 2)) * 4;
            this.health = this.maxHealth;
            this.speed = 1.5;
            this.color = '#cc6600';
            this.eyeColor = '#ff9900';
            this.xpValue = Math.floor(300 + (currentWave * 25));
        } else if (variant === 'fast') {
            this.radius = 18;
            this.maxHealth = (2 + Math.floor(currentWave / 2)) * 2;
            this.health = this.maxHealth;
            this.speed = 5 + Math.random();
            this.color = '#990066';
            this.eyeColor = '#ff00cc';
            this.xpValue = Math.floor(250 + (currentWave * 20));
        } else { // ranged
            this.radius = 22;
            this.maxHealth = (2 + Math.floor(currentWave / 2)) * 3;
            this.health = this.maxHealth;
            this.speed = 1.8;
            this.color = '#003366';
            this.eyeColor = '#0099ff';
            this.xpValue = Math.floor(350 + (currentWave * 30));
        }
    }
    draw() {
        const scale = getDepthScale(this.y);
        ctx.save();
        ctx.translate(this.x, this.y);
        
        let facingLeft = (player.x < this.x);
        ctx.scale(facingLeft ? scale : -scale, scale);
        
        this.frameCounter++;
        if (this.frameCounter >= this.frameSpeed) {
            this.frameCounter = 0;
            this.frame = (this.frame + 1) % 3;
        }
        const ramos = [images.ramo1, images.ramo2, images.ramo3];
        const currentRamo = ramos[this.frame];
        const spriteOk = currentRamo && currentRamo.complete && currentRamo.naturalWidth !== 0;
        
        if (spriteOk) {
            let eliteScale = 1.0;
            let myAlpha = 0.6;
            
            if (this.variant === 'tank') {
                eliteScale = 1.7; // Muito maior
                myAlpha = 0.8; // Mais opaco/colorido
                ctx.shadowBlur = 25; 
            }
            else if (this.variant === 'fast') {
                eliteScale = 0.65; // Menorzinho e ágil
                myAlpha = 0.5;
                ctx.shadowBlur = 30; // Glow mais forte
            }
            else if (this.variant === 'ranged') {
                eliteScale = 1.15; // Um pouco mais alto
                myAlpha = 0.7;
                ctx.shadowBlur = 20;
            }
            
            const bW = this.spriteWidth * eliteScale;
            const bH = this.spriteHeight * eliteScale;
            
            ctx.shadowColor = this.color;
            
            const offC = document.createElement('canvas');
            offC.width = bW; offC.height = bH;
            const offCtx = offC.getContext('2d');
            offCtx.drawImage(currentRamo, 0, 0, bW, bH);
            offCtx.globalCompositeOperation = 'source-atop';
            offCtx.fillStyle = this.color;
            offCtx.globalAlpha = myAlpha;
            offCtx.fillRect(0, 0, bW, bH);
            
            ctx.drawImage(offC, -bW/2, -bH + 15 * eliteScale);
            
            // Olhos
            ctx.fillStyle = this.eyeColor; 
            ctx.shadowBlur = this.variant === 'fast' ? 20 : 15; 
            ctx.shadowColor = this.eyeColor;
            let eyeRadius = this.variant === 'tank' ? 8 * eliteScale : 6 * eliteScale;
            ctx.beginPath(); ctx.arc(-10 * eliteScale, -bH * 0.55, eyeRadius, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(10 * eliteScale, -bH * 0.55, eyeRadius, 0, Math.PI*2); ctx.fill();
            
            // Halo de energia externo para o Ranged
            if (this.variant === 'ranged') {
                ctx.strokeStyle = this.eyeColor;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, -bH/2, bW/2 + Math.sin(Date.now()/150)*5, 0, Math.PI*2);
                ctx.stroke();
            }
        } else {
            // Fallback (bolinhas coloridas)
            ctx.shadowBlur = 10; ctx.shadowColor = this.eyeColor;
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = this.eyeColor; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = this.eyeColor;
            const eOff = this.radius * 0.35;
            ctx.beginPath(); ctx.arc(-eOff, -5, 4, 0, Math.PI * 2);
            ctx.arc(eOff, -5, 4, 0, Math.PI * 2); ctx.fill();
        }
        
        ctx.restore();
    }
    update() {
        if (currentScene === 'outdoor') {
            const pCenter = player.getVisualCenter();
            const angle = Math.atan2(pCenter.y - this.y, pCenter.x - this.x);
            const dist = Math.hypot(pCenter.x - this.x, pCenter.y - this.y);
            
            // Ranged: manter distância e atirar
            if (this.variant === 'ranged') {
                if (dist > 250) {
                    const dx = Math.cos(angle) * this.speed; const dy = Math.sin(angle) * this.speed;
                    if (!checkWorldCollision(this.x + dx, this.y, this.radius)) this.x += dx;
                    if (!checkWorldCollision(this.x, this.y + dy, this.radius)) this.y += dy;
                } else if (dist < 180) {
                    // Recuar
                    const dx = -Math.cos(angle) * this.speed; const dy = -Math.sin(angle) * this.speed;
                    if (!checkWorldCollision(this.x + dx, this.y, this.radius)) this.x += dx;
                    if (!checkWorldCollision(this.x, this.y + dy, this.radius)) this.y += dy;
                }
                this.shootCooldown--;
                if (this.shootCooldown <= 0 && dist < 400) {
                    bossProjectiles.push(new BossProjectile(this.x, this.y, angle, 5));
                    this.shootCooldown = 120; // 2s
                }
            } else {
                // Tank e Fast: perseguir normalmente
                const dx = Math.cos(angle) * this.speed; const dy = Math.sin(angle) * this.speed;
                if (!checkWorldCollision(this.x + dx, this.y, this.radius)) this.x += dx;
                if (!checkWorldCollision(this.x, this.y + dy, this.radius)) this.y += dy;
            }
            
            // Anti-clumping (separa inimigos próximos levemente)
            enemies.forEach(other => {
                if (other !== this && Math.hypot(this.x - other.x, this.y - other.y) < this.radius + other.radius) {
                    const ang = Math.atan2(this.y - other.y, this.x - other.x);
                    this.x += Math.cos(ang) * 1.5;
                    this.y += Math.sin(ang) * 1.5;
                }
            });
            
            // Anti-stuck
            if (Math.hypot(this.x - this.lastX, this.y - this.lastY) < 0.5) this.stuckTimer++;
            else this.stuckTimer = 0;
            if (this.stuckTimer > 90) { this.stuckTimer = 0; this.x += Math.cos(angle) * 30; this.y += Math.sin(angle) * 30; }
            this.lastX = this.x; this.lastY = this.y;
            if (checkWorldCollision(this.x, this.y, this.radius)) {
                const ao = Math.atan2(this.y - pCenter.y, this.x - pCenter.x);
                this.x += Math.cos(ao) * 10; this.y += Math.sin(ao) * 10;
            }
        }
        this.draw();
    }
}

function startWave() {
    waveActive = true;
    enemiesToSpawn = 5 + (currentWave * 4);
    enemiesRemaining = enemiesToSpawn;
    
    // Intro do Boss na onda 10
    if (currentWave === 10) {
        bossIntroActive = true;
        // Boss Intro Screen
        if (bossIntroOverlay) bossIntroOverlay.classList.add('active');
        screenShake = 15;
        
        setTimeout(() => {
            if (bossIntroOverlay) bossIntroOverlay.classList.remove('active');
            waveOverlay.classList.add('wave-active');
            waveText.innerText = "GUARDIÃO DA FAZENDA";
            
            setTimeout(() => {
                waveOverlay.classList.remove('wave-active');
                spawnEnemy(true); // Spawn Boss
                enemiesToSpawn--;
                
                // Spawn outros inimigos depois
                spawnInterval = setInterval(() => {
                    if (currentScene !== 'outdoor' || bossIntroActive) return;
                    if (enemiesToSpawn > 0) {
                        spawnEnemy(false);
                        enemiesToSpawn--;
                    } else { clearInterval(spawnInterval); }
                }, 1000);
                
                bossIntroActive = false;
            }, 2000);
        }, 3000);
        return;
    }

    waveOverlay.classList.add('wave-active');
    waveText.innerText = `ONDA ${currentWave}`;
    setTimeout(() => {
        waveOverlay.classList.remove('wave-active');
        spawnInterval = setInterval(() => {
            if (currentScene !== 'outdoor' || bossIntroActive) return;
            if (enemiesToSpawn > 0) {
                spawnEnemy(false);
                enemiesToSpawn--;
            } else { clearInterval(spawnInterval); }
        }, 1000);
    }, 2000);
}

function spawnEnemy(isBoss) {
    let spawnAttempts = 0;
    let x, y;
    const enemyRadius = isBoss ? 60 : 25;
    
    // Tenta usar Spawns manuais primeiro (se existirem caixas vermelhas)
    let foundPos = false;
    if (enemySpawns.length > 0) {
        while (spawnAttempts < 50) {
            const sp = enemySpawns[Math.floor(Math.random() * enemySpawns.length)];
            const tx = sp.x + (Math.random() * sp.w);
            const ty = sp.y + (Math.random() * sp.h);
            
            if (!checkWorldCollision(tx, ty, enemyRadius + 10)) { // +10px de margem
                x = tx; y = ty; foundPos = true; break;
            }
            spawnAttempts++;
        }
    } 
    
    if (!foundPos) {
        spawnAttempts = 0;
        while (spawnAttempts < 50) {
            const side = Math.floor(Math.random() * 4);
            if (side === 0) { x = player.x + 800 + Math.random() * 200; y = player.y + (Math.random() * 800 - 400); }
            else if (side === 1) { x = player.x - 800 - Math.random() * 200; y = player.y + (Math.random() * 800 - 400); }
            else if (side === 2) { x = player.x + (Math.random() * 800 - 400); y = player.y + 600 + Math.random() * 200; }
            else { x = player.x + (Math.random() * 800 - 400); y = player.y - 600 - Math.random() * 200; }
            
            x = Math.max(100, Math.min(MAP_WIDTH - 100, x));
            y = Math.max(100, Math.min(MAP_HEIGHT - 100, y));

            if (!checkWorldCollision(x, y, enemyRadius + 10)) { foundPos = true; break; }
            spawnAttempts++;
        }
    }

    // Fallback absoluto: Se ainda não achou, spawn no player com distância
    if (!foundPos) {
        x = player.x > MAP_WIDTH/2 ? 200 : MAP_WIDTH-200;
        y = player.y > MAP_HEIGHT/2 ? 200 : MAP_HEIGHT-200;
    }

    if (isBoss) {
        enemies.push(new Enemy(x, y, true));
    } else {
        // Spawn Inimigo Normal ou Elite (Antecipado para a Wave 2 para melhor demonstração)
        const spawnElite = currentWave >= 2 && Math.random() < Math.min(0.5, (currentWave - 1) * 0.15);
        if (spawnElite) {
            const variants = ['tank', 'fast', 'ranged'];
            const variant = variants[Math.floor(Math.random() * variants.length)];
            enemies.push(new EliteEnemy(x, y, variant));
        } else {
            enemies.push(new Enemy(x, y, false));
        }
    }
}

function updateHUD() {
    // 1. Atualiza Barra de Vida
    const healthFill = document.getElementById('health-bar-fill');
    if (healthFill) {
        const hPercent = (player.health / player.maxHealth) * 100;
        healthFill.style.width = hPercent + '%';
        // Muda a cor se estiver baixa
        if (hPercent < 30) healthFill.style.background = 'linear-gradient(90deg, #ff4444 0%, #cc0000 100%)';
        else healthFill.style.background = 'linear-gradient(90deg, #00ff88 0%, #00cc66 100%)';
    }

    // 2. Atualiza Maçãs (Munição)
    const ammoContainer = document.getElementById('ammo-container');
    if (!ammoContainer) return;

    ammoContainer.innerHTML = '';
    for (let i = 0; i < player.maxAmmo; i++) {
        const appleImg = document.createElement('img');
        appleImg.src = images.maca.src; 
        appleImg.classList.add('hud-apple');
        
        if (i >= player.ammo) {
            appleImg.classList.add('empty');
            // Se estiver recarregando a PRÓXIMA maçã, faz ela piscar
            if (player.isReloading && i === player.ammo) {
                appleImg.classList.add('reloading');
            }
        }
        
        ammoContainer.appendChild(appleImg);
    }
}

let isTransitioning = false;
function startTransition(newScene, destX, destY) {
    isTransitioning = true;
    let fadeOut = setInterval(() => {
        sceneAlpha += 0.05;
        if (sceneAlpha >= 1) {
            clearInterval(fadeOut);
            currentScene = newScene;
            player.x = destX;
            player.y = destY;
            camera.x = player.x - canvas.width / 2;
            camera.y = player.y - canvas.height / 2;
            let fadeIn = setInterval(() => {
                sceneAlpha -= 0.05;
                if (sceneAlpha <= 0) {
                    sceneAlpha = 0;
                    clearInterval(fadeIn);
                    isTransitioning = false;
                }
            }, 30);
        }
    }, 30);
}

let player = new Player();
let projectiles = [];
let enemies = [];
let allyProjectiles = [];

class Vendor {
    constructor() {
        this.x = 256;
        this.y = 949;
        this.spawnX = this.x;
        this.spawnY = this.y;
        this.spriteWidth = 105;
        this.spriteHeight = 133;
        this.scaleMult = 1;
        this.facingLeft = true;
        this.shopClosedManually = false;
        // Animação
        this.frame = 0;
        this.frameCounter = 0;
        this.frameSpeed = 8;
        this.useAnimations = false; // Ativado pelo editor
        this.isMoving = false;
        this.isAttacking = false;
        this.attackTimer = 0;
    }
    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        const scale = getDepthScale(this.y) * this.scaleMult;
        ctx.scale(this.facingLeft ? -scale : scale, scale);
        
        // Avançar frame
        this.frameCounter++;
        if (this.frameCounter >= this.frameSpeed) {
            this.frameCounter = 0;
            this.frame = (this.frame + 1) % 3;
        }
        
        let currentImg = images.vendor;
        if (this.useAnimations) {
            if (this.isAttacking) {
                currentImg = images.dattack;
            } else if (this.isMoving) {
                currentImg = [images.drun1, images.drun2, images.vendor][this.frame];
            } else {
                // Idle: alterna suavemente entre idle e run1
                currentImg = this.frame === 2 ? images.drun1 : images.vendor;
            }
        }
        
        if (currentImg && currentImg.complete && currentImg.naturalHeight !== 0) {
            ctx.drawImage(currentImg, -this.spriteWidth/2, -this.spriteHeight + 21, this.spriteWidth, this.spriteHeight);
        } else {
            // Fallback para imagem base
            if (images.vendor.complete && images.vendor.naturalHeight !== 0) {
                ctx.drawImage(images.vendor, -this.spriteWidth/2, -this.spriteHeight + 21, this.spriteWidth, this.spriteHeight);
            } else {
                ctx.fillStyle = 'blue'; ctx.fillRect(-20, -this.spriteHeight + 21, 40, this.spriteHeight);
            }
        }
        ctx.restore();
    }
    update() {
        if (currentScene === 'outdoor') {
            this.draw();
            const dist = Math.hypot(player.x - this.x, player.y - (this.y - (this.spriteHeight/2)*this.scaleMult));
            if (dist < 150) {
                this.isMoving = false; // Parado quando player perto
                if (!this.shopClosedManually && shopOverlay.classList.contains('hidden')) {
                    shopOverlay.classList.remove('hidden');
                }
            } else {
                if (!shopOverlay.classList.contains('hidden')) shopOverlay.classList.add('hidden');
                this.shopClosedManually = false;
                this.isMoving = false;
            }
        }
    }
}

class AllyProjectile {
    constructor(x, y, targetEnemy) {
        this.x = x; this.y = y;
        const angle = Math.atan2(targetEnemy.y - this.y, targetEnemy.x - this.x);
        this.speed = 12;
        this.damage = 3;
        this.velocity = { x: Math.cos(angle) * this.speed, y: Math.sin(angle) * this.speed };
        this.size = 15;
    }
    draw() {
        const scale = getDepthScale(this.y);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'white';
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.beginPath(); ctx.arc(0, 0, (this.size/2)*scale, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    update() {
        this.x += this.velocity.x; this.y += this.velocity.y;
        this.draw();
    }
}

class Dwarf {
    constructor() {
        this.x = 409;
        this.y = 1287;
        this.spawnX = this.x;
        this.spawnY = this.y;
        this.radius = 21;
        this.spriteWidth = 105;
        this.spriteHeight = 133;
        this.recruited = false;
        this.cost = 5000;
        this.maxHealth = 100;
        this.health = 100;
        this.speed = 5;
        this.scaleMult = 0.8; 
        this.facingLeft = false;
        this.isMoving = false;
        this.frame = 0;
        this.frameCounter = 0;
        this.frameSpeed = 8;
        this.shootCooldown = 0;
        this.evolved = false;
        this.evolveTimer = 0;
        this.burpCooldown = 0;
        this.sodaCount = 0;
        this.maxSoda = 5;
    }

    getVisualCenter() {
        const scale = getDepthScale(this.y);
        return { x: this.x, y: this.y - (this.spriteHeight / 2 * scale) };
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        let visualScale = this.scaleMult;
        // Ajuste pedido: Aumentar proporção do anão ao ficar parado (Idle) fora do celeiro
        if (currentScene === 'outdoor' && !this.isMoving) {
            visualScale *= 1.15; 
        }
        
        const scale = getDepthScale(this.y) * visualScale;
        ctx.scale(this.facingLeft ? -scale : scale, scale);
        
        if (this.evolved) {
            ctx.shadowBlur = 30 + Math.sin(Date.now() / 150) * 15;
            ctx.shadowColor = '#00ffcc';
        }

        let currentImg = images.anao;
        if (this.isMoving) {
            currentImg = [images.arun1, images.arun2, images.arun3][this.frame % 3] || images.anao;
        }
        
        if (currentImg.complete && currentImg.naturalWidth !== 0) {
            ctx.drawImage(currentImg, -this.spriteWidth/2, -this.spriteHeight + 21, this.spriteWidth, this.spriteHeight);
        } else {
            ctx.fillStyle = '#aaa';
            ctx.fillRect(-this.radius, -this.spriteHeight + 21, this.radius * 2, this.spriteHeight);
        }
        ctx.shadowBlur = 0;
        ctx.restore();
        
        if (this.recruited && currentScene === 'outdoor') {
            const barW = 40, barH = 5;
            const bx = this.x - barW/2;
            const by = this.y - (this.spriteHeight * scale) - 10;
            // Barra de vida
            ctx.fillStyle = 'red';
            ctx.fillRect(bx, by, barW, barH);
            ctx.fillStyle = '#00ff88';
            ctx.fillRect(bx, by, barW * (Math.max(0, this.health) / this.maxHealth), barH);
            
            // Barra de refri (acima da barra de vida)
            const refriBarY = by - barH - 4;
            ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
            ctx.fillRect(bx, refriBarY, barW, barH);
            ctx.fillStyle = '#00ccff';
            ctx.fillRect(bx, refriBarY, barW * ((this.sodaCount || 0) / this.maxSoda), barH);
            // Borda da barra de refri
            ctx.strokeStyle = '#00ccff';
            ctx.lineWidth = 1;
            ctx.strokeRect(bx, refriBarY, barW, barH);
            // Ícone de refri ao lado
            if (images.refri.complete && images.refri.naturalWidth !== 0) {
                ctx.drawImage(images.refri, bx - 14, refriBarY - 3, 12, 12);
            }
        }
    }

    burp() {
        const dir = this.facingLeft ? -1 : 1;
        const baseAngle = this.facingLeft ? Math.PI : 0;
        const spread = Math.PI / 5;
        const numProjectiles = 8; // MAIS PROJÉTEIS

        screenShake = 10;
        for (let i = 0; i < numProjectiles; i++) {
            const angle = baseAngle + (i - Math.floor(numProjectiles/2)) * (spread / numProjectiles);
            const speed = 20 + Math.random() * 6; // MAIS VELOZ
            const center = this.getVisualCenter();
            allyProjectiles.push({
                x: center.x, y: center.y,
                velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                size: 25 + Math.random() * 12,
                damage: 60, // MAIS DANO
                isBurp: true,
                draw() {
                    const s = getDepthScale(this.y);
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#44ff00';
                    ctx.fillStyle = 'rgba(100, 255, 50, 0.9)';
                    ctx.beginPath(); ctx.arc(0, 0, (this.size/2)*s, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = 'rgba(200, 255, 150, 0.7)';
                    ctx.beginPath(); ctx.arc(0, 0, (this.size/3)*s, 0, Math.PI * 2); ctx.fill();
                    ctx.restore();
                },
                update() {
                    this.x += this.velocity.x; this.y += this.velocity.y;
                    this.size *= 0.985; // ENCOLHE MAIS DEVAGAR = MAIOR ALCANCE
                    if (Math.random() < 0.3) particles.push(new Particle(this.x, this.y, '#88ff44', { size: 3, speed: 1 }));
                    this.draw();
                }
            });
        }
    }

    megaBurp() {
        const numProjectiles = 24; // MAIS PROJÉTEIS
        const center = this.getVisualCenter();
        screenShake = 30; // MAIS TREMOR
        
        // Onda de choque visual massiva
        for (let i = 0; i < 50; i++) {
            particles.push(new Particle(center.x, center.y, i % 2 === 0 ? '#00ffcc' : '#44ff88', { size: 4 + Math.random()*4, speed: 4 + Math.random()*4, glow: true }));
        }
        
        for (let i = 0; i < numProjectiles; i++) {
            const angle = (Math.PI * 2 / numProjectiles) * i;
            const speed = 8 + Math.random() * 3;
            allyProjectiles.push({
                x: center.x, y: center.y,
                velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                size: 30 + Math.random() * 15,
                damage: 15, // Dano menor mas em área
                isBurp: true,
                life: 1.0,
                draw() {
                    const s = getDepthScale(this.y);
                    ctx.save();
                    ctx.translate(this.x, this.y);
                    ctx.globalAlpha = this.life;
                    ctx.shadowBlur = 25;
                    ctx.shadowColor = '#00ffcc';
                    ctx.fillStyle = 'rgba(0, 255, 200, 0.8)';
                    ctx.beginPath(); ctx.arc(0, 0, (this.size/2)*s, 0, Math.PI * 2); ctx.fill();
                    ctx.restore();
                    ctx.globalAlpha = 1.0;
                },
                update() {
                    this.x += this.velocity.x; this.y += this.velocity.y;
                    this.velocity.x *= 0.97;
                    this.velocity.y *= 0.97;
                    this.life -= 0.008;
                    this.size *= 0.99;
                    this.draw();
                }
            });
        }
        
        // Ativar modo evoluído temporariamente
        this.evolved = true;
        this.evolveTimer = 600;
    }

    update() {
        if (this.evolved) {
            this.evolveTimer--;
            if (this.burpCooldown > 0) this.burpCooldown--;
            
            // Ataque "Arroto" automático se perto de inimigos e cooldown zerado
            if (this.burpCooldown <= 0) {
                let enemyNear = enemies.some(en => Math.hypot(en.x - this.x, en.y - this.y) < 200);
                if (enemyNear) {
                    this.burp();
                    this.burpCooldown = 180; // 3 segundos entre arrotos
                }
            }

            if (this.evolveTimer <= 0) this.evolved = false;
        }

        if (!this.recruited) {
            if (currentScene === 'indoor') {
                this.draw();
                // O hitbox de interação agora é no peito dele (metade da altura) para refletir o visual
                const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
                
                // Se chegar perto (< 250 pixels), abre o diálogo automaticamente
                if (distToPlayer < 250) {
                    if (dialogueOverlay.classList.contains('hidden')) {
                        dialogueOverlay.classList.remove('hidden');
                        if (score >= this.cost) {
                            dialogueText.innerText = "ola palio tudo bem ? já que você se provou digno, gostaria de me recrutar para a batalha?";
                            recruitCostSpan.innerText = this.cost;
                            dialogueRecruitBtn.classList.remove('hidden');
                        } else {
                            dialogueText.innerText = "ola palio tudo bem ? você não e digno ainda consiga mais experiência e volte aki!";
                            dialogueRecruitBtn.classList.add('hidden');
                        }
                    }
                } else {
                    // Se afastar, fecha o diálogo
                    if (!dialogueOverlay.classList.contains('hidden')) {
                        dialogueOverlay.classList.add('hidden');
                    }
                }
            }
            return;
        }

        if (currentScene === 'outdoor') {
            const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
            if (distToPlayer > 100) {
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                const dx = Math.cos(angle) * this.speed;
                const dy = Math.sin(angle) * this.speed;
                if (!checkWorldCollision(this.x + dx, this.y, this.radius)) this.x += dx;
                if (!checkWorldCollision(this.x, this.y + dy, this.radius)) this.y += dy;
                this.isMoving = true;
                this.facingLeft = dx < 0;
            } else {
                this.isMoving = false;
            }

            if (this.shootCooldown > 0) this.shootCooldown--;
            if (this.shootCooldown <= 0 && enemies.length > 0) {
                let closest = null;
                let minDist = 800;
                enemies.forEach(en => {
                    const d = Math.hypot(en.x - this.x, en.y - this.y);
                    if (d < minDist) { minDist = d; closest = en; }
                });

                if (closest) {
                    allyProjectiles.push(new AllyProjectile(this.getVisualCenter().x, this.getVisualCenter().y, closest));
                    this.shootCooldown = 40;
                    this.facingLeft = closest.x < this.x;
                }
            }

            if (this.isMoving) {
                this.frameCounter++;
                if (this.frameCounter >= this.frameSpeed) { this.frame++; this.frameCounter = 0; }
            } else { this.frame = 0; }
            this.draw();
        } else {
            this.x = this.spawnX;
            this.y = this.spawnY;
            this.isMoving = false;
            this.draw();
        }
    }

    takeDamage(amt) {
        if (!this.recruited) return;
        this.health -= amt;
        for(let i=0; i<5; i++) particles.push(new Particle(this.x, this.y, 'white'));
        if (this.health <= 0) {
            this.recruited = false;
            this.cost *= 2;
            this.health = this.maxHealth;
            this.x = this.spawnX;
            this.y = this.spawnY;
            updateHUDText("O ANÃO FOI DERROTADO E VOLTOU AO CELEIRO!");
        }
    }
}

function updateHUDText(msg) {
    waveOverlay.classList.add('wave-active');
    waveText.innerText = msg;
    setTimeout(() => { waveOverlay.classList.remove('wave-active'); }, 2000);
}

let dwarf = new Dwarf();
let vendor = new Vendor();

function animate() {
    if (!gameActive) return;
    if (isPaused) return; // Trava o loop se pausado
    animationId = requestAnimationFrame(animate);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    camera.update(player);
    ctx.save();
    camera.apply(ctx);

    ctx.drawImage(currentScene === 'outdoor' ? images.background : images.celeiro, 0, 0, MAP_WIDTH, MAP_HEIGHT);

    // ============ LÓGICA DO PLAYER (roda em ambas as cenas) ============
    player.update(); // Só lógica, sem draw

    // ============ DEPTH SORTING (Z-ORDER) ============
    if (currentScene === 'outdoor') {
        // Criar lista de entidades com seu Y para z-sorting
        let drawableEntities = [];
        
        // Player (só desenho, lógica já rodou)
        drawableEntities.push({ type: 'player', y: player.y, draw: () => player.draw() });
        
        // Vendor
        if (!editorMode) {
            drawableEntities.push({ type: 'vendor', y: vendor.y, draw: () => vendor.update() });
        } else {
            drawableEntities.push({ type: 'vendor', y: vendor.y, draw: () => vendor.draw() });
        }
        
        // Dwarf
        if (!editorMode) {
            drawableEntities.push({ type: 'dwarf', y: dwarf.y, draw: () => dwarf.update() });
        } else {
            drawableEntities.push({ type: 'dwarf', y: dwarf.y, draw: () => dwarf.draw() });
        }
        
        // Enemies
        for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
            let en = enemies[eIdx];
            drawableEntities.push({ type: 'enemy', y: en.y, idx: eIdx, entity: en, draw: () => {
                if (!editorMode) en.update();
                else en.draw();
            }});
        }
        
        // Ordenar por Y (quem tem Y menor fica atrás, Y maior fica na frente)
        drawableEntities.sort((a, b) => a.y - b.y);
        
        // Desenhar na ordem correta
        drawableEntities.forEach(e => e.draw());
        
        // ============ COLLISION CHECKS (após desenhar) ============

            for (let eIdx = enemies.length - 1; eIdx >= 0; eIdx--) {
                let en = enemies[eIdx];
                
                const pCenter = player.getVisualCenter();
                if (!editorMode && Math.hypot(pCenter.x - en.x, pCenter.y - en.y) < player.radius + en.radius) {
                    player.takeDamage();
                    enemies.splice(eIdx, 1);
                    enemiesRemaining--;
                    continue;
                }

                if (!editorMode && dwarf.recruited && Math.hypot(dwarf.x - en.x, dwarf.y - en.y) < dwarf.radius + en.radius) {
                    dwarf.takeDamage(20);
                    enemies.splice(eIdx, 1);
                    enemiesRemaining--;
                    continue;
                }

                for (let pIdx = projectiles.length - 1; pIdx >= 0; pIdx--) {
                    let p = projectiles[pIdx];
                    if (Math.hypot(p.x - en.x, p.y - en.y) < en.radius + (p.size/2)) {
                        if (p.hitEnemies && p.hitEnemies.includes(en)) continue;
                        
                        for(let i=0; i<5; i++) particles.push(new Particle(p.x, p.y, 'red'));
                        
                        en.health -= p.damage;
                        damageNumbers.push(new DamageNumber(en.x, en.y - 40, p.damage, '#fff'));
                        screenShake = 3;

                        if (!p.pierce) projectiles.splice(pIdx, 1);
                        else {
                            if (!p.hitEnemies) p.hitEnemies = [];
                            p.hitEnemies.push(en);
                        }
                        
                        if (en.health <= 0) {
                            enemies.splice(eIdx, 1);
                            enemiesRemaining--;
                            score += en.xpValue;
                            scoreElement.innerText = score;
                            screenShake = en.isBoss ? 20 : 5;
                            break;
                        }
                    }
                }

                if (en.health > 0) {
                    for (let pIdx = allyProjectiles.length - 1; pIdx >= 0; pIdx--) {
                        let p = allyProjectiles[pIdx];
                        if (Math.hypot(p.x - en.x, p.y - en.y) < en.radius + (p.size/2)) {
                            for(let i=0; i<5; i++) particles.push(new Particle(p.x, p.y, 'white'));
                            en.health -= p.damage;
                            
                            // Dano dos projeteis do aliado (Dwarf)
                            damageNumbers.push(new DamageNumber(en.x, en.y - 40, p.damage, p.isBurp ? '#44ff88' : '#fff'));
                            
                            allyProjectiles.splice(pIdx, 1);
                            
                            if (en.health <= 0) {
                                enemies.splice(eIdx, 1);
                                enemiesRemaining--;
                                score += en.xpValue;
                                scoreElement.innerText = score;
                                screenShake = en.isBoss ? 20 : 5;
                                break;
                            }
                        }
                    }
                }
            }

        if (enemiesRemaining <= 0 && waveActive) {
            waveActive = false;
            
            // Regeneração de Vida Pós-Onda
            player.health = player.maxHealth;
            updateHUD();

            if (currentWave < 10) { currentWave++; setTimeout(startWave, 2000); }
            else { alert("VITÓRIA! FAZENDA PROTEGIDA!"); endGame(); }
        }
    } else {
        // Indoor: depth sort player e dwarf
        let indoorEntities = [];
        indoorEntities.push({ y: player.y, draw: () => player.draw() });
        if (!editorMode) {
            indoorEntities.push({ y: dwarf.y, draw: () => dwarf.update() });
        } else {
            indoorEntities.push({ y: dwarf.y, draw: () => dwarf.draw() });
        }
        indoorEntities.sort((a, b) => a.y - b.y);
        indoorEntities.forEach(e => e.draw());
    }

    projectiles.forEach((p, index) => {
        p.update();
        if (p.x < 0 || p.x > MAP_WIDTH || p.y < 0 || p.y > MAP_HEIGHT) projectiles.splice(index, 1);
    });

    allyProjectiles.forEach((p, index) => {
        p.update();
        if (p.x < 0 || p.x > MAP_WIDTH || p.y < 0 || p.y > MAP_HEIGHT || p.life <= 0) allyProjectiles.splice(index, 1);
    });

    // Atualizar Boss Projectiles
    bossProjectiles.forEach((p, index) => {
        p.update();
        if (!editorMode) {
            const pCenter = player.getVisualCenter();
            if (Math.hypot(p.x - pCenter.x, p.y - pCenter.y) < player.radius + (p.size/2)) {
                player.takeDamage();
                bossProjectiles.splice(index, 1);
            }
        }
        if (p.x < 0 || p.x > MAP_WIDTH || p.y < 0 || p.y > MAP_HEIGHT || p.life <= 0) {
            if (bossProjectiles[index] === p) bossProjectiles.splice(index, 1);
        }
    });

    damageNumbers.forEach((pt, index) => {
        pt.update();
        if (pt.life <= 0) damageNumbers.splice(index, 1);
    });

    particles.forEach((pt, index) => {
        pt.update();
        if (pt.life <= 0) particles.splice(index, 1);
    });

    if (currentScene === 'outdoor') {
        foregroundBoxes.forEach(box => {
            if (images.background.complete && images.background.naturalWidth !== 0) {
                ctx.drawImage(images.background, box.x, box.y, box.w, box.h, box.x, box.y, box.w, box.h);
            }
        });
    } else {
        barnForegroundBoxes.forEach(box => {
            if (images.celeiro.complete && images.celeiro.naturalWidth !== 0) {
                ctx.drawImage(images.celeiro, box.x, box.y, box.w, box.h, box.x, box.y, box.w, box.h);
            }
        });
    }

    // --- EDITOR/DEBUG UI (Draw ON TOP of everything) ---
    if (DEBUG_MODE || editorMode) {
        ctx.lineWidth = 2;
        
        ctx.strokeStyle = 'lime';
        ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        let cArray = currentScene === 'outdoor' ? worldCollisions : barnCollisions;
        cArray.forEach(box => {
            ctx.strokeRect(box.x, box.y, box.w, box.h);
            ctx.fillRect(box.x, box.y, box.w, box.h);
        });

        // Nascedores (Vermelho)
        ctx.strokeStyle = '#ff0000';
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        enemySpawns.forEach(box => {
            ctx.strokeRect(box.x, box.y, box.w, box.h);
            ctx.fillRect(box.x, box.y, box.w, box.h);
        });

        ctx.strokeStyle = '#00ffff';
        ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
        let fArray = currentScene === 'outdoor' ? foregroundBoxes : barnForegroundBoxes;
        fArray.forEach(box => {
            ctx.strokeRect(box.x, box.y, box.w, box.h);
            ctx.fillRect(box.x, box.y, box.w, box.h);
        });

        // ===================================
        // VIZUALIZAÇÃO DOS PORTAIS DE TELEPORTE
        // ===================================
        ctx.font = "20px monospace";
        if (currentScene === 'outdoor') {
            ctx.strokeStyle = 'magenta';
            ctx.fillStyle = 'rgba(255, 0, 255, 0.4)';
            ctx.strokeRect(PORTA_ENTRADA_X_MIN, PORTA_ENTRADA_Y_MIN, PORTA_ENTRADA_X_MAX - PORTA_ENTRADA_X_MIN, PORTA_ENTRADA_Y_MAX - PORTA_ENTRADA_Y_MIN);
            ctx.fillRect(PORTA_ENTRADA_X_MIN, PORTA_ENTRADA_Y_MIN, PORTA_ENTRADA_X_MAX - PORTA_ENTRADA_X_MIN, PORTA_ENTRADA_Y_MAX - PORTA_ENTRADA_Y_MIN);
            ctx.fillStyle = 'magenta';
            ctx.fillText(" PORTA P/ CELEIRO", PORTA_ENTRADA_X_MIN, PORTA_ENTRADA_Y_MIN - 10);

            ctx.fillStyle = 'orange';
            ctx.beginPath(); ctx.arc(NASCER_FORA_X, NASCER_FORA_Y, 15, 0, Math.PI * 2); ctx.fill();
            ctx.fillText(" SPAWN (SAÍDA DA RUA)", NASCER_FORA_X - 60, NASCER_FORA_Y - 25);
        } else {
            ctx.strokeStyle = 'magenta';
            ctx.fillStyle = 'rgba(255, 0, 255, 0.4)';
            ctx.strokeRect(PORTA_SAIDA_X, 0, MAP_WIDTH - PORTA_SAIDA_X, MAP_HEIGHT);
            ctx.fillRect(PORTA_SAIDA_X, 0, MAP_WIDTH - PORTA_SAIDA_X, MAP_HEIGHT);
            ctx.fillStyle = 'magenta';
            ctx.fillText(" PORTA P/ RUA", PORTA_SAIDA_X - 150, MAP_HEIGHT / 2);

            ctx.fillStyle = 'orange';
            ctx.beginPath(); ctx.arc(NASCER_DENTRO_X, NASCER_DENTRO_Y, 15, 0, Math.PI * 2); ctx.fill();
            ctx.fillText(" SPAWN (ENTRADA)", NASCER_DENTRO_X - 60, NASCER_DENTRO_Y - 25);
        }
        // ===================================

        if (isDrawingCol) {
            let colColor = currentTool === 'col' ? 'rgba(0, 255, 0, 0.3)' : 'rgba(0, 255, 255, 0.3)';
            ctx.strokeStyle = currentTool === 'col' ? 'lime' : '#00ffff';
            ctx.fillStyle = colColor;
            let w = mouse.x - drawStart.x;
            let h = mouse.y - drawStart.y;
            let sx = drawStart.x; let sy = drawStart.y;
            if (w < 0) { sx = mouse.x; w = -w; }
            if (h < 0) { sy = mouse.y; h = -h; }
            ctx.strokeRect(sx, sy, w, h);
            ctx.fillRect(sx, sy, w, h);
        }

        // Desenhar caixa em volta do Anão se puder arrastar
        ctx.strokeStyle = 'cyan';
        ctx.strokeRect(dwarf.x - dwarf.spriteWidth/2, dwarf.y - dwarf.spriteHeight + 20, dwarf.spriteWidth, dwarf.spriteHeight);

        ctx.fillStyle = 'yellow';
        ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2); ctx.fill();
    }
    
    ctx.restore();

    if (sceneAlpha > 0) {
        ctx.fillStyle = `rgba(0,0,0,${sceneAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height); // Desenha na tela toda sem zoom/camera
    }
}

function init() {
    gameActive = true;
    currentWave = 1; score = 0; scoreElement.innerText = score;
    currentScene = 'outdoor';
    sceneAlpha = 0;
    isTransitioning = false;
    player = new Player();
    enemies = []; projectiles = []; allyProjectiles = []; particles = [];
    dwarf = new Dwarf();
    vendor = new Vendor();
    inventory.soda = 0;
    waveActive = false;
    screenShake = 0;
    updateInventoryUI();
    shopOverlay.classList.add('hidden');
    dialogueOverlay.classList.add('hidden');
    uiOverlay.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    if (!window.editorUnlocked) {
        document.getElementById('editor-ui').classList.add('hidden'); // Esconder HUD do editor
        
        // Desativar editor sempre que iniciar o jogo
        if (editorMode) {
            editorMode = false;
            document.getElementById('toggleEditorBtn').innerText = "ATIVAR MODO EDITOR";
            document.getElementById('editor-tools').classList.add('hidden');
        }
    } else {
        document.getElementById('editor-ui').classList.remove('hidden'); // Mantem HUD
    }

    if (bossHealthBarFill) bossHealthBarFill.style.width = '100%';
    bossBarContainer.classList.remove('active');
    activeBoss = null;
    bossProjectiles = [];
    
    updateHUD();
    startWave();
    animate();
}

function endGame() {
    gameActive = false;
    isPaused = false;
    cancelAnimationFrame(animationId);
    if (spawnInterval) clearInterval(spawnInterval);
    
    setTimeout(() => {
        finalScoreElement.innerText = score;
        uiOverlay.classList.remove('hidden');
        startScreen.classList.remove('hidden');
        gameoverScreen.classList.remove('hidden');
        platformSelection.classList.add('hidden'); // Mantém seleção escondida no game over
        document.getElementById('editor-ui').classList.remove('hidden');
    }, 100);
}

restartBtn.addEventListener('click', () => {
    // Ao recomeçar, volta para a seleção de plataforma e começa novamente com o mesmo modo
    init();
});
window.addEventListener('resize', () => { 
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// =============================
// PLATFORM & PAUSE LOGIC
// =============================
pcSelectionBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isMobileMode = false;
    init();
});

mobileSelectionBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isMobileMode = true;
    mobileControls.classList.remove('hidden');
    init();
});

function onInitialClick() {
    if (!gameActive) init();
}

function togglePause() {
    if (!gameActive) return;
    isPaused = !isPaused;
    if (isPaused) {
        pauseOverlay.classList.remove('hidden');
        if (pauseFullscreenBtn) {
            pauseFullscreenBtn.innerText = document.fullscreenElement ? 'SAIR DA TELA CHEIA' : 'TELA CHEIA';
        }
        cancelAnimationFrame(animationId);
    } else {
        pauseOverlay.classList.add('hidden');
        animate();
    }
}

// Aplica estilo visual ao joystick conforme as configs atuais
function applyJoystickStyle() {
    joystickContainer.style.width  = joystickSize + 'px';
    joystickContainer.style.height = joystickSize + 'px';
    joystickContainer.style.opacity = joystickOpacity;

    if (joystickSide === 'right') {
        joystickContainer.classList.remove('joystick-left');
        joystickContainer.classList.add('joystick-right');
    } else {
        joystickContainer.classList.remove('joystick-right');
        joystickContainer.classList.add('joystick-left');
    }
}
applyJoystickStyle(); // Aplicar ao carregar

pauseBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePause(); });
resumeBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePause(); });

// BOTÃO IR AO MENU (no pause)
if (menuBtn) {
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Encerrar o jogo e voltar ao menu inicial
        isPaused = false;
        gameActive = false;
        cancelAnimationFrame(animationId);
        if (spawnInterval) clearInterval(spawnInterval);
        pauseOverlay.classList.add('hidden');
        mobileControls.classList.add('hidden');
        uiOverlay.classList.remove('hidden');
        startScreen.classList.remove('hidden');
        gameoverScreen.classList.add('hidden');
        platformSelection.classList.remove('hidden'); // Mostra seleção de plataforma
        clickStart.classList.add('hidden');
    });
}

window.addEventListener('keydown', e => {
    if (e.key === 'Escape' || e.key.toLowerCase() === 'p') togglePause();
});

// FULLSCREEN LOGIC
function toggleFullScreenAction() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        if (pauseFullscreenBtn) pauseFullscreenBtn.innerText = 'SAIR DA TELA CHEIA';
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            if (pauseFullscreenBtn) pauseFullscreenBtn.innerText = 'TELA CHEIA';
        }
    }
}

if (pauseFullscreenBtn) {
    pauseFullscreenBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFullScreenAction();
    });
}

// =============================
// MOBILE JOYSTICK LOGIC
// =============================
joystickContainer.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const rect = joystickContainer.getBoundingClientRect();
    joystick.active = true;
    joystick.originX = rect.left + rect.width / 2;
    joystick.originY = rect.top + rect.height / 2;
    updateJoystick(touch);
    e.preventDefault();
}, {passive: false});

window.addEventListener('touchmove', (e) => {
    if (!joystick.active) return;
    const touch = [...e.touches].find(t => t.target.closest('#joystick-container') || joystick.active);
    if (touch) updateJoystick(touch);
    e.preventDefault();
}, {passive: false});

window.addEventListener('touchend', () => {
    joystick.active = false;
    joystick.vectorX = 0;
    joystick.vectorY = 0;
    joystickStick.style.transform = `translate(-50%, -50%)`;
});

function updateJoystick(touch) {
    const dx = touch.clientX - joystick.originX;
    const dy = touch.clientY - joystick.originY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 60;
    
    if (dist > maxDist) {
        joystick.vectorX = dx / dist;
        joystick.vectorY = dy / dist;
        joystick.moveX = joystick.vectorX * maxDist;
        joystick.moveY = joystick.vectorY * maxDist;
    } else {
        joystick.vectorX = dx / maxDist;
        joystick.vectorY = dy / maxDist;
        joystick.moveX = dx;
        joystick.moveY = dy;
    }
    
    joystickStick.style.transform = `translate(calc(-50% + ${joystick.moveX}px), calc(-50% + ${joystick.moveY}px))`;
}

// MOBILE SHOOTING (Hold to charge)
window.addEventListener('touchstart', (e) => {
    if (!gameActive || isPaused || !isMobileMode) return;
    
    // Não atirar se tocar nos controles, botões ou overlays
    if (e.target.closest('#joystick-container') || 
        e.target.closest('button') ||
        e.target.closest('#shop-overlay') ||
        e.target.closest('#dialogue-overlay') ||
        e.target.closest('.inventory-slot')) return;
    
    const touch = e.touches[0];
    mouse.x = touch.clientX / camera.zoom + camera.x;
    mouse.y = touch.clientY / camera.zoom + camera.y;

    if (player.shootCooldown <= 0 && dialogueOverlay.classList.contains('hidden') && shopOverlay.classList.contains('hidden')) {
        player.isCharging = true;
    }
}, {passive: false});

window.addEventListener('touchend', (e) => {
    if (player.isCharging) {
        player.shoot(player.chargeFactor);
        player.isCharging = false;
        player.shootCooldown = 25;
    }
});

// =============================
// OFFLINE SUPPORT (PWA)
// =============================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW registrado!', reg))
            .catch(err => console.log('Erro SW:', err));
    });
}
