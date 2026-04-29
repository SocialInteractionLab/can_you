// linear (1D grid) instruction pages — 3 pages, page 2 has interactive demo
function getInstructionPagesWaffle(axisOrder) {
    var dim1 = axisOrder === 'AW' ? 'able'    : 'willing';
    var dim2 = axisOrder === 'AW' ? 'willing' : 'able';

    var page1 = `
        <div class="w-scene w-scene--centered">
            ${getSectionTickerHTML('instructions')}
            <div class="w-card">
                <div class="w-instr-overline">Instructions · 1 / 3</div>
                <h2 class="w-instr-title">What you'll do</h2>
                <div class="w-instr-rule"></div>
                <div class="w-instr-body">
                    <p style="animation: fadeUp 600ms cubic-bezier(.2,.8,.2,1) 300ms both;">In this study, you'll see a series of everyday scenarios.</p>
                    <p style="animation: fadeUp 600ms cubic-bezier(.2,.8,.2,1) 650ms both;">For each scenario, imagine <b>100 random people</b> are all in that situation.</p>
                    <p style="animation: fadeUp 600ms cubic-bezier(.2,.8,.2,1) 1000ms both;">You'll estimate how many of them would be <em>${dim1}</em> to do the thing being asked — then how many of those would be <em>${dim2}</em> to do it.</p>
                </div>
                <hr class="w-hr">
                <div class="w-instr-footer"></div>
            </div>
        </div>`;

    var page2 = `
        <div class="w-scene w-scene--centered">
            ${getSectionTickerHTML('instructions')}
            <div class="w-card">
                <div class="w-instr-overline">Instructions · 2 / 3</div>
                <h2 class="w-instr-title">How it works</h2>
                <div class="w-instr-rule"></div>
                <div class="w-demo-outer" id="w-demo-outer">
                    <div id="w-demo-grid-container" style="position:relative;"></div>
                    <div class="w-demo-caption" id="w-demo-caption"></div>
                    <div class="w-demo-progress" id="w-demo-progress">
                        <div class="w-demo-dots" id="w-demo-dots"></div>
                    </div>
                </div>
                <hr class="w-hr">
                <div class="w-instr-footer"></div>
            </div>
        </div>`;

    var page3 = `
        <div class="w-scene w-scene--centered">
            ${getSectionTickerHTML('instructions')}
            <div class="w-card">
                <div class="w-instr-overline">Instructions · 3 / 3</div>
                <h2 class="w-instr-title">Ready to start!</h2>
                <div class="w-instr-rule"></div>
                <div class="w-instr-body">
                    <p style="animation: fadeUp 600ms cubic-bezier(.2,.8,.2,1) 300ms both;">There are no right or wrong answers — we're just interested in what you think.</p>
                    <p style="animation: fadeUp 600ms cubic-bezier(.2,.8,.2,1) 650ms both;">Remember: being <em>${dim1}</em> and being <em>${dim2}</em> don't always go together.</p>
                    <p style="animation: fadeUp 600ms cubic-bezier(.2,.8,.2,1) 1000ms both;">You will be asked for your thoughts on: <b>30 scenarios</b>.</p>
                </div>
                <hr class="w-hr">
                <div class="w-instr-footer"></div>
            </div>
        </div>`;

    return [page1, page2, page3];
}


// ---- per-page gate times (ms) ----
var INSTR_GATES = [2500, 25000, 3000];
var _instrDemoCleanup = null;

// called from main.js on_load + nav handler
function setupInstrPage(page, axisOrder, colorMap) {
    setTimeout(function() {
        var nextBtn = document.getElementById('jspsych-instructions-next');
        var backBtn = document.getElementById('jspsych-instructions-back');
        var footer  = document.querySelector('.w-instr-footer');

        if (footer && nextBtn) {
            footer.innerHTML = '';
            var leftSlot = document.createElement('div');
            if (backBtn) { leftSlot.appendChild(backBtn); }

            var rightCol = document.createElement('div');
            rightCol.style.cssText = 'display:flex; flex-direction:column; align-items:center;';

            var hint = document.createElement('div');
            hint.id = 'w-instr-hint';
            hint.className = 'w-btn-hint';
            hint.textContent = 'Take a moment to read';

            rightCol.appendChild(nextBtn);
            rightCol.appendChild(hint);

            footer.appendChild(leftSlot);
            footer.appendChild(rightCol);
        }

        if (nextBtn) {
            nextBtn.className  = 'w-btn-primary';
            nextBtn.textContent = page === 2 ? 'Start the study' : 'Continue';
            nextBtn.disabled   = true;
        }
        if (backBtn) {
            backBtn.className = 'w-btn-ghost';
        }

        var navBar = document.getElementById('jspsych-instructions-nav');
        if (navBar) navBar.style.display = 'none';

        if (window._instrGateTimer) clearTimeout(window._instrGateTimer);
        var gateMs = INSTR_GATES[page] || 2500;
        window._instrGateTimer = setTimeout(function() {
            var nb = document.getElementById('jspsych-instructions-next');
            if (nb) nb.disabled = false;
            var h = document.getElementById('w-instr-hint');
            if (h) h.style.display = 'none';
        }, gateMs);

        if (page === 1) {
            if (_instrDemoCleanup) { _instrDemoCleanup(); _instrDemoCleanup = null; }
            _instrDemoCleanup = initInstrDemoGrid(axisOrder, colorMap);
        } else {
            if (_instrDemoCleanup) { _instrDemoCleanup(); _instrDemoCleanup = null; }
        }
    }, 30);
}


// ---- 1D demo grid choreography ----
function initInstrDemoGrid(axisOrder, colorMap) {
    var container = document.getElementById('w-demo-grid-container');
    var captionEl = document.getElementById('w-demo-caption');
    var dotsEl    = document.getElementById('w-demo-dots');
    if (!container || !captionEl) return function() {};

    var SIZE    = W_LINEAR_DEMO_SIZE;
    var palette = colorMap || PALETTES[PALETTE_NAME];

    // demo grid uses grid1's color (first question = dim1 = ability or willingness)
    var demoColor = axisOrder === 'AW' ? palette.AW : palette.NAW;
    var demoDim   = axisOrder === 'AW' ? 'able'     : 'willing';
    var demoDim2  = axisOrder === 'AW' ? 'willing'  : 'able';

    var grid = buildLinearGridVanilla(container, SIZE, SIZE, demoColor, {
        snap: true,
        hapticOnSnap: true,
        hideCrosshair: true,
        showCounts: false,
        hidePills: true,
        figuresRaining: true,
    });

    // override figures to start grey (no yes-region color yet)
    // setPos(0,10) already achieves this since count=0

    var step         = 0;
    var hasInteracted = false;
    var timers       = [];
    var demoSx       = 0, demoSy = 10;

    function schedule(delay, fn) {
        var t = setTimeout(fn, delay);
        timers.push(t);
        return t;
    }

    function setCaption(html) {
        captionEl.style.opacity    = '0';
        captionEl.style.transition = 'opacity 250ms ease';
        setTimeout(function() {
            captionEl.innerHTML   = html;
            captionEl.style.opacity = '1';
        }, 250);
    }

    // smooth drift between grid positions
    function driftTo(tSx, tSy, durMs, afterFn) {
        var steps   = Math.ceil(durMs / 40);
        var curStep = 0;
        var fSx = demoSx, fSy = demoSy;
        function tick() {
            if (hasInteracted) { if (afterFn) afterFn(); return; }
            curStep++;
            var t    = Math.min(1, curStep / steps);
            var ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
            var nx   = Math.round(fSx + (tSx - fSx) * ease);
            var ny   = Math.round(fSy + (tSy - fSy) * ease);
            if (nx !== demoSx || ny !== demoSy) { demoSx = nx; demoSy = ny; grid.setPos(nx, ny); }
            if (t < 1) { var tid = setTimeout(tick, 40); timers.push(tid); }
            else { demoSx = tSx; demoSy = tSy; if (afterFn) afterFn(); }
        }
        var t1 = setTimeout(tick, 0); timers.push(t1);
    }

    // progress dots (steps 3–5 + invite)
    function updateDots(currentStep) {
        if (!dotsEl) return;
        dotsEl.innerHTML = '';
        [3, 4, 5, 6].forEach(function(s) {
            var d = document.createElement('div');
            d.className = 'w-demo-dot';
            d.style.width      = currentStep >= s ? '18px' : '6px';
            d.style.background = currentStep >= s ? 'var(--accent)' : 'var(--hairline)';
            dotsEl.appendChild(d);
        });
    }

    function showReplayBtn() {
        var prog = document.getElementById('w-demo-progress');
        if (!prog) return;
        if (prog.querySelector('.w-demo-replay')) return;
        var btn = document.createElement('button');
        btn.className   = 'w-demo-replay';
        btn.textContent = '↻ See it again';
        btn.addEventListener('click', function() {
            cleanup();
            _instrDemoCleanup = initInstrDemoGrid(axisOrder, colorMap);
        });
        prog.appendChild(btn);
    }

    function goStep(s) {
        if (hasInteracted && s <= 5) return;
        step = s;
        updateDots(s);

        switch (s) {
            case 0:
                setCaption('<div style="animation:fadeIn 500ms ease both;">Imagine there are <b>100 random people</b>.</div>');
                // all grey (sx=0, sy=10 already), crosshair hidden
                break;

            case 1:
                setCaption('<div style="animation:fadeIn 500ms ease both;">For each scenario, you\'ll estimate how many are <em>' + demoDim + '</em> and <em>' + demoDim2 + '</em> to do something.</div>');
                break;

            case 2:
                setCaption('<div style="animation:fadeIn 500ms ease both;">This grid lets you show how many.</div>');
                grid.setHideCrosshair(false);
                // figures become colored as crosshair moves away from corner
                break;

            case 3:
                setCaption('<div style="animation:fadeIn 500ms ease both;">Drag toward the top-right to include more people.</div>');
                driftTo(7, 3, 2400, null);
                break;

            case 4:
                grid.setHidePills(false);
                grid.setShowCounts(true);
                setCaption('<div style="animation:fadeIn 500ms ease both; font-size:15px; color:var(--muted);">The count tracks your estimate.</div>');
                break;

            case 5:
                setCaption('<div style="animation:fadeIn 500ms ease both; font-size:15px; color:var(--muted);">Watch the count update — then try dragging yourself!</div>');
                driftTo(3, 8, 2000, function() {
                    if (!hasInteracted) {
                        schedule(800, function() {
                            grid.setInviteActive(true);
                            setCaption('<div style="animation:fadeIn 400ms ease both; font-size:15px; color:var(--muted);">Drag the crosshair anywhere on the grid.</div>');
                            updateDots(6);
                            showReplayBtn();
                        });
                    }
                });
                break;
        }
    }

    // user interaction cancels auto-animation
    grid.onInteract = function() {
        if (hasInteracted) return;
        hasInteracted = true;
        timers.forEach(clearTimeout);
        timers = [];
        grid.setInviteActive(false);
        grid.setHidePills(false);
        grid.setShowCounts(true);
        setCaption('<div style="animation:fadeIn 400ms ease both; font-size:15px; color:var(--muted);">Drag the crosshair anywhere on the grid.</div>');
        updateDots(6);
        showReplayBtn();
    };

    // kick off sequence
    goStep(0);
    schedule(3000,  function() { goStep(1); });
    schedule(6500,  function() { goStep(2); });
    schedule(9500,  function() { goStep(3); });
    schedule(13000, function() { goStep(4); });
    schedule(17000, function() { goStep(5); });

    function cleanup() {
        timers.forEach(clearTimeout);
        timers = [];
        grid.destroy();
    }

    return cleanup;
}
