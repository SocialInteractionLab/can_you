// build main two-slider trial for one stimulus
// sliderOrder: "AW" (ability top) or "WA" (willingness top)
// mainTrialIndex: 1-indexed count of main trials (for progress bar)
function buildMainTrial(stimulus, sliderOrder, mainTrialIndex, jsPsych) {
    // top/bottom dimension labels — italicized bc they're the key distinction between sliders
    var topDim    = sliderOrder === 'AW' ? 'able'     : 'willing';
    var bottomDim = sliderOrder === 'AW' ? 'willing'  : 'able';

    // action phrase italicized — the part that changes trial-to-trial
    var phrase = `<em>${stimulus.actionPhrase}</em>`;

    var trialHTML = `
        <div class='prevent-select trial-box'>
            <p class='trial-preamble'>We asked 100 people:</p>
            <p class='trial-question'><em><b>"Can you ${stimulus.actionPhrase}?"</b></em></p>
            <div class='slider-section'>
                <div class='slider-question'>
                    <p class='question-text'>How many of the 100 people said that they were <em>${topDim}</em> to?</p>
                    <input type='range' class='trial-slider' id='slider-top' min='0' max='100' step='1' value='50'>
                    <div class='slider-footer'>
                        <span class='slider-label-min'>0 people</span>
                        <span class='slider-value-display' id='val-top'>50 people</span>
                        <span class='slider-label-max'>100 people</span>
                    </div>
                </div>
                <div class='slider-question'>
                    <p class='question-text'>How many of the 100 people said that they were <em>${bottomDim}</em> to?</p>
                    <input type='range' class='trial-slider' id='slider-bottom' min='0' max='100' step='1' value='50'>
                    <div class='slider-footer'>
                        <span class='slider-label-min'>0 people</span>
                        <span class='slider-value-display' id='val-bottom'>50 people</span>
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
        choices: [],                // no default buttons — we make our own
        response_ends_trial: false,
        on_load: function() {
            var trialStart = performance.now();
            var topRT = null;
            var bottomRT = null;
            var topTouched = false;
            var bottomTouched = false;

            var sliderTop    = document.getElementById('slider-top');
            var sliderBottom = document.getElementById('slider-bottom');
            var valTop       = document.getElementById('val-top');
            var valBottom    = document.getElementById('val-bottom');
            var submitBtn    = document.getElementById('trial-submit-btn');

            // init fill bars at 50%
            updateSliderGradient(sliderTop);
            updateSliderGradient(sliderBottom);

            // update fill + value display on drag
            sliderTop.addEventListener('input', function() {
                updateSliderGradient(sliderTop);
                valTop.textContent = `${sliderTop.value} people`;
            });
            sliderBottom.addEventListener('input', function() {
                updateSliderGradient(sliderBottom);
                valBottom.textContent = `${sliderBottom.value} people`;
            });

            // track first touch via mousedown/touchstart/keydown
            // mousedown used (not input) so leaving slider at 50 still counts as touched
            function touchTop() {
                if (!topTouched) {
                    topTouched = true;
                    topRT = Math.round(performance.now() - trialStart);
                    logToBrowser('top slider touched, RT', topRT);
                }
                if (topTouched && bottomTouched) submitBtn.disabled = false;
            }
            function touchBottom() {
                if (!bottomTouched) {
                    bottomTouched = true;
                    bottomRT = Math.round(performance.now() - trialStart);
                    logToBrowser('bottom slider touched, RT', bottomRT);
                }
                if (topTouched && bottomTouched) submitBtn.disabled = false;
            }

            sliderTop.addEventListener('mousedown', touchTop);
            sliderTop.addEventListener('touchstart', touchTop);
            sliderTop.addEventListener('keydown', touchTop);       // keyboard nav (arrow keys)
            sliderBottom.addEventListener('mousedown', touchBottom);
            sliderBottom.addEventListener('touchstart', touchBottom);
            sliderBottom.addEventListener('keydown', touchBottom); // keyboard nav

            submitBtn.addEventListener('click', function() {
                var totalRT = Math.round(performance.now() - trialStart);
                var topVal    = parseInt(sliderTop.value);
                var bottomVal = parseInt(sliderBottom.value);

                // map top/bottom back to ability/willingness regardless of display order
                var abilityResponse, abilityRT, willingnessResponse, willingnessRT;
                if (sliderOrder === 'AW') {
                    abilityResponse    = topVal;    abilityRT    = topRT;
                    willingnessResponse = bottomVal; willingnessRT = bottomRT;
                } else {
                    willingnessResponse = topVal;   willingnessRT = topRT;
                    abilityResponse    = bottomVal; abilityRT    = bottomRT;
                }

                var trialData = {
                    itemID:              stimulus.itemID,
                    actionPhrase:        stimulus.actionPhrase,
                    abilityResponse:     abilityResponse,
                    abilityRT:           abilityRT,
                    willingnessResponse: willingnessResponse,
                    willingnessRT:       willingnessRT,
                    trialRT:             totalRT,
                    trialIndex:          mainTrialIndex
                };

                jsPsych.data.dataProperties.trialResponses.push(trialData);

                // update progress bar — main trials only (attention checks don't count)
                jsPsych.progressBar.progress = mainTrialIndex / N_ITEMS;

                logToBrowser('trial response', trialData);
                jsPsych.finishTrial();
            });
        }
    };
}


// build attention check trial
// checkConfig: { checkID, word, correctSide ('left'|'right'), wordOther }
function buildAttentionCheck(checkConfig, jsPsych) {
    var minLabel = checkConfig.correctSide === 'left'  ? checkConfig.word : checkConfig.wordOther;
    var maxLabel = checkConfig.correctSide === 'right' ? checkConfig.word : checkConfig.wordOther;

    var html = `
        <div class='prevent-select trial-box'>
            <div class='slider-question'>
                    <p class='question-text'>Please drag the slider all the way to the end labeled <b>${checkConfig.word}</b>.</p>
                    <input type='range' class='trial-slider' id='attn-slider' min='0' max='100' step='1' value='50'>
                    <div class='slider-footer'>
                        <span class='slider-label-min'>${minLabel}</span>
                        <span class='slider-value-display' id='attn-val'>50</span>
                        <span class='slider-label-max'>${maxLabel}</span>
                    </div>
                </div>
            <div style='text-align:center; margin-top:20px;'>
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
            var slider    = document.getElementById('attn-slider');
            var valDisplay = document.getElementById('attn-val');
            var submitBtn  = document.getElementById('attn-submit-btn');
            var touched    = false;

            updateSliderGradient(slider);

            slider.addEventListener('input', function() {
                updateSliderGradient(slider);
                valDisplay.textContent = slider.value;
            });

            function onTouch() {
                if (!touched) {
                    touched = true;
                    submitBtn.disabled = false;
                }
            }
            slider.addEventListener('mousedown', onTouch);
            slider.addEventListener('touchstart', onTouch);
            slider.addEventListener('keydown', onTouch);

            submitBtn.addEventListener('click', function() {
                var responseValue = parseInt(slider.value);
                // pass = moved to correct side (within 10 of edge)
                var passed = checkConfig.correctSide === 'left'
                    ? responseValue <= 10
                    : responseValue >= 90;

                var checkResult = {
                    checkID:       checkConfig.checkID,
                    word:          checkConfig.word,
                    correctSide:   checkConfig.correctSide,
                    passed:        passed,
                    responseValue: responseValue
                };

                // update placeholder in shared data
                var existing = jsPsych.data.dataProperties.attentionChecks;
                var idx = existing.findIndex(c => c.checkID === checkConfig.checkID);
                if (idx >= 0) existing[idx] = checkResult;
                else existing.push(checkResult);

                logToBrowser('attention check result', checkResult);
                jsPsych.finishTrial();
            });
        }
    };
}
