// hover tooltips for able/willing
var DIM_TIPS = {
    able:    'Whether they have the skill or physical capacity to do it',
    willing: 'Whether they would agree or choose to do it'
};

function dimSpan(dim) {
    return `<em class='dim-tooltip' data-tip='${DIM_TIPS[dim]}'>${dim}</em>`;
}


function buildMainTrial(stimulus, sliderOrder, mainTrialIndex, jsPsych) {
    var topDim    = sliderOrder === 'AW' ? 'able'    : 'willing';
    var bottomDim = sliderOrder === 'AW' ? 'willing' : 'able';

    // slider 1: unconditional estimate
    var topQuestion = `How many of the 100 people would be ${dimSpan(topDim)} to?`;

    // slider 2: conditional on slider 1
    var bottomQuestion = sliderOrder === 'AW'
        ? `Assuming they were ${dimSpan('able')} to, how many would be ${dimSpan('willing')} to?`
        : `Assuming they were ${dimSpan('willing')} to, how many would be ${dimSpan('able')} to?`;

    var trialHTML = `
        <div class='prevent-select trial-box'>
            <div class='item-counter'>${mainTrialIndex} / ${N_TRIALS_PER_PARTICIPANT}</div>
            <p class='trial-preamble'>We asked 100 people to imagine the following situation:</p>
            <p class='trial-vignette'>${stimulus.vignette}</p>
            <p class='trial-question'><em><b>"Can you ${stimulus.actionPhrase}?"</b></em></p>
            <div class='slider-section'>
                <div class='slider-question'>
                    <p class='question-text'>${topQuestion}</p>
                    <input type='range' class='trial-slider' id='slider-top' min='0' max='100' step='1' value='50'>
                    <div class='slider-footer'>
                        <span class='slider-label-min'>0 people</span>
                        <span class='slider-value-display' id='val-top'>?</span>
                        <span class='slider-label-max'>100 people</span>
                    </div>
                </div>
                <div class='slider-question' id='bottom-slider-wrap' style='display:none; opacity:0; transition:opacity 0.25s ease;'>
                    <p class='question-text'>${bottomQuestion}</p>
                    <input type='range' class='trial-slider' id='slider-bottom' min='0' max='100' step='1' value='50'>
                    <div class='slider-footer'>
                        <span class='slider-label-min'>0 people</span>
                        <span class='slider-value-display' id='val-bottom'>?</span>
                        <span class='slider-label-max'>100 people</span>
                    </div>
                </div>
            </div>
            <div style='text-align:center; margin-top:24px;'>
                <button id='trial-submit-btn' class='jspsych-btn' disabled>Submit</button>
            </div>
        </div>
    `;

    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: trialHTML,
        choices: [],
        response_ends_trial: false,
        on_load: function() {
            var trialStart = performance.now();
            var topRT = null, bottomRT = null;
            var topTouched = false, bottomTouched = false;
            var topPointerDown = false, bottomPointerDown = false;
            var topDragged = false, bottomDragged = false;

            var sliderTop      = document.getElementById('slider-top');
            var sliderBottom   = document.getElementById('slider-bottom');
            var valTop         = document.getElementById('val-top');
            var valBottom      = document.getElementById('val-bottom');
            var submitBtn      = document.getElementById('trial-submit-btn');
            var bottomWrap     = document.getElementById('bottom-slider-wrap');
            var topRevealed    = false;

            function revealBottom() {
                if (!topRevealed) {
                    topRevealed = true;
                    bottomWrap.style.display = '';
                    requestAnimationFrame(function() { bottomWrap.style.opacity = '1'; });
                    updateSliderGradient(sliderBottom);
                }
            }

            updateSliderGradient(sliderTop);

            sliderTop.addEventListener('input', function() {
                updateSliderGradient(sliderTop);
                if (topTouched) valTop.textContent = `${sliderTop.value} people`;
            });
            sliderBottom.addEventListener('input', function() {
                updateSliderGradient(sliderBottom);
                if (bottomTouched) valBottom.textContent = `${sliderBottom.value} people`;
            });

            // mousedown not input — fires even if value stays at 50
            function touchTop() {
                if (!topTouched) {
                    topTouched = true;
                    topRT = Math.round(performance.now() - trialStart);
                    valTop.textContent = `${sliderTop.value} people`;
                }
                if (topTouched && bottomTouched) submitBtn.disabled = false;
            }
            function touchBottom() {
                if (!bottomTouched) {
                    bottomTouched = true;
                    bottomRT = Math.round(performance.now() - trialStart);
                    valBottom.textContent = `${sliderBottom.value} people`;
                }
                if (topTouched && bottomTouched) submitBtn.disabled = false;
            }

            sliderTop.addEventListener('mousedown', touchTop);
            sliderTop.addEventListener('touchstart', touchTop);
            sliderTop.addEventListener('keydown', touchTop);
            sliderBottom.addEventListener('mousedown', touchBottom);
            sliderBottom.addEventListener('touchstart', touchBottom);
            sliderBottom.addEventListener('keydown', touchBottom);

            sliderTop.addEventListener('pointerdown', function() { topPointerDown = true; });
            sliderTop.addEventListener('pointermove', function() { if (topPointerDown) topDragged = true; });
            sliderBottom.addEventListener('pointerdown', function() { bottomPointerDown = true; });
            sliderBottom.addEventListener('pointermove', function() { if (bottomPointerDown) bottomDragged = true; });
            document.addEventListener('pointerup', function() {
                if (topPointerDown) revealBottom();
                topPointerDown = false;
                bottomPointerDown = false;
            });
            sliderTop.addEventListener('touchend', revealBottom);
            sliderTop.addEventListener('keyup', revealBottom);

            submitBtn.addEventListener('click', function() {
                var totalRT = Math.round(performance.now() - trialStart);
                var topVal    = parseInt(sliderTop.value);
                var bottomVal = parseInt(sliderBottom.value);

                var abilityResponse, abilityRT, abilityDragged;
                var willingnessResponse, willingnessRT, willingnessDragged;

                if (sliderOrder === 'AW') {
                    abilityResponse    = topVal;    abilityRT    = topRT;    abilityDragged    = topDragged;
                    willingnessResponse = bottomVal; willingnessRT = bottomRT; willingnessDragged = bottomDragged;
                } else {
                    willingnessResponse = topVal;   willingnessRT = topRT;   willingnessDragged = topDragged;
                    abilityResponse    = bottomVal; abilityRT    = bottomRT; abilityDragged    = bottomDragged;
                }

                var trialData = {
                    itemID:              stimulus.itemID,
                    actionPhrase:        stimulus.actionPhrase,
                    vignette:            stimulus.vignette,
                    abilityResponse:     abilityResponse,
                    abilityRT:           abilityRT,
                    abilityDragged:      abilityDragged,
                    willingnessResponse: willingnessResponse,
                    willingnessRT:       willingnessRT,
                    willingnessDragged:  willingnessDragged,
                    trialRT:             totalRT,
                    trialIndex:          mainTrialIndex,
                    suspicious:          totalRT < 1500
                };

                jsPsych.data.dataProperties.trialResponses.push(trialData);
                jsPsych.progressBar.progress = mainTrialIndex / N_TRIALS_PER_PARTICIPANT;
                logToBrowser('trial response', trialData);
                jsPsych.finishTrial();
            });
        }
    };
}


function buildAttentionCheck(checkConfig, sliderOrder, jsPsych) {
    var N = checkConfig.targetValue;
    var topDim    = sliderOrder === 'AW' ? 'able'    : 'willing';
    var bottomDim = sliderOrder === 'AW' ? 'willing' : 'able';

    // match main trial wording for consistency
    var attnTopQ = `How many of the 100 people would be ${dimSpan(topDim)} to?`;
    var attnBottomQ = sliderOrder === 'AW'
        ? `Assuming they were ${dimSpan('able')} to, how many would be ${dimSpan('willing')} to?`
        : `Assuming they were ${dimSpan('willing')} to, how many would be ${dimSpan('able')} to?`;

    var html = `
        <div class='prevent-select trial-box'>
            <p class='trial-question' style='margin-bottom:28px;'>Please move both sliders to exactly <b>${N} people</b>.</p>
            <div class='slider-section'>
                <div class='slider-question'>
                    <p class='question-text'>${attnTopQ}</p>
                    <input type='range' class='trial-slider' id='attn-slider-top' min='0' max='100' step='1' value='50'>
                    <div class='slider-footer'>
                        <span class='slider-label-min'>0 people</span>
                        <span class='slider-value-display' id='attn-val-top'>?</span>
                        <span class='slider-label-max'>100 people</span>
                    </div>
                </div>
                <div class='slider-question' id='attn-bottom-wrap' style='display:none; opacity:0; transition:opacity 0.25s ease;'>
                    <p class='question-text'>${attnBottomQ}</p>
                    <input type='range' class='trial-slider' id='attn-slider-bottom' min='0' max='100' step='1' value='50'>
                    <div class='slider-footer'>
                        <span class='slider-label-min'>0 people</span>
                        <span class='slider-value-display' id='attn-val-bottom'>?</span>
                        <span class='slider-label-max'>100 people</span>
                    </div>
                </div>
            </div>
            <div style='text-align:center; margin-top:24px;'>
                <button id='attn-submit-btn' class='jspsych-btn' disabled>Submit</button>
            </div>
        </div>
    `;

    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: html,
        choices: [],
        response_ends_trial: false,
        on_load: function() {
            var sliderTop    = document.getElementById('attn-slider-top');
            var sliderBottom = document.getElementById('attn-slider-bottom');
            var valTop       = document.getElementById('attn-val-top');
            var valBottom    = document.getElementById('attn-val-bottom');
            var submitBtn    = document.getElementById('attn-submit-btn');
            var bottomWrap   = document.getElementById('attn-bottom-wrap');
            var topTouched = false, bottomTouched = false;
            var topPointerDown = false, bottomPointerDown = false;
            var topDragged = false, bottomDragged = false;
            var topRevealed = false;

            function revealBottom() {
                if (!topRevealed) {
                    topRevealed = true;
                    bottomWrap.style.display = '';
                    requestAnimationFrame(function() { bottomWrap.style.opacity = '1'; });
                    updateSliderGradient(sliderBottom);
                }
            }

            updateSliderGradient(sliderTop);

            sliderTop.addEventListener('input', function() {
                updateSliderGradient(sliderTop);
                if (topTouched) valTop.textContent = `${sliderTop.value} people`;
            });
            sliderBottom.addEventListener('input', function() {
                updateSliderGradient(sliderBottom);
                if (bottomTouched) valBottom.textContent = `${sliderBottom.value} people`;
            });

            function touchTop() {
                if (!topTouched) {
                    topTouched = true;
                    valTop.textContent = `${sliderTop.value} people`;
                }
                if (topTouched && bottomTouched) submitBtn.disabled = false;
            }
            function touchBottom() {
                if (!bottomTouched) {
                    bottomTouched = true;
                    valBottom.textContent = `${sliderBottom.value} people`;
                }
                if (topTouched && bottomTouched) submitBtn.disabled = false;
            }

            sliderTop.addEventListener('mousedown', touchTop);
            sliderTop.addEventListener('touchstart', touchTop);
            sliderTop.addEventListener('keydown', touchTop);
            sliderBottom.addEventListener('mousedown', touchBottom);
            sliderBottom.addEventListener('touchstart', touchBottom);
            sliderBottom.addEventListener('keydown', touchBottom);

            sliderTop.addEventListener('pointerdown', function() { topPointerDown = true; });
            sliderTop.addEventListener('pointermove', function() { if (topPointerDown) topDragged = true; });
            sliderBottom.addEventListener('pointerdown', function() { bottomPointerDown = true; });
            sliderBottom.addEventListener('pointermove', function() { if (bottomPointerDown) bottomDragged = true; });
            document.addEventListener('pointerup', function() {
                if (topPointerDown) revealBottom();
                topPointerDown = false;
                bottomPointerDown = false;
            });
            sliderTop.addEventListener('touchend', revealBottom);
            sliderTop.addEventListener('keyup', revealBottom);

            submitBtn.addEventListener('click', function() {
                var topVal    = parseInt(sliderTop.value);
                var bottomVal = parseInt(sliderBottom.value);
                var passed = Math.abs(topVal - N) <= 5 && Math.abs(bottomVal - N) <= 5;

                var checkResult = {
                    checkID:            checkConfig.checkID,
                    targetValue:        N,
                    passed:             passed,
                    topResponse:        topVal,
                    bottomResponse:     bottomVal,
                    topDragged:         topDragged,
                    bottomDragged:      bottomDragged
                };

                var existing = jsPsych.data.dataProperties.attentionChecks;
                var idx = existing.findIndex(c => c.checkID === checkConfig.checkID);
                if (idx >= 0) existing[idx] = checkResult;
                else existing.push(checkResult);

                logToBrowser('attention check', checkResult);
                jsPsych.finishTrial();
            });
        }
    };
}
