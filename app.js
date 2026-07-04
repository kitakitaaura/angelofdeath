(function () {
  "use strict";

  let speedMultiplier = 1;
  let waitingDepth = 0;

  function scaled(ms) {
    return ms / speedMultiplier;
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, scaled(ms));
    });
  }

  function enterWaiting() {
    waitingDepth++;
    updateDebugPanel();
  }

  function exitWaiting() {
    waitingDepth = Math.max(0, waitingDepth - 1);
    updateDebugPanel();
  }

  function updateDebugPanel() {
    var panel = document.getElementById("debug-panel");
    panel.classList.toggle("visible", waitingDepth > 0);
    panel.setAttribute("aria-hidden", waitingDepth === 0 ? "true" : "false");
  }

  function setSpeedMultiplier(value) {
    speedMultiplier = value;
    document.documentElement.style.setProperty(
      "--fade-duration",
      1.2 / speedMultiplier + "s"
    );
    document.querySelectorAll(".speed-btn").forEach(function (button) {
      button.classList.toggle("active", parseInt(button.dataset.speed, 10) === value);
    });
  }

  document.querySelectorAll(".speed-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      setSpeedMultiplier(parseInt(btn.dataset.speed, 10));
    });
  });

  var container = document.getElementById("phase-container");
  var state = {
    startTime: Date.now(),
    waitingMs: 0,
    phase: 0,
    aborted: false,
  };

  function clearContainer() {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
  }

  function fadeOut() {
    container.classList.add("fading");
    return delay(800);
  }

  function fadeIn() {
    container.classList.remove("fading");
  }

  function setBackgroundClass(phase) {
    document.body.classList.remove("bg-black", "bg-gray", "bg-dark-gray", "slight-gray");
    if (phase === 1) document.body.classList.add("bg-black");
    else if (phase === 2) document.body.classList.add("slight-gray");
    else if (phase === 3) document.body.classList.add("slight-gray");
    else if (phase === 4) document.body.classList.add("slight-gray");
  }

  async function transition(renderFn, phaseNum) {
    if (state.aborted) return;
    await fadeOut();
    clearContainer();
    if (phaseNum !== undefined) {
      state.phase = phaseNum;
      setBackgroundClass(phaseNum);
    }
    fadeIn();
    await renderFn();
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function createScenePage() {
    var page = el("article", "visual-page");
    var scene = el("section", "scene-container");
    var stage = el("div", "scene-stage");
    var particleLayer = el("div", "particle-layer");
    var symbolLayer = el("div", "symbol-layer");
    stage.appendChild(particleLayer);
    stage.appendChild(symbolLayer);
    scene.appendChild(stage);
    page.appendChild(scene);

    createParticleField(stage, particleLayer);
    var symbols = createSymbolNodes(symbolLayer);

    var card = el("section", "vn-card");
    var speaker = el("div", "vn-speaker");
    var text = el("div", "vn-text");
    var button = el("button", "btn continue-btn", "Continue");
    button.type = "button";
    card.appendChild(speaker);
    card.appendChild(text);
    card.appendChild(button);
    page.appendChild(card);

    return { page: page, scene: scene, stage: stage, particleLayer: particleLayer, symbols: symbols, silhouette: null, card: card, speaker: speaker, text: text, button: button };
  }

  function waitForContinue(context) {
    return new Promise(function (resolve) {
      var onClick = function () {
        context.button.removeEventListener("click", onClick);
        resolve();
      };
      context.button.addEventListener("click", onClick);
    });
  }

  function createParticleField(stage, layer) {
    for (var i = 0; i < 70; i += 1) {
      var particle = el("div", "particle");
      particle.style.left = Math.random() * 100 + "%";
      particle.style.top = Math.random() * 100 + "%";
      var size = 4 + Math.random() * 8;
      particle.style.width = size + "px";
      particle.style.height = size + "px";
      particle.style.opacity = 0.08 + Math.random() * 0.2;
      particle.style.setProperty("--drift-x", (Math.random() - 0.5) * 14 + "px");
      particle.style.setProperty("--drift-y", (Math.random() - 0.5) * 14 + "px");
      layer.appendChild(particle);
    }

    stage.addEventListener("mousemove", function (event) {
      var rect = stage.getBoundingClientRect();
      var x = ((event.clientX - rect.left) / rect.width - 0.5) * 28;
      var y = ((event.clientY - rect.top) / rect.height - 0.5) * 28;
      layer.style.setProperty("--pointer-x", x + "px");
      layer.style.setProperty("--pointer-y", y + "px");
      layer.classList.add("hovering");
    });
    stage.addEventListener("mouseleave", function () {
      layer.classList.remove("hovering");
    });
  }

  function createSymbolNodes(layer) {
    var nodes = [];
    var symbols = ["M", "T", "⧗"];
    for (var i = 0; i < 3; i += 1) {
      var symbol = el("div", "scene-symbol");
      symbol.textContent = symbols[i];
      symbol.style.left = 20 + i * 28 + "%";
      symbol.style.top = 28 + Math.random() * 12 + "%";
      symbol.style.transform = "translate(-50%, -50%)";
      layer.appendChild(symbol);
      nodes.push(symbol);
    }
    return nodes;
  }

  function animateSymbols(context, line) {
    var kind = "neutral";
    if (/memory|remember|forgot|forgotten/.test(line.toLowerCase())) {
      kind = "memory";
    }
    if (/death|dead|disappear|ending|end|vanished|gone/.test(line.toLowerCase())) {
      kind = "death";
    }
    if (/time|future|present|yesterday|today|moment/.test(line.toLowerCase())) {
      kind = "time";
    }
    context.symbols.forEach(function (symbol, index) {
      symbol.className = "scene-symbol " + kind;
      symbol.textContent = kind === "memory" ? "M" : kind === "death" ? "✦" : kind === "time" ? "⧗" : ["●", "○", "◇"][index];
      symbol.style.left = 15 + Math.random() * 70 + "%";
      symbol.style.top = 18 + Math.random() * 60 + "%";
      symbol.style.opacity = 0.32 + Math.random() * 0.24;
      symbol.style.transform = "translate(-50%, -50%) scale(" + (0.72 + Math.random() * 0.6) + ") rotate(" + (index * 28 + 10) + "deg)";
    });
  }

  function setSceneLine(context, speaker, text) {
    context.speaker.textContent = speaker || "";
    context.speaker.style.display = speaker ? "block" : "none";
    context.text.textContent = text;
    context.text.classList.remove("visible");
    void context.text.offsetWidth;
    context.text.classList.add("visible");
    animateSymbols(context, text);

    if (context.silhouette) {
      var isDeathLine = speaker === "FIGURE" && /death|dead|disappear|ending|possibility|lost|loss|final/.test(text.toLowerCase());
      context.silhouette.classList.toggle("show-death", isDeathLine);
    }
  }

  async function showLines(context, speaker, lines) {
    for (var i = 0; i < lines.length; i += 1) {
      setSceneLine(context, speaker, lines[i]);
      await waitForContinue(context);
    }
  }


  async function renderPrologue() {
    var context = createScenePage();
    clearContainer();
    container.appendChild(context.page);
    fadeIn();

    await showLines(context, "NARRATOR", [
      "You are patient.",
      "Or perhaps... you simply believed something would eventually happen.",
      "Why?",
    ]);
    await transition(renderScene1, 2);
  }

  async function renderScene1() {
    var context = createScenePage();
    var shapeA = el("div", "scene-shape dot");
    var shapeB = el("div", "scene-shape ring");
    var shapeC = el("div", "scene-shape line");

    shapeA.style.width = "140px";
    shapeA.style.height = "140px";
    shapeA.style.top = "32%";
    shapeA.style.left = "26%";
    shapeA.style.animationDuration = "11s";

    shapeB.style.width = "260px";
    shapeB.style.height = "260px";
    shapeB.style.top = "40%";
    shapeB.style.left = "62%";
    shapeB.style.animationDuration = "14s";

    shapeC.style.top = "70%";
    shapeC.style.left = "40%";
    shapeC.style.opacity = "0.3";

    context.stage.appendChild(shapeA);
    context.stage.appendChild(shapeB);
    context.stage.appendChild(shapeC);

    clearContainer();
    container.appendChild(context.page);

    await showLines(context, "FIGURE", ["You've arrived."]);
    await showLines(context, "PLAYER", ["...Where am I?"]);
    await showLines(context, "FIGURE", [
      "You ask where...",
      "before asking what.",
      "Curious.",
      "Humans always begin with location.",
      "As though understanding space comes before understanding existence.",
    ]);
    await showLines(context, "PLAYER", ["..."]);
    await showLines(context, "FIGURE", [
      "You're wondering if you're dead.",
      "Everyone does.",
      "You're not.",
      "If you were, this conversation would be unnecessary.",
    ]);
    await showLines(context, "PLAYER", ["Who are you?"]);
    await showLines(context, "FIGURE", [
      "How unfortunate.",
      "You reached the oldest question...",
      "before realizing it has never had an answer.",
    ]);
    await showLines(context, "FIGURE", ["Tell me...", "Who are you?"]);
    await showLines(context, "PLAYER", ["..."]);
    await showLines(context, "FIGURE", [
      "Exactly.",
      "Names belong to other people.",
      "You were not born knowing yours.",
      "Someone handed it to you.",
      "You accepted it.",
      "Eventually... you mistook it for yourself.",
    ]);
    await showLines(context, "NARRATOR", ["The room changes.", "Not instantly.", "The horizon stretches farther away."]);
    await showLines(context, "FIGURE", [
      "Everything you believe yourself to be...",
      "was borrowed.",
      "Language.",
      "Morality.",
      "Dreams.",
      "Fears.",
      "Even the voice inside your head...",
      "is assembled from people you've met.",
    ]);

    await transition(renderScene2, 3);
  }

  async function renderScene2() {
    var context = createScenePage();
    var shapeA = el("div", "scene-shape line");
    var shapeB = el("div", "scene-shape dot");
    var shapeC = el("div", "scene-shape ring");

    shapeA.style.top = "22%";
    shapeA.style.left = "52%";
    shapeA.style.width = "300px";
    shapeA.style.height = "2px";
    shapeA.style.animationDuration = "10s";
    shapeA.style.opacity = "0.2";

    shapeB.style.top = "46%";
    shapeB.style.left = "25%";
    shapeB.style.width = "120px";
    shapeB.style.height = "120px";
    shapeB.style.animationDuration = "13s";
    shapeB.style.opacity = "0.16";

    shapeC.style.top = "60%";
    shapeC.style.left = "72%";
    shapeC.style.width = "200px";
    shapeC.style.height = "200px";
    shapeC.style.animationDuration = "16s";

    context.stage.appendChild(shapeA);
    context.stage.appendChild(shapeB);
    context.stage.appendChild(shapeC);

    clearContainer();
    container.appendChild(context.page);

    await showLines(context, "FIGURE", ["Tell me...", "When did you first become... you?"]);
    await showLines(context, "PLAYER", ["I don't know."]);
    await showLines(context, "FIGURE", [
      "There is no shame in that.",
      "No one has ever answered correctly.",
    ]);
    await showLines(context, "NARRATOR", [
      "The figure raises a hand.",
      "The world shatters into countless floating memories.",
      "Not the player's.",
      "Just... memories.",
    ]);
    await showLines(context, "NARRATOR", [
      "A child crying.",
      "Someone laughing.",
      "Rain against glass.",
      "A birthday cake.",
      "Hospital lights.",
      "A train station.",
      "A wedding.",
      "A funeral.",
      "A classroom.",
      "Thousands.",
      "Millions.",
      "An endless sea.",
    ]);
    await showLines(context, "PLAYER", ["What is this?"]);
    await showLines(context, "FIGURE", ["Everything."]);
    await showLines(context, "FIGURE", [
      "Not everything that happened.",
      "Only everything... someone remembered.",
    ]);
    await showLines(context, "NARRATOR", [
      "The fragments begin disappearing.",
      "One after another.",
      "Without warning.",
      "Without pattern.",
    ]);
    await showLines(context, "PLAYER", ["They're disappearing."]);
    await showLines(context, "FIGURE", ["Yes."]);
    await showLines(context, "PLAYER", ["Can you stop it?"]);
    await showLines(context, "FIGURE", ["Why would I?"]);
    await showLines(context, "FIGURE", [
      "You believe loss is tragedy.",
      "Because you imagine permanence to be the natural state.",
      "It isn't.",
      "Permanence is the miracle.",
      "Disappearance... is the rule.",
    ]);
    await showLines(context, "NARRATOR", ["The final memory fades.", "The room is empty again."]);
    await showLines(context, "FIGURE", ["Do you know... what death actually takes?"]);
    await showLines(context, "PLAYER", ["Life?"]);
    await showLines(context, "FIGURE", [
      "No.",
      "Life cannot be taken.",
      "Only ended.",
    ]);
    await showLines(context, "FIGURE", ["Death takes possibility."]);
    await showLines(context, "NARRATOR", [
      "The words linger.",
      "Long enough for the silence to become uncomfortable.",
    ]);
    await showLines(context, "FIGURE", [
      "Every sentence you will never finish.",
      "Every city you will never visit.",
      "Every stranger who would have loved you.",
      "Every mistake that would have taught you something.",
      "Every sunrise you were capable of seeing.",
      "That... is what disappears.",
      "Not breath.",
      "Possibility.",
    ]);

    await transition(renderScene3, 4);
  }

  async function renderScene3() {
    var context = createScenePage();
    var shapeA = el("div", "scene-shape dot");
    var shapeB = el("div", "scene-shape ring");
    var shapeC = el("div", "scene-shape dot");

    shapeA.style.top = "28%";
    shapeA.style.left = "48%";
    shapeA.style.width = "180px";
    shapeA.style.height = "180px";
    shapeA.style.animationDuration = "12s";
    shapeA.style.opacity = "0.14";

    shapeB.style.top = "36%";
    shapeB.style.left = "24%";
    shapeB.style.width = "260px";
    shapeB.style.height = "260px";
    shapeB.style.animationDuration = "18s";
    shapeB.style.opacity = "0.18";

    shapeC.style.top = "58%";
    shapeC.style.left = "72%";
    shapeC.style.width = "120px";
    shapeC.style.height = "120px";
    shapeC.style.animationDuration = "15s";
    shapeC.style.opacity = "0.16";

    context.stage.appendChild(shapeA);
    context.stage.appendChild(shapeB);
    context.stage.appendChild(shapeC);

    clearContainer();
    container.appendChild(context.page);

    await showLines(context, "PLAYER", ["Where am I?"]);
    await showLines(context, "FIGURE", [
      "Tell me...",
      "When was the last time someone carried you?",
    ]);
    await showLines(context, "NARRATOR", [
      "The player searches their memory.",
      "Nothing.",
    ]);
    await showLines(context, "FIGURE", [
      "Exactly.",
      "It happened.",
      "It mattered.",
      "It changed you.",
      "And yet... it vanished so quietly",
      "that you never noticed you had already lived through it.",
    ]);
    await showLines(context, "NARRATOR", [
      "Images begin appearing across the water.",
      "A parent lifting a sleeping child.",
      "A friend laughing.",
      "A final walk home after school.",
      "A family dinner.",
      "A goodbye that wasn't recognized as one.",
    ]);
    await showLines(context, "FIGURE", [
      "Life is not built from extraordinary moments.",
      "It is built from ordinary moments",
      "that become extraordinary",
      "only after they can never happen again.",
    ]);
    await showLines(context, "FIGURE", [
      "Humans imagine I arrive at the end.",
      "How strange.",
    ]);
    await showLines(context, "NARRATOR", ["The room grows darker."]);
    await showLines(context, "FIGURE", [
      "I have never arrived.",
      "I have always been here.",
    ]);
    await showLines(context, "FIGURE", [
      "Every second...",
      "I take one moment from you.",
      "Not your future.",
      "Your present.",
      "The instant you experience something...",
      "it belongs to memory.",
      "And memory...",
      "belongs to me.",
    ]);
    await showLines(context, "PLAYER", ["Then...", "you're Death."]);
    await showLines(context, "FIGURE", [
      "No.",
      "Death is only my final act.",
      "I am everything before it.",
      "I am the reason yesterday cannot be revisited.",
      "I am why childhood cannot be returned to.",
      "Why conversations end.",
      "Why music fades.",
      "Why photographs matter.",
      "Why promises hurt.",
      "Why forgiveness exists.",
      "Why time...",
      "only knows one direction.",
    ]);
    await showLines(context, "FIGURE", [
      "Walk with me.",
      "There are still many things you believe are permanent.",
      "And I would like to introduce you to their endings.",
    ]);
  }

  async function run() {
    await renderPrologue();
  }

  run();
})();
