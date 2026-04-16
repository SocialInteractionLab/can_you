// hover tooltips for able/willing
var DIM_TIPS = {
    able:    'Could they physically do it?',
    willing: 'Would they agree to do it?'
};

function dimSpan(dim) {
    return `<em class='dim-tooltip' data-tip='${DIM_TIPS[dim]}'>${dim}</em>`;
}


function buildMainTrial(stimulus, sliderOrder, mainTrialIndex, jsPsych) {
    var topDim    = sliderOrder === 'AW' ? 'able'    : 'willing';
    var bottomDim = sliderOrder === 'AW' ? 'willing' : 'able';

    var trialHTML = `
        <div class='prevent-select trial-box'>
            <div class='item-counter'>${mainTrialIndex} / ${N_TRIALS_PER_PARTICIPANT}</div>
            <p class='trial-preamble'>We asked 100 people:</p>
            <p class='trial-question'><em><b>"Can you ${stimulus.actionPhrase}?"</b></em></p>
            <div class='slider-section'>
                <div class='slider-question'>
                    <p class='question-text'>How many of the 100 people said that they were ${dimSpan(topDim)} to?</p>
                    <input type='range' class='trial-slider' id='slider-top' min='0' max='100' step='1' value='50'>
                    <div class='slider-footer'>
                        <span class='slider-label-min'>0 people</span>
                        <span class='slider-value-display' id='val-top'>?</span>
                        <span class='slider-label-max'>100 people</span>
                    </div>
                </div>
                <div class='slider-question'>
                    <p class='question-text'>How many of the 100 people said that they were ${dimSpan(bottomDim)} to?</p>
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

            var sliderTop    = document.getElementById('slider-top');
            var sliderBottom = document.getElementById('slider-bottom');
            var valTop       = document.getElementById('val-top');
            var valBottom    = document.getElementById('val-bottom');
            var submitBtn    = document.getElementById('trial-submit-btn');

            updateSliderGradient(sliderTop);
            updateSliderGradient(sliderBottom);

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
                topPointerDown = false;
                bottomPointerDown = false;
            });

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


function buildAttentionCheck(checkConfig, jsPsych) {
    var N = checkConfig.targetValue;

    var html = `
        <div class='prevent-select trial-box'>
            <p class='trial-preamble'>Quick check</p>
            <p class='trial-question'><em><b>For this one only, please move the slider to exactly ${N} people.</b></em></p>
            <div class='slider-section'>
                <div class='slider-question'>
                    <input type='range' class='trial-slider' id='attn-slider' min='0' max='100' step='1' value='50'>
                    <div class='slider-footer'>
                        <span class='slider-label-min'>0 people</span>
                        <span class='slider-value-display' id='attn-val'>?</span>
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
            var slider      = document.getElementById('attn-slider');
            var valDisplay  = document.getElementById('attn-val');
            var submitBtn   = document.getElementById('attn-submit-btn');
            var touched     = false;
            var pointerDown = false;
            var dragged     = false;

            updateSliderGradient(slider);

            slider.addEventListener('input', function() {
                updateSliderGradient(slider);
                if (touched) valDisplay.textContent = `${slider.value} people`;
            });

            function onTouch() {
                if (!touched) {
                    touched = true;
                    submitBtn.disabled = false;
                    valDisplay.textContent = `${slider.value} people`;
                }
            }
            slider.addEventListener('mousedown', onTouch);
            slider.addEventListener('touchstart', onTouch);
            slider.addEventListener('keydown', onTouch);

            slider.addEventListener('pointerdown', function() { pointerDown = true; });
            slider.addEventListener('pointermove', function() { if (pointerDown) dragged = true; });
            document.addEventListener('pointerup', function() { pointerDown = false; });

            submitBtn.addEventListener('click', function() {
                var responseValue = parseInt(slider.value);
                var passed = Math.abs(responseValue - N) <= 5;

                var checkResult = {
                    checkID:       checkConfig.checkID,
                    targetValue:   N,
                    passed:        passed,
                    responseValue: responseValue,
                    dragged:       dragged
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
