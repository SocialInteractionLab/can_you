// ---- geometry ----
var W_LINEAR_W         = 560;  // trial grid width (px)
var W_LINEAR_H         = 420;  // trial grid height (px)
var W_LINEAR_DEMO_SIZE = 360;  // demo grid (square, px)

// snap to nearest integer (0..10)
function wSnapVal(frac) {
    return Math.max(0, Math.min(10, Math.round(frac * 10)));
}

// yes-region count: bottom-left rectangle
// yes: col < sx AND row >= sy → count = sx*(10-sy)
function wLinearCount(sx, sy) {
    return sx * (10 - sy);
}

function hexToRgba(hex, a) {
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return 'rgba('+r+','+g+','+b+','+a+')';
}


// ============================================================
// LinearGrid — vanilla JS component
// 1D figure grid: bottom-left rectangle is the "yes" region.
//   initial: sx=0, sy=10 (all grey, count=0)
//   yes region: col < sx AND row >= sy
//   count = sx * (10 - sy)
// Returns a controller object.
// ============================================================
// gW = grid width (px), gH = grid height (px) — grids are rectangular
function buildLinearGridVanilla(parentEl, gW, gH, yesColor, opts) {
    opts = opts || {};
    var snap         = opts.snap !== false;
    var hapticOnSnap = opts.hapticOnSnap !== false;
    var noColor      = PALETTES[PALETTE_NAME].NANW;

    var sx = 0, sy = 10;
    var showCounts    = !!opts.showCounts;
    var hidePills     = !!opts.hidePills;
    var hideCrosshair = !!opts.hideCrosshair;
    var inviteActive  = false;
    var lastSnap      = { sx: 0, sy: 10 };
    var dragging      = false;
    var hasInteracted = false;
    var hasReleased   = false;
    var destroyed     = false;

    var ctrl = { onInteract: null, onRelease: null, onChange: null };

    // ---- build DOM ----
    var wrapper = document.createElement('div');
    wrapper.className = 'wl-wrapper';
    wrapper.dataset.invitePulse = 'false';

    var figArea = document.createElement('div');
    figArea.className = 'wg-figure-area';
    figArea.dataset.figureArea = 'true';
    figArea.style.width  = gW + 'px';
    figArea.style.height = gH + 'px';

    var hLine = document.createElement('div');
    hLine.className = 'wg-h-line';
    var vLine = document.createElement('div');
    vLine.className = 'wg-v-line';
    var knob = document.createElement('div');
    knob.className = 'wg-knob';
    knob.dataset.crosshair = 'knob';

    figArea.appendChild(hLine);
    figArea.appendChild(vLine);
    figArea.appendChild(knob);

    // 100 person figures — cells are rectangular (cellW × cellH)
    var NS = 'http://www.w3.org/2000/svg';
    var cellW = gW / 10;
    var cellH = gH / 10;
    var figGroups = [];

    for (var i = 0; i < 100; i++) {
        var col = i % 10, row = Math.floor(i / 10);
        var cell = document.createElement('div');
        cell.className = 'wg-figure-cell';
        cell.style.left   = (col * cellW) + 'px';
        cell.style.top    = (row * cellH) + 'px';
        cell.style.width  = cellW + 'px';
        cell.style.height = cellH + 'px';

        var rainDelay = (row * 10 + col) * 14;
        cell.style.animation = 'figureRain 500ms cubic-bezier(.2,.8,.2,1) ' + rainDelay + 'ms both';

        var svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 12 14');
        svg.setAttribute('width',  cellW * 0.55);
        svg.setAttribute('height', cellH * 0.65);

        var g = document.createElementNS(NS, 'g');
        g.style.transition = 'fill 800ms cubic-bezier(.2,.8,.2,1)';

        var head = document.createElementNS(NS, 'circle');
        head.setAttribute('cx','6'); head.setAttribute('cy','3.8'); head.setAttribute('r','3');
        var body = document.createElementNS(NS, 'path');
        body.setAttribute('d','M0,14 Q0,8.5 3,7.5 Q4.2,8 6,8 Q7.8,8 9,7.5 Q12,8.5 12,14Z');

        g.appendChild(head);
        g.appendChild(body);
        svg.appendChild(g);
        cell.appendChild(svg);
        figArea.appendChild(cell);
        figGroups.push({ g: g, col: col, row: row });
    }

    // single count pill — centered in yes region (bottom-left rectangle)
    var pill = document.createElement('div');
    pill.className = 'wg-pill';
    figArea.appendChild(pill);

    wrapper.appendChild(figArea);
    parentEl.appendChild(wrapper);

    if (hideCrosshair) {
        hLine.style.opacity = '0';
        vLine.style.opacity = '0';
        knob.style.opacity  = '0';
    }

    // ---- render ----
    function render(skipFigureUpdate) {
        var xPx = (sx / 10) * gW;
        var yPx = (sy / 10) * gH;

        hLine.style.top  = (yPx - 0.5) + 'px';
        vLine.style.left = (xPx - 0.5) + 'px';
        // clamp knob so circle stays within figArea at corner positions
        var knobR = 11;
        knob.style.left = Math.max(knobR, Math.min(gW - knobR, xPx)) + 'px';
        knob.style.top  = Math.max(knobR, Math.min(gH - knobR, yPx)) + 'px';

        var count = wLinearCount(sx, sy);

        // pill: center of yes region x:[0,xPx] y:[yPx,gH]
        pill.style.left        = (xPx / 2) + 'px';
        pill.style.top         = ((yPx + gH) / 2) + 'px';
        pill.style.borderColor = hexToRgba(yesColor, 0.35);

        if (hidePills || count === 0) {
            pill.style.display = 'none';
        } else if (showCounts) {
            pill.innerHTML     = '<span class="wg-pill-n" style="color:' + yesColor + ';">' + count + '</span>';
            pill.style.display = '';
        } else {
            pill.style.display = 'none';
        }

        if (!skipFigureUpdate) {
            figGroups.forEach(function(fig) {
                fig.g.style.fill = (fig.col < sx && fig.row >= sy) ? yesColor : noColor;
            });
        }
    }

    function triggerSnapPulse() {
        knob.style.animation = 'none';
        knob.offsetWidth;
        knob.style.animation = 'snapPulse 280ms ease-out';
        if (inviteActive) {
            setTimeout(function() {
                if (inviteActive) wrapper.dataset.invitePulse = 'true';
            }, 300);
        }
    }

    // ---- drag ----
    function handleMove(clientX, clientY) {
        var rect = figArea.getBoundingClientRect();
        var newSx = snap ? wSnapVal((clientX - rect.left) / gW)
                         : Math.max(0, Math.min(10, ((clientX - rect.left) / gW) * 10));
        var newSy = snap ? wSnapVal((clientY - rect.top)  / gH)
                         : Math.max(0, Math.min(10, ((clientY - rect.top)  / gH) * 10));

        if (snap && hapticOnSnap && (newSx !== lastSnap.sx || newSy !== lastSnap.sy)) {
            triggerSnapPulse();
            lastSnap.sx = newSx;
            lastSnap.sy = newSy;
        }
        sx = newSx; sy = newSy;
        render();
        if (ctrl.onChange) ctrl.onChange({ sx: sx, sy: sy, count: wLinearCount(sx, sy) });
    }

    function onDown(e) {
        if (destroyed) return;
        dragging = true;
        if (!hasInteracted) {
            hasInteracted = true;
            if (ctrl.onInteract) ctrl.onInteract();
        }
        var cx = e.touches ? e.touches[0].clientX : e.clientX;
        var cy = e.touches ? e.touches[0].clientY : e.clientY;
        handleMove(cx, cy);
        e.preventDefault();
    }
    function onMove(e) {
        if (!dragging || destroyed) return;
        handleMove(e.clientX, e.clientY);
    }
    function onTouchMove(e) {
        if (!dragging || destroyed) return;
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault();
    }
    function onUp() {
        if (!dragging) return;
        dragging = false;
        if (hasInteracted && !hasReleased) {
            hasReleased = true;
            if (ctrl.onRelease) ctrl.onRelease();
        }
    }

    figArea.addEventListener('mousedown',  onDown);
    figArea.addEventListener('touchstart', onDown, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('mouseup',   onUp);
    document.addEventListener('touchend',  onUp);

    render();

    // ---- controller ----
    ctrl.setPos = function(newSx, newSy) {
        sx = newSx; sy = newSy;
        render();
        if (ctrl.onChange) ctrl.onChange({ sx: sx, sy: sy, count: wLinearCount(sx, sy) });
    };
    ctrl.setHideCrosshair = function(hide) {
        hideCrosshair = hide;
        hLine.style.opacity = hide ? '0' : '1';
        vLine.style.opacity = hide ? '0' : '1';
        knob.style.opacity  = hide ? '0' : '1';
    };
    ctrl.setShowCounts   = function(show) { showCounts = show; render(true); };
    ctrl.setHidePills    = function(hide) { hidePills  = hide; render(true); };
    ctrl.setInviteActive = function(active) {
        inviteActive = active;
        wrapper.dataset.invitePulse = active ? 'true' : 'false';
        if (active) knob.style.animation = '';
    };
    ctrl.setPointerEvents = function(enabled) {
        figArea.style.pointerEvents = enabled ? '' : 'none';
    };
    ctrl.getFigureAreaEl = function() { return figArea; };
    ctrl.destroy = function() {
        destroyed = true;
        figArea.removeEventListener('mousedown', onDown);
        figArea.removeEventListener('touchstart', onDown);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('mouseup', onUp);
        document.removeEventListener('touchend', onUp);
        if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
    };

    return ctrl;
}


// ============================================================
// Trial builder — two sequential 1D grids side-by-side
// ============================================================
function buildLinearTrial(stimulus, axisOrder, colorMap, trialIndex, jsPsych) {
    var palette = colorMap || PALETTES[PALETTE_NAME];

    // grid1 = first dimension; grid2 = conditional second dimension
    var grid1Color = axisOrder === 'AW' ? palette.AW  : palette.NAW;
    var grid2Color = axisOrder === 'AW' ? palette.NAW : palette.AW;

    var dim1 = axisOrder === 'AW' ? 'able'    : 'willing';
    var dim2 = axisOrder === 'AW' ? 'willing' : 'able';

    var grid1Label = 'How many of the 100 people would be <em>' + dim1 + '</em> to do this?';
    var grid2Label = 'If all 100 people were <em>' + dim1 + '</em> to do this, how many would be <em>' + dim2 + '</em> to do it?';

    var isFirstFew     = trialIndex <= 2;
    var vignetteGateMs = isFirstFew ? 3000 : 1800;
    var gridGateMs     = isFirstFew ? 1500 : 600;
    var grid2GateMs    = isFirstFew ? 1200 : 600;
    var totalTrials    = N_TRIALS_PER_PARTICIPANT;

    var pct = Math.round(((trialIndex - 1) / totalTrials) * 100);

    var html = `
        <div class="w-scene">
            ${getSectionTickerHTML('study')}
            <div class="w-progress-strip">
                <div class="w-progress-row">
                    <span class="w-progress-label">Scenario ${trialIndex} of ${totalTrials}</span>
                    <span class="w-progress-pct">${pct}%</span>
                </div>
                <div class="w-progress-track">
                    <div class="w-progress-fill" id="w-prog-fill" style="width:${pct}%;"></div>
                </div>
            </div>
            <div class="w-card" id="w-trial-card">
                <div id="w-stimulus-section" style="${isFirstFew ? 'padding-top:80px;' : ''} transition:${isFirstFew ? 'padding-top 700ms cubic-bezier(.22,.8,.28,1)' : 'none'};">
                    <p class="w-vignette">${stimulus.vignette}</p>
                    <p class="w-question">"Can you ${stimulus.actionPhrase}?"</p>
                </div>
                <div id="w-grids-section" style="opacity:0; transform:translateY(20px); transition:opacity 500ms ease, transform 500ms cubic-bezier(.2,.8,.2,1); pointer-events:none;">
                    <div class="w-grids-row">
                        <div class="w-grid-col" id="w-grid1-col">
                            <p class="w-grid-label">${grid1Label}</p>
                            <div id="w-grid1-container"></div>
                        </div>
                        <div class="w-grid-col" id="w-grid2-col" style="display:none; opacity:0; transform:translateX(40px); transition:opacity 500ms ease, transform 500ms cubic-bezier(.2,.8,.2,1); pointer-events:none;">
                            <p class="w-grid-label">${grid2Label}</p>
                            <div id="w-grid2-container"></div>
                        </div>
                    </div>
                    <div class="w-grid-actions">
                        <div class="w-grid-spacer">
                            ${trialIndex > 1 ? '<button id="w-prev-btn" class="w-btn-ghost">← Previous</button>' : ''}
                        </div>
                        <div style="display:flex; flex-direction:column; align-items:center;">
                            <button id="w-submit-btn" class="w-btn-primary" disabled>Submit</button>
                            <div class="w-btn-hint" id="w-submit-hint">Drag the grid to continue</div>
                        </div>
                        <div class="w-grid-spacer"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: html,
        choices: [],
        response_ends_trial: false,
        on_load: function() {
            var trialStart        = performance.now();
            var hasInteracted1    = false;
            var hasInteracted2    = false;
            var vignetteGate      = false;
            var gridGate          = false;
            var grid2Revealed     = false;
            var grid2Gate         = false;
            var submitting        = false;
            var firstInterRT      = null;
            var grid2FirstInterRT = null;
            var lastResp1         = { sx: 0, sy: 10, count: 0 };
            var lastResp2         = { sx: 0, sy: 10, count: 0 };

            var stimSection  = document.getElementById('w-stimulus-section');
            var gridsSection = document.getElementById('w-grids-section');
            var grid2Col     = document.getElementById('w-grid2-col');
            var grid1Cont    = document.getElementById('w-grid1-container');
            var grid2Cont    = document.getElementById('w-grid2-container');
            var submitBtn    = document.getElementById('w-submit-btn');
            var hintEl       = document.getElementById('w-submit-hint');
            var prevBtn      = document.getElementById('w-prev-btn');

            var grid1 = buildLinearGridVanilla(grid1Cont, W_LINEAR_W, W_LINEAR_H, grid1Color, {
                snap: true, hapticOnSnap: true,
            });
            var grid2 = buildLinearGridVanilla(grid2Cont, W_LINEAR_W, W_LINEAR_H, grid2Color, {
                snap: true, hapticOnSnap: true,
            });

            grid1.onChange = function(state) {
                lastResp1 = state;
                if (!hasInteracted1) {
                    hasInteracted1 = true;
                    firstInterRT   = Math.round(performance.now() - trialStart);
                    grid1.setShowCounts(true);
                }
                updateSubmitState();
            };

            grid1.onRelease = function() {
                if (grid2Revealed) return;
                grid2Revealed = true;
                grid2Col.style.display = 'flex';
                grid2Col.style.flexDirection = 'column';
                // small delay so display:flex registers before CSS transition fires
                setTimeout(function() {
                    grid2Col.style.opacity       = '1';
                    grid2Col.style.transform     = 'translateX(0)';
                    grid2Col.style.pointerEvents = 'auto';
                }, 20);
                setTimeout(function() { grid2Gate = true; updateSubmitState(); }, grid2GateMs);
            };

            grid2.onChange = function(state) {
                lastResp2 = state;
                if (!hasInteracted2) {
                    hasInteracted2    = true;
                    grid2FirstInterRT = Math.round(performance.now() - trialStart);
                    grid2.setShowCounts(true);
                }
                updateSubmitState();
            };

            function updateSubmitState() {
                var canSubmit = hasInteracted1 && hasInteracted2 &&
                                vignetteGate && gridGate && grid2Gate && !submitting;
                submitBtn.disabled = !canSubmit;
                if (submitting) {
                    hintEl.style.display = 'none';
                } else if (!hasInteracted1) {
                    hintEl.textContent   = 'Drag the grid to continue';
                    hintEl.style.display = '';
                } else if (!grid2Revealed) {
                    hintEl.textContent   = 'Release to see the second question';
                    hintEl.style.display = '';
                } else if (!hasInteracted2) {
                    hintEl.textContent   = 'Now answer the second question';
                    hintEl.style.display = '';
                } else if (!gridGate || !grid2Gate) {
                    hintEl.textContent   = 'Take a moment to look it over';
                    hintEl.style.display = '';
                } else {
                    hintEl.style.display = 'none';
                }
            }

            // vignette gate + grid1 reveal
            setTimeout(function() {
                vignetteGate = true;
                if (isFirstFew) stimSection.style.paddingTop = '0px';
                gridsSection.style.opacity       = '1';
                gridsSection.style.transform     = 'translateY(0)';
                gridsSection.style.pointerEvents = 'auto';
                grid1Cont.style.animation = 'gridReveal 600ms cubic-bezier(.2,.8,.2,1) both';
                updateSubmitState();
            }, vignetteGateMs);

            // grid gate
            setTimeout(function() {
                gridGate = true;
                updateSubmitState();
            }, vignetteGateMs + gridGateMs);

            function onKey(e) {
                if (e.key === 'Enter' && !submitBtn.disabled && !submitting) doSubmit();
            }
            document.addEventListener('keydown', onKey);

            function doSubmit() {
                if (submitting) return;
                submitting = true;
                var totalRT = Math.round(performance.now() - trialStart);

                submitBtn.classList.add('confirmed');
                submitBtn.innerHTML  = '<span style="font-size:16px;">✓</span> Recorded';
                submitBtn.disabled   = true;
                hintEl.style.display = 'none';
                grid1.setPointerEvents(false);
                grid2.setPointerEvents(false);

                // axisOrder determines which grid is ability vs willingness
                var abilityResp     = axisOrder === 'AW' ? lastResp1.count : lastResp2.count;
                var willingnessResp = axisOrder === 'AW' ? lastResp2.count : lastResp1.count;

                var trialData = {
                    itemID:                  stimulus.itemID,
                    actionPhrase:            stimulus.actionPhrase,
                    vignette:                stimulus.vignette,
                    axisOrder:               axisOrder,
                    grid1Sx:                 lastResp1.sx,
                    grid1Sy:                 lastResp1.sy,
                    grid1Count:              lastResp1.count,
                    grid2Sx:                 lastResp2.sx,
                    grid2Sy:                 lastResp2.sy,
                    grid2Count:              lastResp2.count,
                    abilityResponse:         abilityResp,
                    willingnessResponse:     willingnessResp,
                    firstInteractionRT:      firstInterRT,
                    grid2FirstInteractionRT: grid2FirstInterRT,
                    trialRT:                 totalRT,
                    trialIndex:              trialIndex,
                    suspicious:              totalRT < 1500
                };
                jsPsych.data.dataProperties.trialResponses.push(trialData);
                logToBrowser('linear trial', trialData);

                setTimeout(function() {
                    document.removeEventListener('keydown', onKey);
                    jsPsych.finishTrial();
                }, 700);
            }

            submitBtn.addEventListener('click', doSubmit);
            if (prevBtn) {
                prevBtn.addEventListener('click', function() {
                    document.removeEventListener('keydown', onKey);
                    var responses = jsPsych.data.dataProperties.trialResponses;
                    if (responses.length > 0) responses.pop();
                    jsPsych.data.dataProperties._goBack = true;
                    jsPsych.finishTrial();
                });
            }

            updateSubmitState();
        }
    };
}
