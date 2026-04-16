// production protections — only applied when TESTING_MODE = false
function applyProductionProtections() {
    // disable right-click
    document.addEventListener('contextmenu', e => e.preventDefault());

    // block inspect element keyboard shortcuts (F12, Ctrl/Cmd+Shift+I/J/C, Ctrl/Cmd+U)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12') { e.preventDefault(); return; }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && 'ijcIJC'.includes(e.key)) { e.preventDefault(); return; }
        if ((e.ctrlKey || e.metaKey) && 'uU'.includes(e.key)) { e.preventDefault(); return; }
    });

    // disable copy/cut/paste — match stumpers_experiment pattern
    ['copy', 'cut', 'paste'].forEach(evt =>
        document.addEventListener(evt, e => e.preventDefault())
    );

    // fullscreen enforcement — show overlay if participant exits fullscreen
    var overlay = document.createElement('div');
    overlay.id = 'fullscreen-overlay';
    overlay.style.display = 'none';
    overlay.innerHTML = `
        <div class='fullscreen-overlay-box'>
            <p style='font-size:18px; margin-bottom:20px;'>Please return to fullscreen to continue the study.</p>
            <button class='jspsych-btn' onclick="document.documentElement.requestFullscreen()">Return to Fullscreen</button>
        </div>
    `;
    document.body.appendChild(overlay);

    document.addEventListener('fullscreenchange', function() {
        overlay.style.display = document.fullscreenElement ? 'none' : 'flex';
    });
}


// entry point — called from window.onload in index.html
// stimuli: array from STIMULI_DATA.stimuli (loaded as script tag, not fetch — avoids CORS issues locally)
function initStudy(stimuli) {
    logToBrowser('initializing study', null);

    if (!TESTING_MODE) applyProductionProtections();

    // parse Prolific URL params — match priors_study convention
    var urlParams = new URLSearchParams(window.location.search);
    var prolificID = urlParams.get('PROLIFIC_PID');
    var studyID    = urlParams.get('STUDY_ID');
    var sessionID  = urlParams.get('SESSION_ID');
    logToBrowser('PROLIFIC_PID', prolificID);
    logToBrowser('STUDY_ID', studyID);
    logToBrowser('SESSION_ID', sessionID);

    // init jsPsych
    var jsPsych = initJsPsych({
        show_progress_bar: true,
        auto_update_progress_bar: false   // manual updates for main trials only
    });

    // session-level data properties
    jsPsych.data.addProperties({ subjectID: jsPsych.randomization.randomID(10) });
    jsPsych.data.addProperties({ prolificID: prolificID });
    jsPsych.data.addProperties({ studyID: studyID });
    jsPsych.data.addProperties({ sessionID: sessionID });
    jsPsych.data.addProperties({ startTime: Date.now() });
    jsPsych.data.addProperties({ trialResponses: [] });
    jsPsych.data.addProperties({ attentionChecks: [] });

    if (TEST) {
        jsPsych.data.addProperties({ DEBUG: true });
    }
    if (SEED) {
        jsPsych.randomization.setSeed(SEED);
    }

    // --- session-level randomization ---

    // slider order: "AW" (ability top) or "WA" (willingness top), fixed for whole session
    var sliderOrder = jsPsych.randomization.sampleWithoutReplacement(['AW', 'WA'], 1)[0];
    jsPsych.data.addProperties({ sliderOrder: sliderOrder });
    logToBrowser('sliderOrder', sliderOrder);

    // sample 2 attention check words without replacement
    var attnWords = jsPsych.randomization.sampleWithoutReplacement(ATTN_CHECK_POOL, 2);

    // build attention check configs (random sides, random pairing)
    var remainingWords = [...ATTN_CHECK_POOL].filter(w => !attnWords.includes(w));
    var sides = jsPsych.randomization.shuffle(['left', 'right']);
    var attnConfigs = attnWords.map(function(word, i) {
        // pick a random "other" word for the opposite label
        var otherWord = remainingWords[i % remainingWords.length];
        return {
            checkID: `ATTN_${i + 1}`,
            word: word,
            correctSide: sides[i],
            wordOther: otherWord
        };
    });

    // init attn check placeholders (filled in on_finish of each check)
    jsPsych.data.addProperties({ attentionChecks: attnConfigs.map(c => ({ checkID: c.checkID, word: c.word, correctSide: c.correctSide, passed: null, responseValue: null })) });

    // shuffle stimuli
    var shuffledStimuli = jsPsych.randomization.shuffle([...stimuli]);

    // pick 2 distinct insertion positions within the shuffled array (not first, not last)
    var attnPositions = [];
    while (attnPositions.length < N_ATTENTION_CHECKS) {
        var pos = jsPsych.randomization.randomInt(1, shuffledStimuli.length - 1);
        if (!attnPositions.includes(pos)) attnPositions.push(pos);
    }
    attnPositions.sort((a, b) => a - b);

    // build sequence, then splice attn checks in at specified positions
    // pos + i accounts for the index shift caused by each prior insertion
    var trialSequence = shuffledStimuli.map(s => ({ type: 'stimulus', data: s }));
    attnPositions.forEach(function(pos, i) {
        trialSequence.splice(pos + i, 0, { type: 'attn', data: attnConfigs[i] });
    });

    // store trial order for data output
    var trialOrder = trialSequence.map(t => t.type === 'attn' ? t.data.checkID : t.data.itemID);
    jsPsych.data.addProperties({ trialOrder: trialOrder });
    logToBrowser('trialOrder', trialOrder);


    // --- build timeline ---
    var timeline = [];

    // 1. consent page — single button: consent + fullscreen + begin (match stumpers pattern)
    var consentTrial = {
        type: jsPsychHtmlButtonResponse,
        stimulus: getConsentHTML(),
        choices: [],
        response_ends_trial: false,
        on_load: function() {
            document.querySelector('#jspsych-progressbar-container').style.display = 'none';
            document.getElementById('consent-btn').addEventListener('click', function() {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`fullscreen error: ${err.message}`);
                });
                document.querySelector('#jspsych-progressbar-container').style.display = '';
                jsPsych.finishTrial();
            });
        }
    };
    timeline.push(consentTrial);

    // 2. instructions text pages
    var instructionsTrial = {
        type: jsPsychInstructions,
        pages: getInstructionPages(sliderOrder),
        show_clickable_nav: true,
        allow_keys: false,
        allow_backward: true
    };
    timeline.push(instructionsTrial);

    // 3. interactive demo slider trial (separate bc jsPsychInstructions on_load fires once, not per page)
    var demoTrial = {
        type: jsPsychHtmlButtonResponse,
        stimulus: getDemoHTML(sliderOrder),
        choices: [],
        response_ends_trial: false,
        on_load: function() {
            var d1 = document.getElementById('demo-slider-1');
            var d2 = document.getElementById('demo-slider-2');

            updateSliderGradient(d1);
            updateSliderGradient(d2);

            d1.addEventListener('input', function() {
                updateSliderGradient(d1);
                document.getElementById('demo-val-1').textContent = `${d1.value} people`;
            });
            d2.addEventListener('input', function() {
                updateSliderGradient(d2);
                document.getElementById('demo-val-2').textContent = `${d2.value} people`;
            });

            document.getElementById('demo-continue-btn').addEventListener('click', function() {
                jsPsych.finishTrial();
            });
        }
    };
    timeline.push(demoTrial);

    // 4. main trials + attention checks (interleaved)
    var mainTrialCount = 0;
    trialSequence.forEach(function(item) {
        if (item.type === 'stimulus') {
            mainTrialCount++;
            timeline.push(buildMainTrial(item.data, sliderOrder, mainTrialCount, jsPsych));
        } else {
            timeline.push(buildAttentionCheck(item.data, jsPsych));
        }
    });

    // 5. demographics
    var demographicsTrial = {
        type: jsPsychSurveyHtmlForm,
        preamble: "<div class='prevent-select'><p><b>Almost done! Please answer a few questions about yourself.</b></p></div>",
        html: getDemographicsHTML(),
        button_label: 'Continue',
        on_finish: function(data) {
            processDemographics(data, jsPsych);
        }
    };
    timeline.push(demographicsTrial);

    // 6. strategy question
    var strategyTrial = {
        type: jsPsychSurveyHtmlForm,
        preamble: "<div class='prevent-select'><p><b>One more question:</b></p></div>",
        html: getStrategyHTML(),
        button_label: 'Continue',
        on_finish: function(data) {
            processStrategy(data, jsPsych);
        }
    };
    timeline.push(strategyTrial);

    // 7. technical issues + feedback
    var technicalTrial = {
        type: jsPsychSurveyHtmlForm,
        preamble: "<div class='prevent-select'><p><b>Last page:</b></p></div>",
        html: getTechnicalFeedbackHTML(),
        button_label: 'Submit',
        on_finish: function(data) {
            processTechnicalFeedback(data, jsPsych);
        }
    };
    timeline.push(technicalTrial);

    // 8+9. save to DataPipe — both saves are BLOCKING timeline nodes.
    // the completion page (step 10) cannot appear until both saves succeed.
    // wait_message shown to participant during each save so they don't navigate away.
    var saveMsg = "<p style='text-align:center; color:#555;'>Saving your data — please don't close this page...</p>";

    var trialFilename = (TEST ? 'DEBUG_' : '') + `${jsPsych.data.dataProperties.subjectID}_trials.json`;
    var saveTrialData = {
        type: jsPsychPipe,
        action: 'save',
        experiment_id: experimentIdOSF,
        filename: trialFilename,
        data_string: () => formatTrialResponses(jsPsych),
        wait_message: saveMsg
    };
    timeline.push(saveTrialData);

    var surveyFilename = (TEST ? 'DEBUG_' : '') + `${jsPsych.data.dataProperties.subjectID}_survey.json`;
    var saveSurveyData = {
        type: jsPsychPipe,
        action: 'save',
        experiment_id: experimentIdOSF,
        filename: surveyFilename,
        data_string: () => formatSurveyResponses(jsPsych),
        wait_message: saveMsg
    };
    timeline.push(saveSurveyData);

    // 10. completion page + Prolific redirect (button click, not auto)
    var completionTrial = {
        type: jsPsychInstructions,
        pages: [`
            <div class='prevent-select bounding-div'>
                <p style='font-size:20px;'><b>You're all done!</b></p>
                <p>Thank you for participating in our study. Your responses have been saved.</p>
                <p>Click the button below to complete your submission on Prolific.</p>
            </div>
        `],
        show_clickable_nav: true,
        allow_backward: false,
        button_label_next: 'Complete Submission',
        on_finish: function() {
            window.onbeforeunload = null;
            window.open(prolificCompletionURL, '_self');
        }
    };
    timeline.push(completionTrial);

    jsPsych.run(timeline);
}
