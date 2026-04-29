// ---- geometry ----
var W_CELL = 34, W_GAP = 4, W_SLOT = 38;
var W_FIG_TOTAL  = 10 * W_CELL + 9 * W_GAP;  // 376px — figure grid
var W_DRAG_TOTAL = 360;                        // drag square
var INSTR_S      = 320;                        // instruction grid size


// quadrant key from (col, row) given axis orientation
// AW: x=able, y=willing  |  WA: x=willing, y=able
function wQuadKey(col, row, sx, sy, axisOrder) {
    var isAble, isWilling;
    if (axisOrder === 'AW') {
        isAble    = col < sx;
        isWilling = row < sy;
    } else {
        isWilling = col < sx;
        isAble    = row < sy;
    }
    return (isAble ? 'A' : 'NA') + (isWilling ? 'W' : 'NW');
}


// quadrant counts from snap position (sx, sy each 0-10)
function wCounts(sx, sy, axisOrder) {
    if (axisOrder === 'AW') {
        // x=able, y=willing
        return { AW: sx*sy, ANW: sx*(10-sy), NAW: (10-sx)*sy, NANW: (10-sx)*(10-sy) };
    } else {
        // x=willing, y=able
        return { AW: sx*sy, ANW: (10-sx)*sy, NAW: sx*(10-sy), NANW: (10-sx)*(10-sy) };
    }
}


// pixel x/y of snap boundary n for the figure grid (center of gap)
function wFigPx(n) {
    if (n === 0)  return 0;
    if (n === 10) return W_FIG_TOTAL;
    return n * W_SLOT - W_GAP / 2;
}

// pixel x/y of snap boundary n for the drag square (evenly spaced)
function wDragPx(n) { return n * (W_DRAG_TOTAL / 10); }


// hex → rgba
function hexToRgba(hex, a) {
    var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return 'rgba('+r+','+g+','+b+','+a+')';
}


// pixel bounds of a semantic quadrant inside the drag square
function wDragQuadBounds(key, sx, sy, axisOrder) {
    var xPx = wDragPx(sx), yPx = wDragPx(sy), S = W_DRAG_TOTAL;
    var map = axisOrder === 'AW'
        ? { AW:{x:0,y:0,w:xPx,h:yPx}, NAW:{x:xPx,y:0,w:S-xPx,h:yPx}, ANW:{x:0,y:yPx,w:xPx,h:S-yPx}, NANW:{x:xPx,y:yPx,w:S-xPx,h:S-yPx} }
        : { AW:{x:0,y:0,w:xPx,h:yPx}, ANW:{x:xPx,y:0,w:S-xPx,h:yPx}, NAW:{x:0,y:yPx,w:xPx,h:S-yPx}, NANW:{x:xPx,y:yPx,w:S-xPx,h:S-yPx} };
    return map[key];
}


// pill pixel positions for each quadrant (clamped to stay inside bounds)
function wPillPositions(sx, sy, axisOrder, total, getPx) {
    var PX = 72, PY = 32;
    function cx(v) { return Math.max(PX, Math.min(total-PX, v)); }
    function cy(v) { return Math.max(PY, Math.min(total-PY, v)); }
    var xSplit = getPx(sx), ySplit = getPx(sy);
    var L = cx(xSplit/2), R = cx((xSplit+total)/2);
    var T = cy(ySplit/2), B = cy((ySplit+total)/2);
    // AW always top-left pixel region; ANW/NAW swap position based on axisOrder
    return axisOrder === 'AW'
        ? { AW:{x:L,y:T}, NAW:{x:R,y:T}, ANW:{x:L,y:B}, NANW:{x:R,y:B} }
        : { AW:{x:L,y:T}, ANW:{x:R,y:T}, NAW:{x:L,y:B}, NANW:{x:R,y:B} };
}


// ---- shared trial builder ----
// opts: stimulus, axisOrder, colorMap, trialIndex (null for demo), jsPsych, isDemo, preText (optional HTML)
function _buildWaffleTrialInner(opts) {
    var stimulus   = opts.stimulus;
    var axisOrder  = opts.axisOrder;
    var colorMap   = opts.colorMap;
    var trialIndex = opts.trialIndex;
    var jsPsych    = opts.jsPsych;
    var isDemo     = !!opts.isDemo;
    var preText    = opts.preText || null;  // if set, shown for 2.5s before stimulus

    var quadLabels = getQuadLabels(axisOrder);

    var lbl = axisOrder === 'AW'
        ? { xPos:'Able', xNeg:'Not able', yPos:'Willing', yNeg:'Not willing' }
        : { xPos:'Willing', xNeg:'Not willing', yPos:'Able', yNeg:'Not able' };

    var total = SHOW_FIGURES ? W_FIG_TOTAL  : W_DRAG_TOTAL;
    var sqPx  = total + 'px';

    var interiorHTML = SHOW_FIGURES
        ? `<div class='wfig-wrap' id='w-interactive' style='width:${sqPx};height:${sqPx};'>
               <div class='wfig-grid' id='wfig-grid'
                    style='grid-template-columns:repeat(10,${W_CELL}px);grid-template-rows:repeat(10,${W_CELL}px);'></div>
               <div class='wch-line wch-h'  id='wch-h'></div>
               <div class='wch-line wch-v'  id='wch-v'></div>
               <div class='wch-line wch-dot' id='wch-dot'></div>
               <div class='wcount-pill' id='wpill-AW'></div>
               <div class='wcount-pill' id='wpill-ANW'></div>
               <div class='wcount-pill' id='wpill-NAW'></div>
               <div class='wcount-pill' id='wpill-NANW'></div>
           </div>`
        : `<div class='wdrag-sq' id='w-interactive' style='width:${sqPx};height:${sqPx};'>
               <div class='wdrag-quad' id='wq-AW'></div>
               <div class='wdrag-quad' id='wq-ANW'></div>
               <div class='wdrag-quad' id='wq-NAW'></div>
               <div class='wdrag-quad' id='wq-NANW'></div>
               <div class='wch-line wch-h'  id='wch-h'></div>
               <div class='wch-line wch-v'  id='wch-v'></div>
               <div class='wch-line wch-dot' id='wch-dot'></div>
               <div class='wcount-pill' id='wpill-AW'></div>
               <div class='wcount-pill' id='wpill-ANW'></div>
               <div class='wcount-pill' id='wpill-NAW'></div>
               <div class='wcount-pill' id='wpill-NANW'></div>
           </div>`;

    var counter = trialIndex != null
        ? `<div class='item-counter'>${trialIndex} / ${N_TRIALS_PER_PARTICIPANT}</div>` : '';

    var btnLabel = isDemo ? 'Continue' : 'Submit';
    var btnID    = isDemo ? 'demo-waffle-btn' : 'waffle-submit-btn';

    // stimulus: opacity:0 keeps layout for measuring; demo also display:none until pre-text done
    var stimStyle = isDemo ? "style='display:none; opacity:0;'" : "style='opacity:0;'";

    var trialHTML = `
        <div class='prevent-select trial-box'>
            ${counter}
            <div id='w-stage' style='display:flex; flex-direction:column; min-height:460px;'>
                ${preText ? `<div id='w-pre-text' style='margin-top:auto; margin-bottom:auto; text-align:center;'>${preText}</div>` : ''}
                <div id='w-center-spacer' style='height:0; flex-shrink:0;'></div>
                <div id='w-stimulus-section' ${stimStyle}>
                    <p class='trial-vignette'>${stimulus.vignette}</p>
                    <p class='trial-question'><em><b>"Can you ${stimulus.actionPhrase}?"</b></em></p>
                </div>
                <div id='w-grid-section' style='display:none; opacity:0; transform:translateY(20px); transition:opacity 0.7s ease, transform 0.7s ease;'>
                    <p class='waffle-instr'>Drag the crosshair to show how many of the 100 people fall into each group.</p>
                    <div class='waffle-section'>
                        <div class='waffle-outer'>
                            <div class='waffle-top-row'>
                                <div class='waffle-axis-spacer'></div>
                                <div class='waffle-axis-top-labels' style='width:${sqPx};'>
                                    <div class='waffle-axis-top-label' id='wlbl-xpos'>${lbl.xPos}</div>
                                    <div class='waffle-axis-top-label' id='wlbl-xneg'>${lbl.xNeg}</div>
                                </div>
                                <div class='waffle-axis-spacer'></div>
                            </div>
                            <div class='waffle-mid-row'>
                                <div class='waffle-axis-side' style='height:${sqPx};'>
                                    <div class='waffle-axis-side-label' id='wlbl-ypos'>${lbl.yPos}</div>
                                    <div class='waffle-axis-side-label' id='wlbl-yneg'>${lbl.yNeg}</div>
                                </div>
                                ${interiorHTML}
                                <div class='waffle-axis-spacer'></div>
                            </div>
                        </div>
                    </div>
                    <div style='text-align:center; margin-top:20px;'>
                        <button id='${btnID}' class='jspsych-btn' disabled>${btnLabel}</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: trialHTML,
        choices: [],
        response_ends_trial: false,
        on_load: function() {
            var trialStart          = performance.now();
            var firstInteractionRT  = null;
            var hasInteracted       = false;
            var showCounts          = false;
            var vignetteMinPassed   = false;
            var gridMinPassed       = false;
            var dragging            = false;

            var stageEl         = document.getElementById('w-stage');
            var spacerEl        = document.getElementById('w-center-spacer');
            var stimulusSection = document.getElementById('w-stimulus-section');
            var gridSection     = document.getElementById('w-grid-section');
            var preTextEl       = preText ? document.getElementById('w-pre-text') : null;
            var wrapEl          = document.getElementById('w-interactive');
            var chH             = document.getElementById('wch-h');
            var chV             = document.getElementById('wch-v');
            var chDot           = document.getElementById('wch-dot');
            var submitBtn       = document.getElementById(btnID);
            var pillEls = {
                AW:   document.getElementById('wpill-AW'),
                ANW:  document.getElementById('wpill-ANW'),
                NAW:  document.getElementById('wpill-NAW'),
                NANW: document.getElementById('wpill-NANW')
            };

            var sx = 5, sy = 5;

            // build figure cells if needed
            var figGroups = null;
            if (SHOW_FIGURES) {
                var NS = 'http://www.w3.org/2000/svg';
                figGroups = [];
                var gridEl = document.getElementById('wfig-grid');
                for (var i = 0; i < 100; i++) {
                    var cell = document.createElement('div');
                    cell.className = 'wfig-cell';
                    cell.style.width  = W_CELL + 'px';
                    cell.style.height = W_CELL + 'px';
                    var svg = document.createElementNS(NS, 'svg');
                    svg.setAttribute('viewBox', '0 0 12 14');
                    svg.setAttribute('width', '26'); svg.setAttribute('height', '28');
                    var g = document.createElementNS(NS, 'g');
                    var head = document.createElementNS(NS, 'circle');
                    head.setAttribute('cx','6'); head.setAttribute('cy','3.8'); head.setAttribute('r','3');
                    var body = document.createElementNS(NS, 'path');
                    body.setAttribute('d','M0,14 Q0,8.5 3,7.5 Q4.2,8 6,8 Q7.8,8 9,7.5 Q12,8.5 12,14Z');
                    g.appendChild(head); g.appendChild(body);
                    svg.appendChild(g); cell.appendChild(svg);
                    gridEl.appendChild(cell);
                    figGroups.push(g);
                }
            }

            // drag quad els if needed
            var quadEls = null;
            if (!SHOW_FIGURES) {
                quadEls = {
                    AW:   document.getElementById('wq-AW'),
                    ANW:  document.getElementById('wq-ANW'),
                    NAW:  document.getElementById('wq-NAW'),
                    NANW: document.getElementById('wq-NANW')
                };
            }

            var getPx = SHOW_FIGURES ? wFigPx : wDragPx;

            function render() {
                var xPx = getPx(sx), yPx = getPx(sy);

                chH.style.top    = (yPx - 1) + 'px';
                chV.style.left   = (xPx - 1) + 'px';
                chDot.style.left = xPx + 'px';
                chDot.style.top  = yPx + 'px';

                // axis labels track the crosshair — centered in their region
                var elXPos = document.getElementById('wlbl-xpos');
                var elXNeg = document.getElementById('wlbl-xneg');
                var elYPos = document.getElementById('wlbl-ypos');
                var elYNeg = document.getElementById('wlbl-yneg');
                if (elXPos) { elXPos.style.width = xPx + 'px'; elXNeg.style.width = (total - xPx) + 'px'; }
                if (elYPos) { elYPos.style.height = yPx + 'px'; elYNeg.style.height = (total - yPx) + 'px'; }

                var counts = wCounts(sx, sy, axisOrder);
                var pills  = wPillPositions(sx, sy, axisOrder, total, getPx);

                ['AW','ANW','NAW','NANW'].forEach(function(key) {
                    var pill = pillEls[key];
                    var pos  = pills[key];
                    var n    = counts[key];
                    pill.style.left  = pos.x + 'px';
                    pill.style.top   = pos.y + 'px';
                    pill.style.color = colorMap[key];
                    // before interaction: show all 4 pills with ?
                    // after interaction: hide pills for empty quadrants only
                    pill.style.display = showCounts ? (n > 0 ? '' : 'none') : '';
                    var countText = showCounts ? n : '?';
                    var unitSpan  = showCounts ? ' <span class="wcount-unit">people</span>' : '';
                    pill.innerHTML = '<span class="wcount-n">'+countText+'</span>'
                                   + unitSpan
                                   +'<span class="wcount-lbl">'+quadLabels[key]+'</span>';
                });

                if (figGroups) {
                    figGroups.forEach(function(g, idx) {
                        var col = idx % 10, row = Math.floor(idx / 10);
                        g.setAttribute('fill', colorMap[wQuadKey(col, row, sx, sy, axisOrder)]);
                    });
                } else {
                    ['AW','ANW','NAW','NANW'].forEach(function(key) {
                        var b = wDragQuadBounds(key, sx, sy, axisOrder);
                        var q = quadEls[key];
                        q.style.left       = b.x + 'px';
                        q.style.top        = b.y + 'px';
                        q.style.width      = b.w + 'px';
                        q.style.height     = b.h + 'px';
                        q.style.background = hexToRgba(colorMap[key], 0.18);
                    });
                }
            }

            function tryEnableSubmit() {
                if (hasInteracted && gridMinPassed && vignetteMinPassed) {
                    submitBtn.disabled = false;
                }
            }

            // slide vignette up (spacer → 0), fade+slide grid in; start 3s minimum timer
            function revealGrid() {
                spacerEl.style.height = '0px';
                gridSection.style.display = '';
                requestAnimationFrame(function() {
                    requestAnimationFrame(function() {
                        gridSection.style.opacity   = '1';
                        gridSection.style.transform = 'translateY(0)';
                    });
                });
                setTimeout(function() {
                    gridMinPassed = true;
                    tryEnableSubmit();
                }, 3000);
                render();  // initial render: crosshair at center, ? marks
            }

            // center stimulus, fade in, schedule grid reveal + 5s vignette min (used for demo)
            function revealStimulus() {
                stimulusSection.style.display = '';
                requestAnimationFrame(function() {
                    var stageH = stageEl.offsetHeight;
                    var stimH  = stimulusSection.offsetHeight;
                    spacerEl.style.height = Math.max(0, (stageH - stimH) / 2) + 'px';
                    setTimeout(function() {
                        spacerEl.style.transition = 'height 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    }, 80);
                    stimulusSection.style.transition = 'opacity 0.4s ease';
                    stimulusSection.style.opacity = '1';
                    setTimeout(function() { vignetteMinPassed = true; tryEnableSubmit(); }, 5000);
                    setTimeout(revealGrid, 4000);
                });
            }

            if (isDemo && preTextEl) {
                // phase 1: pre-text for 3.5s, then fade out and reveal stimulus
                setTimeout(function() {
                    preTextEl.style.transition = 'opacity 0.3s ease';
                    preTextEl.style.opacity = '0';
                    setTimeout(function() {
                        preTextEl.style.display = 'none';
                        revealStimulus();
                    }, 300);
                }, 3500);
            } else {
                // main trial: center vignette synchronously, then fade in + schedule timers
                (function() {
                    var stageH = stageEl.offsetHeight;
                    var stimH  = stimulusSection.offsetHeight;
                    spacerEl.style.height = Math.max(0, (stageH - stimH) / 2) + 'px';
                    setTimeout(function() {
                        spacerEl.style.transition = 'height 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                    }, 80);
                    requestAnimationFrame(function() {
                        stimulusSection.style.transition = 'opacity 0.4s ease';
                        stimulusSection.style.opacity = '1';
                    });
                    setTimeout(function() { vignetteMinPassed = true; tryEnableSubmit(); }, 5000);
                    setTimeout(revealGrid, 3000);
                })();
            }

            function snapVal(frac) { return Math.max(0, Math.min(10, Math.round(frac * 10))); }

            function getSnap(e) {
                var rect = wrapEl.getBoundingClientRect();
                var cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
                var cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
                return { sx: snapVal(cx / total), sy: snapVal(cy / total) };
            }

            function onInteract(e) {
                dragging = true;
                if (!hasInteracted) {
                    hasInteracted = true;
                    showCounts = true;
                    firstInteractionRT = Math.round(performance.now() - trialStart);
                    tryEnableSubmit();
                }
                var s = getSnap(e); sx = s.sx; sy = s.sy;
                render();
                e.preventDefault();
            }

            wrapEl.addEventListener('mousedown',  onInteract);
            wrapEl.addEventListener('touchstart', onInteract, { passive: false });
            document.addEventListener('mousemove', function(e) {
                if (!dragging) return;
                var s = getSnap(e); sx = s.sx; sy = s.sy; render();
            });
            document.addEventListener('touchmove', function(e) {
                if (!dragging) return;
                var s = getSnap(e); sx = s.sx; sy = s.sy; render();
                e.preventDefault();
            }, { passive: false });
            document.addEventListener('mouseup',  function() { dragging = false; });
            document.addEventListener('touchend', function() { dragging = false; });

            submitBtn.addEventListener('click', function() {
                var totalRT = Math.round(performance.now() - trialStart);

                if (isDemo) {
                    jsPsych.finishTrial();
                    return;
                }

                var counts = wCounts(sx, sy, axisOrder);
                var trialData = {
                    itemID:              stimulus.itemID,
                    actionPhrase:        stimulus.actionPhrase,
                    vignette:            stimulus.vignette,
                    axisOrder:           axisOrder,
                    colorMap:            JSON.stringify(colorMap),
                    showFigures:         SHOW_FIGURES ? 1 : 0,
                    snapX:               sx,
                    snapY:               sy,
                    nAW:                 counts.AW,
                    nANW:                counts.ANW,
                    nNAW:                counts.NAW,
                    nNANW:               counts.NANW,
                    abilityResponse:     counts.AW + counts.ANW,
                    willingnessResponse: counts.AW + counts.NAW,
                    firstInteractionRT:  firstInteractionRT,
                    trialRT:             totalRT,
                    trialIndex:          trialIndex,
                    suspicious:          totalRT < 1500
                };

                jsPsych.data.dataProperties.trialResponses.push(trialData);
                logToBrowser('waffle trial', trialData);
                jsPsych.finishTrial();
            });
        }
    };
}


// ---- interactive instruction grid ----
// called from main_waffle.js on_load / nav handler whenever page 3 is visible
function initInstrGrid(axisOrder, colorMap) {
    var wrapEl = document.getElementById('instr-interactive');
    if (!wrapEl) return;

    var quadLabels = getQuadLabels(axisOrder);
    var chH   = document.getElementById('instr-ch-h');
    var chV   = document.getElementById('instr-ch-v');
    var chDot = document.getElementById('instr-ch-dot');
    var pillEls = {
        AW:   document.getElementById('instr-pill-AW'),
        ANW:  document.getElementById('instr-pill-ANW'),
        NAW:  document.getElementById('instr-pill-NAW'),
        NANW: document.getElementById('instr-pill-NANW')
    };
    var quadEls = {
        AW:   document.getElementById('instr-q-AW'),
        ANW:  document.getElementById('instr-q-ANW'),
        NAW:  document.getElementById('instr-q-NAW'),
        NANW: document.getElementById('instr-q-NANW')
    };
    var lblXPos = document.getElementById('instr-lbl-xpos');
    var lblXNeg = document.getElementById('instr-lbl-xneg');
    var lblYPos = document.getElementById('instr-lbl-ypos');
    var lblYNeg = document.getElementById('instr-lbl-yneg');

    var sx = 5, sy = 5;
    var dragging = false;
    var showCounts = false;

    function iPx(n) { return n * (INSTR_S / 10); }

    function iQuadBounds(key, _sx, _sy) {
        var xPx = iPx(_sx), yPx = iPx(_sy), S = INSTR_S;
        return (axisOrder === 'AW'
            ? { AW:{x:0,y:0,w:xPx,h:yPx}, NAW:{x:xPx,y:0,w:S-xPx,h:yPx}, ANW:{x:0,y:yPx,w:xPx,h:S-yPx}, NANW:{x:xPx,y:yPx,w:S-xPx,h:S-yPx} }
            : { AW:{x:0,y:0,w:xPx,h:yPx}, ANW:{x:xPx,y:0,w:S-xPx,h:yPx}, NAW:{x:0,y:yPx,w:xPx,h:S-yPx}, NANW:{x:xPx,y:yPx,w:S-xPx,h:S-yPx} }
        )[key];
    }

    function instrRender() {
        var xPx = iPx(sx), yPx = iPx(sy);

        chH.style.top    = (yPx - 1) + 'px';
        chV.style.left   = (xPx - 1) + 'px';
        chDot.style.left = xPx + 'px';
        chDot.style.top  = yPx + 'px';

        if (lblXPos) { lblXPos.style.width = xPx + 'px'; lblXNeg.style.width = (INSTR_S - xPx) + 'px'; }
        if (lblYPos) { lblYPos.style.height = yPx + 'px'; lblYNeg.style.height = (INSTR_S - yPx) + 'px'; }

        var counts = wCounts(sx, sy, axisOrder);
        var pills  = wPillPositions(sx, sy, axisOrder, INSTR_S, iPx);

        ['AW','ANW','NAW','NANW'].forEach(function(key) {
            var pill = pillEls[key];
            var pos  = pills[key];
            var n    = counts[key];
            pill.style.left  = pos.x + 'px';
            pill.style.top   = pos.y + 'px';
            pill.style.color = colorMap[key];
            pill.style.display = showCounts ? (n > 0 ? '' : 'none') : '';
            var unitSpan = showCounts ? ' <span class="wcount-unit">people</span>' : '';
            pill.innerHTML = '<span class="wcount-n">' + (showCounts ? n : '?') + '</span>'
                           + unitSpan
                           + '<span class="wcount-lbl">' + quadLabels[key] + '</span>';

            var b = iQuadBounds(key, sx, sy);
            var q = quadEls[key];
            q.style.left       = b.x + 'px';
            q.style.top        = b.y + 'px';
            q.style.width      = b.w + 'px';
            q.style.height     = b.h + 'px';
            q.style.background = hexToRgba(colorMap[key], 0.18);
        });
    }

    function snapVal(frac) { return Math.max(0, Math.min(10, Math.round(frac * 10))); }

    function getSnap(e) {
        var rect = wrapEl.getBoundingClientRect();
        var cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        var cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        return { sx: snapVal(cx / INSTR_S), sy: snapVal(cy / INSTR_S) };
    }

    function onInteract(e) {
        dragging = true;
        showCounts = true;
        var s = getSnap(e); sx = s.sx; sy = s.sy;
        instrRender();
        e.preventDefault();
    }

    // document-level handlers: check element still in DOM to auto-cleanup after nav
    function onMove(e) {
        if (!dragging || !document.body.contains(wrapEl)) return;
        var s = getSnap(e); sx = s.sx; sy = s.sy; instrRender();
    }
    function onTouchMove(e) {
        if (!dragging || !document.body.contains(wrapEl)) return;
        var s = getSnap(e); sx = s.sx; sy = s.sy; instrRender();
        e.preventDefault();
    }
    function onUp() { dragging = false; }

    wrapEl.addEventListener('mousedown',  onInteract);
    wrapEl.addEventListener('touchstart', onInteract, { passive: false });
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('mouseup',  onUp);
    document.addEventListener('touchend', onUp);

    instrRender();
}


function buildWaffleTrial(stimulus, axisOrder, colorMap, trialIndex, jsPsych) {
    return _buildWaffleTrialInner({ stimulus, axisOrder, colorMap, trialIndex, jsPsych, isDemo: false });
}


function buildWaffleDemo(axisOrder, colorMap, jsPsych) {
    var demoStimulus = {
        vignette:     "You're hanging out with a group of friends. Someone pulls out a scrambled Rubik's cube and passes it around. Eventually they hand it to you and say:",
        actionPhrase: "solve the Rubik's cube"
    };
    var preText = `
        <div style='text-align:center; padding:30px 0;'>
            <p style='font-size:20px; line-height:1.6; margin:0;'>
                You'll now see an example of what the study will look like.<br>
                Feel free to try it out before starting.
            </p>
        </div>`;
    return _buildWaffleTrialInner({
        stimulus:   demoStimulus,
        axisOrder:  axisOrder,
        colorMap:   colorMap,
        trialIndex: null,
        jsPsych:    jsPsych,
        isDemo:     true,
        preText:    preText
    });
}
