const AppState = {
    speed: 1,
    phase: 1,
    startTime: Date.now(),
    currentScene: null,
};

const PRESENTATION_STYLES = ['fade', 'slide', 'type', 'blur', 'word', 'grow', 'instant'];
let presentationIndex = -1;

const delay = (ms) => new Promise((resolve) => {
    window.setTimeout(resolve, ms / AppState.speed);
});

const createNode = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
};

class LayeredRenderer {
    constructor(root) {
        this.root = root;
        this.root.classList.add('visual-stage');
        this.state = { motion: 'still', camera: 'calm', detail: 'soft' };
        this.layers = {};
        this.initializeLayers();
        this.buildScene();
    }

    initializeLayers() {
        ['background', 'shapes', 'particles', 'symbols'].forEach((name) => {
            const layer = createNode('div', `layer layer--${name}`);
            layer.dataset.layer = name;
            this.layers[name] = layer;
            this.root.appendChild(layer);
        });
    }

    buildScene() {
        this.clear();
        this.createParticleField();
        this.createSymbols([
            { char: 'M', left: '20%', top: '28%' },
            { char: 'T', left: '48%', top: '38%' },
            { char: '⧗', left: '76%', top: '30%' },
        ]);
    }

    clear() {
        Object.values(this.layers).forEach((layer) => {
            layer.innerHTML = '';
        });
        this.createParticleField();
    }

    fadeOut() {
        this.root.classList.add('fading');
        return new Promise((resolve) => {
            const duration = 700 / AppState.speed;
            window.setTimeout(resolve, duration);
        });
    }

    fadeIn() {
        this.root.classList.remove('fading');
    }

    setBackdrop(theme) {
        this.root.dataset.backdrop = theme;
    }

    setMood(kind) {
        this.root.dataset.mood = kind;
        this.animateSymbols(kind);
    }

    createParticleField() {
        const layer = this.layers.particles;
        layer.innerHTML = '';

        for (let index = 0; index < 70; index += 1) {
            const particle = createNode('div', 'particle');
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.width = `${4 + Math.random() * 10}px`;
            particle.style.height = `${4 + Math.random() * 10}px`;
            particle.style.opacity = `${0.05 + Math.random() * 0.18}`;
            particle.style.setProperty('--drift-x', `${(Math.random() - 0.5) * 16}px`);
            particle.style.setProperty('--drift-y', `${(Math.random() - 0.5) * 16}px`);
            layer.appendChild(particle);
        }

        layer.addEventListener('mousemove', (event) => {
            const rect = this.root.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width - 0.5) * 24;
            const y = ((event.clientY - rect.top) / rect.height - 0.5) * 24;
            layer.style.setProperty('--pointer-x', `${x}px`);
            layer.style.setProperty('--pointer-y', `${y}px`);
            layer.classList.add('hovering');
        });

        layer.addEventListener('mouseleave', () => {
            layer.classList.remove('hovering');
        });
    }

    animateSymbols(kind) {
        const symbolNodes = Array.from(this.layers.symbols.children);
        symbolNodes.forEach((symbol, index) => {
            symbol.className = `scene-symbol ${kind}`;
            const label =
                kind === 'memory'
                    ? 'M'
                    : kind === 'death'
                        ? '✦'
                        : kind === 'time'
                            ? '⧗'
                            : ['●', '○', '◇'][index % 3];
            symbol.textContent = label;
            symbol.style.left = `${15 + Math.random() * 70}%`;
            symbol.style.top = `${18 + Math.random() * 60}%`;
            symbol.style.opacity = `${0.3 + Math.random() * 0.25}`;
            symbol.style.transform = `translate(-50%, -50%) scale(${0.7 + Math.random() * 0.6}) rotate(${index * 35 + 12}deg)`;
        });
    }

    createSymbols(symbols = []) {
        const layer = this.layers.symbols;
        layer.innerHTML = '';
        symbols.forEach((definition) => {
            const symbol = createNode('div', 'scene-symbol', definition.char);
            symbol.style.left = definition.left;
            symbol.style.top = definition.top;
            layer.appendChild(symbol);
        });
    }

    createShapes(shapeSpecs = []) {
        const layer = this.layers.shapes;
        layer.innerHTML = '';

        shapeSpecs.forEach((spec) => {
            const shape = createNode('div', `scene-shape ${spec.type}`);
            shape.style.width = spec.width;
            shape.style.height = spec.height;
            shape.style.top = spec.top;
            shape.style.left = spec.left;
            shape.style.opacity = spec.opacity || '0.16';
            if (spec.animationDuration) {
                shape.style.animationDuration = spec.animationDuration;
            }
            layer.appendChild(shape);
        });
    }

    setParticlesEnabled(enabled) {
        this.layers.particles.style.display = enabled ? 'block' : 'none';
    }

    setCinematicState(state) {
        this.root.dataset.cinematic = state;
        this.state.motion = state;
        Object.values(this.layers).forEach((layer) => {
            layer.dataset.cinematic = state;
        });

        if (state === 'attention') {
            this.subtleCameraShift(0.26);
        } else if (state === 'realization') {
            this.subtleCameraShift(0.72);
        } else if (state === 'release') {
            this.subtleCameraShift(0.18);
        } else {
            this.resetCamera();
        }
    }

    subtleCameraShift(amount = 0.4) {
        this.root.style.transform = `translate3d(0, ${amount}px, 0) scale(1.002)`;
    }

    resetCamera() {
        this.root.style.transform = '';
    }
}

class DialogueCard {
    constructor(root) {
        this.root = root;
        this.panel = createNode('section', 'dialogue-panel');
        this.speaker = createNode('div', 'dialogue-speaker');
        this.copy = createNode('p', 'dialogue-copy');
        this.actions = createNode('div', 'dialogue-actions');
        this.button = createNode('button', 'dialogue-button', 'Continue');
        this.button.type = 'button';

        this.button.style.display = 'none';
        this.actions.appendChild(this.button);
        this.panel.append(this.speaker, this.copy, this.actions);
        this.root.appendChild(this.panel);

        this.overlay = createNode('div', 'glitch-overlay');
        this.overlay.innerHTML = '<div class="glitch-word"></div>';
        this.overlayWord = this.overlay.querySelector('.glitch-word');
        this.root.appendChild(this.overlay);

        this.button.addEventListener('click', () => {
            if (this.resolveContinue) {
                window.clearTimeout(this.continueTimer);
                this.resolveContinue();
                this.resolveContinue = null;
            }
        });
    }

    async setLine(speaker, text, style) {
        const isSingleWord = text.trim().split(/\s+/).length === 1;

        this.speaker.textContent = speaker ? speaker : '';
        this.speaker.style.display = speaker ? 'block' : 'none';
        this.copy.className = 'dialogue-copy';
        this.copy.classList.add(`presentation--${style}`);

        if (isSingleWord) {
            this.copy.textContent = '';
            this.showGlitchWord(text);
            this.panel.classList.add('hidden');
        } else {
            this.hideGlitchWord();
            this.panel.classList.remove('hidden');

            if (style === 'type') {
                await this.typeText(text);
            } else if (style === 'word') {
                await this.wordText(text);
            } else {
                this.copy.textContent = text;
            }
        }

        void this.copy.offsetWidth;
        this.copy.classList.add('visible');
    }

    showGlitchWord(text) {
        const word = text.trim().toUpperCase();
        this.overlayWord.textContent = word;
        this.overlayWord.dataset.text = word;
        this.overlay.classList.add('visible');
    }

    hideGlitchWord() {
        this.overlay.classList.remove('visible');
    }

    async typeText(text) {
        this.copy.textContent = '';
        for (let i = 0; i < text.length; i += 1) {
            this.copy.textContent += text[i];
            await delay(25 + Math.random() * 14);
        }
    }

    async wordText(text) {
        const words = text.split(' ');
        this.copy.textContent = '';
        for (let index = 0; index < words.length; index += 1) {
            this.copy.textContent += words[index] + (index < words.length - 1 ? ' ' : '');
            await delay(120 + Math.random() * 60);
        }
    }

    waitContinue() {
        return new Promise((resolve) => {
            this.resolveContinue = resolve;
            this.continueTimer = window.setTimeout(() => {
                if (this.resolveContinue) {
                    this.resolveContinue();
                    this.resolveContinue = null;
                }
            }, 2000 / AppState.speed);
        });
    }
}

class SceneManager {
    constructor(renderer, dialogue) {
        this.renderer = renderer;
        this.dialogue = dialogue;
        this.scenes = new Map();
    }

    registerScenes(sceneList) {
        sceneList.forEach((scene) => {
            this.scenes.set(scene.id, scene);
        });
    }

    async start() {
        await this.transitionTo('prologue');
    }

    async transitionTo(sceneId) {
        const scene = this.scenes.get(sceneId);
        if (!scene) {
            console.warn(`Scene not found: ${sceneId}`);
            return;
        }

        await this.renderer.fadeOut();
        this.renderer.clear();
        this.renderer.setBackdrop(sceneId);
        scene.setup?.(this.renderer);
        this.renderer.fadeIn();

        AppState.phase = scene.phase || AppState.phase;
        AppState.currentScene = sceneId;
        const cinematic = scene.cinematic || 'still';
        this.renderer.setCinematicState(cinematic);
        this.dialogue.root.dataset.cinematic = cinematic;
        await scene.render(this.createContext());
    }

    createContext() {
        return {
            renderer: this.renderer,
            dialogue: this.dialogue,
            playLines: this.playLines.bind(this),
            transition: this.transitionTo.bind(this),
            endExperience: this.endExperience.bind(this),
            state: AppState,
        };
    }

    async playLines(speaker, lines) {
        for (const line of lines) {
            const style = this.pickPresentation();
            this.renderer.setCinematicState(this.getCinematicForLine(line));
            this.dialogue.setLine(speaker, line, style);
            this.renderer.setMood(this.getMoodForLine(line));
            await this.dialogue.waitContinue();
            await this.waitAfterLine(line);
        }
    }

    pickPresentation() {
        presentationIndex = (presentationIndex + 1) % PRESENTATION_STYLES.length;
        return PRESENTATION_STYLES[presentationIndex];
    }

    async waitAfterLine(line) {
        const text = line.toLowerCase();
        if (/important|memory|death|now|already|forever|never|last|end|silence/.test(text)) {
            await delay(1800 + Math.random() * 1200);
        } else if (/if|but|and|or|then/.test(text)) {
            await delay(900 + Math.random() * 600);
        } else {
            await delay(300 + Math.random() * 400);
        }
    }

    async endExperience() {
        if (AppState.backgroundAudio) {
            AppState.backgroundAudio.pause();
            AppState.backgroundAudio.currentTime = 0;
        }

        document.documentElement.classList.add('final-ending');
        const overlay = createNode('div', 'final-ending-overlay');
        const message = createNode('div', 'final-ending-message', 'Close this tab. Wake up.');
        overlay.appendChild(message);
        document.body.appendChild(overlay);
        // reveal overlay and disable further interactions
        overlay.classList.add('visible');
        overlay.style.pointerEvents = 'auto';
        document.body.style.overflow = 'hidden';

        let scale = 0.6;
        message.style.transform = `scale(${scale})`;
        const intervalId = window.setInterval(() => {
            scale = Math.min(scale + 0.18, 40);
            message.style.transform = `scale(${scale})`;
            message.classList.toggle('final-ending-glitch');
        }, 1000);
    }

    getMoodForLine(line) {
        const text = line.toLowerCase();
        if (/memory|remember|forgot|remembered/.test(text)) return 'memory';
        if (/death|dead|disappear|ending|end|vanished|gone|lost|loss/.test(text)) return 'death';
        if (/time|future|present|yesterday|today|moment|second|before|after/.test(text)) return 'time';
        return 'neutral';
    }

    getCinematicForLine(line) {
        const text = line.toLowerCase();
        if (/remember|memory|forgot|lost|loss|death/.test(text)) return 'realization';
        if (/you are patient|why|who are you|what is this|do you know/.test(text)) return 'attention';
        if (/everything that moved|has already become memory|go\./.test(text)) return 'release';
        return 'still';
    }
}

const SceneDefinitions = [
    {
        id: 'prologue',
        phase: 1,
        cinematic: 'still',
        setup(renderer) {
            renderer.setParticlesEnabled(true);
            renderer.createShapes([
                { type: 'dot', width: '140px', height: '140px', top: '32%', left: '26%', animationDuration: '11s', opacity: '0.16' },
                { type: 'ring', width: '260px', height: '260px', top: '40%', left: '62%', animationDuration: '14s', opacity: '0.18' },
                { type: 'line', width: '220px', height: '2px', top: '70%', left: '40%', opacity: '0.27' },
            ]);
            renderer.createSymbols([
                { char: 'M', left: '22%', top: '24%' },
                { char: 'T', left: '52%', top: '34%' },
                { char: '⧗', left: '78%', top: '26%' },
            ]);
        },
        async render(context) {
            await context.playLines('NARRATOR', [
                'You are patient.',
                'Or perhaps... you simply believed something would eventually happen.',
                'Why?',
            ]);
            await context.transition('scene1');
        },
    },
    {
        id: 'scene1',
        phase: 2,
        cinematic: 'attention',
        setup(renderer) {
            renderer.setParticlesEnabled(true);
            renderer.createShapes([
                { type: 'dot', width: '140px', height: '140px', top: '32%', left: '26%', animationDuration: '11s', opacity: '0.18' },
                { type: 'ring', width: '260px', height: '260px', top: '40%', left: '62%', animationDuration: '14s', opacity: '0.22' },
                { type: 'line', width: '220px', height: '2px', top: '72%', left: '40%', opacity: '0.32' },
            ]);
            renderer.createSymbols([
                { char: '●', left: '18%', top: '32%' },
                { char: '○', left: '43%', top: '28%' },
                { char: '◇', left: '68%', top: '30%' },
            ]);
        },
        async render(context) {
            await context.playLines('FIGURE', ['You\'ve arrived.']);
            await context.playLines('PLAYER', ['...Where am I?']);
            await context.playLines('FIGURE', [
                'You ask where...',
                'before asking what.',
                'Curious.',
                'Humans always begin with location.',
                'As though understanding space comes before understanding existence.',
            ]);
            await context.playLines('PLAYER', ['...']);
            await context.playLines('FIGURE', [
                'You\'re wondering if you\'re dead.',
                'Everyone does.',
                'You\'re not.',
                'If you were, this conversation would be unnecessary.',
            ]);
            await context.playLines('PLAYER', ['Who are you?']);
            await context.playLines('FIGURE', [
                'How unfortunate.',
                'You reached the oldest question...',
                'before realizing it has never had an answer.',
            ]);
            await context.playLines('FIGURE', ['Tell me...', 'Who are you?']);
            await context.playLines('PLAYER', ['...']);
            await context.playLines('FIGURE', [
                'Exactly.',
                'Names belong to other people.',
                'You were not born knowing yours.',
                'Someone handed it to you.',
                'You accepted it.',
                'Eventually... you mistook it for yourself.',
            ]);
            await context.playLines('NARRATOR', ['The room changes.', 'Not instantly.', 'The horizon stretches farther away.']);
            await context.playLines('FIGURE', [
                'Everything you believe yourself to be...',
                'was borrowed.',
                'Language.',
                'Morality.',
                'Dreams.',
                'Fears.',
                'Even the voice inside your head...',
                'is assembled from people you\'ve met.',
            ]);
            await context.transition('scene2');
        },
    },
    {
        id: 'scene2',
        phase: 3,
        cinematic: 'realization',
        setup(renderer) {
            renderer.setParticlesEnabled(true);
            renderer.createShapes([
                { type: 'line', width: '300px', height: '2px', top: '22%', left: '52%', animationDuration: '10s', opacity: '0.2' },
                { type: 'dot', width: '120px', height: '120px', top: '46%', left: '25%', animationDuration: '13s', opacity: '0.16' },
                { type: 'ring', width: '200px', height: '200px', top: '60%', left: '72%', animationDuration: '16s', opacity: '0.18' },
            ]);
            renderer.createSymbols([
                { char: 'M', left: '17%', top: '48%' },
                { char: '✦', left: '53%', top: '22%' },
                { char: '⧗', left: '77%', top: '58%' },
            ]);
        },
        async render(context) {
            await context.playLines('FIGURE', ['Tell me...', 'When did you first become... you?']);
            await context.playLines('PLAYER', ['I don\'t know.']);
            await context.playLines('FIGURE', ['There is no shame in that.', 'No one has ever answered correctly.']);
            await context.playLines('NARRATOR', [
                'The figure raises a hand.',
                'The world shatters into countless floating memories.',
                'Not the player\'s.',
                'Just... memories.',
            ]);
            await context.playLines('NARRATOR', [
                'A child crying.',
                'Someone laughing.',
                'Rain against glass.',
                'A birthday cake.',
                'Hospital lights.',
                'A train station.',
                'A wedding.',
                'A funeral.',
                'A classroom.',
                'Thousands.',
                'Millions.',
                'An endless sea.',
            ]);
            await context.playLines('PLAYER', ['What is this?']);
            await context.playLines('FIGURE', ['Everything.']);
            await context.playLines('FIGURE', ['Not everything that happened.', 'Only everything... someone remembered.']);
            await context.playLines('NARRATOR', ['The fragments begin disappearing.', 'One after another.', 'Without warning.', 'Without pattern.']);
            await context.playLines('PLAYER', ['They\'re disappearing.']);
            await context.playLines('FIGURE', ['Yes.']);
            await context.playLines('PLAYER', ['Can you stop it?']);
            await context.playLines('FIGURE', ['Why would I?']);
            await context.playLines('FIGURE', [
                'You believe loss is tragedy.',
                'Because you imagine permanence to be the natural state.',
                'It isn\'t.',
                'Permanence is the miracle.',
                'Disappearance... is the rule.',
            ]);
            await context.playLines('NARRATOR', ['The final memory fades.', 'The room is empty again.']);
            await context.playLines('FIGURE', ['Do you know... what death actually takes?']);
            await context.playLines('PLAYER', ['Life?']);
            await context.playLines('FIGURE', ['No.', 'Life cannot be taken.', 'Only ended.']);
            await context.playLines('FIGURE', ['Death takes possibility.']);
            await context.transition('scene3');
        },
    },
    {
        id: 'scene3',
        phase: 4,
        cinematic: 'release',
        setup(renderer) {
            renderer.setParticlesEnabled(true);
            renderer.createShapes([
                { type: 'dot', width: '180px', height: '180px', top: '28%', left: '48%', animationDuration: '12s', opacity: '0.14' },
                { type: 'ring', width: '260px', height: '260px', top: '36%', left: '24%', animationDuration: '18s', opacity: '0.18' },
                { type: 'dot', width: '120px', height: '120px', top: '58%', left: '72%', animationDuration: '15s', opacity: '0.16' },
            ]);
            renderer.createSymbols([
                { char: '✦', left: '28%', top: '24%' },
                { char: '⧗', left: '56%', top: '48%' },
                { char: 'M', left: '72%', top: '28%' },
            ]);
        },
        async render(context) {
            await context.playLines('PLAYER', ['Where am I?']);
            await context.playLines('FIGURE', ['Tell me...', 'When was the last time someone carried you?']);
            await context.playLines('NARRATOR', ['The player searches their memory.', 'Nothing.']);
            await context.playLines('FIGURE', [
                'Exactly.',
                'It happened.',
                'It mattered.',
                'It changed you.',
                'And yet... it vanished so quietly',
                'that you never noticed you had already lived through it.',
            ]);
            await context.playLines('NARRATOR', [
                'Images begin appearing across the water.',
                'A parent lifting a sleeping child.',
                'A friend laughing.',
                'A final walk home after school.',
                'A family dinner.',
                'A goodbye that wasn\'t recognized as one.',
            ]);
            await context.playLines('FIGURE', [
                'Life is not built from extraordinary moments.',
                'It is built from ordinary moments',
                'that become extraordinary',
                'only after they can never happen again.',
            ]);
            await context.playLines('FIGURE', ['Humans imagine I arrive at the end.', 'How strange.']);
            await context.playLines('NARRATOR', ['The room grows darker.']);
            await context.playLines('FIGURE', [
                'I have never arrived.',
                'I have always been here.',
            ]);
            await context.playLines('FIGURE', [
                'Every second...',
                'I take one moment from you.',
                'Not your future.',
                'Your present.',
                'The instant you experience something...',
                'it belongs to memory.',
                'And memory...',
                'belongs to me.',
            ]);
            await context.playLines('NARRATOR', ['The story reaches its end.']);
            await context.transition('ending');
        },
    },
    {
        id: 'ending',
        phase: 4,
        cinematic: 'still',
        setup(renderer) {
            renderer.setParticlesEnabled(false);
        },
        async render(context) {
            await context.playLines('NARRATOR', ['This is the last moment.', 'The angel of death.']);
            await context.endExperience();
        },
    },
];

function attachSpeedControls() {
    const speedButtons = document.querySelectorAll('.speed-btn');
    speedButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const speed = Number(button.dataset.speed);
            AppState.speed = speed;
            document.documentElement.style.setProperty('--fade-duration', `${0.88 / speed}s`);
            speedButtons.forEach((btn) => btn.classList.toggle('active', btn === button));
        });
    });

    const audioToggle = document.getElementById('audio-toggle');
    if (audioToggle) {
        audioToggle.addEventListener('click', () => {
            if (!AppState.backgroundAudio) return;

            const newMuted = !AppState.audioMuted;
            AppState.audioMuted = newMuted;
            AppState.backgroundAudio.muted = newMuted;
            audioToggle.classList.toggle('muted', newMuted);
            audioToggle.textContent = newMuted ? '🔇' : '🔊';

            if (!newMuted && AppState.backgroundAudio.paused) {
                AppState.backgroundAudio.play().catch(() => {
                    // ignore autoplay block until next gesture
                });
            }
        });
    }
}

function init() {
    const visualRoot = document.getElementById('visual-root');
    const uiShell = document.getElementById('ui-shell');

    if (!visualRoot || !uiShell) {
        console.error('Missing expected DOM roots for engine initialization.');
        return;
    }

    attachSpeedControls();
    initBackgroundAudio();

    const renderer = new LayeredRenderer(visualRoot);
    const dialogue = new DialogueCard(uiShell);
    const manager = new SceneManager(renderer, dialogue);
    manager.registerScenes(SceneDefinitions);
    manager.start();
}

function initBackgroundAudio() {
    const audio = new Audio('./assets/freesound_community-eerie-ambience-6836.mp3');
    audio.loop = true;
    audio.volume = 0.45;
    audio.preload = 'auto';
    audio.muted = true;

    AppState.backgroundAudio = audio;
    AppState.audioMuted = true;

    const audioToggle = document.getElementById('audio-toggle');
    if (audioToggle) {
        audioToggle.classList.add('muted');
        audioToggle.textContent = '🔇';
    }

    const tryPlayAudio = () => {
        if (!AppState.backgroundAudio) return;
        AppState.backgroundAudio.play().catch(() => {
            // play may still fail until the next gesture
        });
    };

    document.body.addEventListener('click', tryPlayAudio, { once: true, capture: true });
    document.body.addEventListener('keydown', tryPlayAudio, { once: true, capture: true });

    audio.play().catch(() => {
        // autoplay blocked, wait for user gesture
    });
}

window.addEventListener('DOMContentLoaded', init);
