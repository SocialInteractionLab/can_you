function initStudyWaffle(stimuli) {
    if (checkMobile()) return;

    logToBrowser('initializing waffle study', null);
    if (!TESTING_MODE) applyProductionProtections();

    var urlParams = new URLSearchParams(window.location.search);
    var prolificID = urlParams.get('PROLIFIC_PID');
    var studyID    = urlParams.get('STUDY_ID');
    var sessionID  = urlParams.get('SESSION_ID');

    var jsPsych = initJsPsych({
        show_progress_bar: true,
        auto_update_progress_bar: true
    });

    jsPsych.data.addProperties({ subjectID:  jsPsych.randomization.randomID(10) });
    jsPsych.data.addProperties({ prolificID: prolificID });
    jsPsych.data.addProperties({ studyID:    studyID });
    jsPsych.data.addProperties({ sessionID:  sessionID });
    jsPsych.data.addProperties({ startTime:  Date.now() });
    var _now = new Date();
    var _ts = [_now.getFullYear(), String(_now.getMonth()+1).padStart(2,'0'), String(_now.getDate()).padStart(2,'0')].join('') +
              '_' + [String(_now.getHours()).padStart(2,'0'), String(_now.getMinutes()).padStart(2,'0'), String(_now.getSeconds()).padStart(2,'0')].join('');
    jsPsych.data.addProperties({ sessionTimestamp: _ts });
    jsPsych.data.addProperties({ trialResponses: [] });
    jsPsych.data.addProperties({ attentionChecks: [] });

    if (TEST) jsPsych.data.addProperties({ DEBUG: true });
    if (SEED) jsPsych.randomization.setSeed(SEED);

    // tab visibility
    jsPsych.data.addProperties({ visibilityChanges: [] });
    document.addEventListener('visibilitychange', function() {
        jsPsych.data.dataProperties.visibilityChanges.push({
            hidden:      document.hidden,
            timestamp:   Date.now(),
            msFromStart: Date.now() - jsPsych.data.dataProperties.startTime
        });
    });

    // axis counterbalancing: AW = able on x-axis, WA = willing on x-axis
    var axisOrder = jsPsych.randomization.sampleWithoutReplacement(['AW', 'WA'], 1)[0];
    jsPsych.data.addProperties({ axisOrder: axisOrder });

    // color assignment: randomly permute WAFFLE_COLORS onto the 4 quadrant keys
    var quadKeys       = ['AW', 'ANW', 'NAW', 'NANW'];
    var shuffledColors = jsPsych.randomization.shuffle([...WAFFLE_COLORS]);
    var colorMap = {};
    quadKeys.forEach(function(k, i) { colorMap[k] = shuffledColors[i]; });
    jsPsych.data.addProperties({ colorAssignment: JSON.stringify(colorMap) });

    var shuffledStimuli = jsPsych.randomization.shuffle([...stimuli]).slice(0, N_TRIALS_PER_PARTICIPANT);
    var trialOrder = shuffledStimuli.map(function(s) { return s.itemID; });
    jsPsych.data.addProperties({ trialOrder: trialOrder });

    var saveMsg = "<p style='text-align:center; color:#555; font-family:Helvetica Neue,Arial,sans-serif;'>Saving your data — please don't close this page...</p>";

    function handleSaveResult(data, label) {
        if (data.success) return;
        console.error('DataPipe save failed', label, data.result);
        window.onbeforeunload = null;
        document.body.innerHTML = `
            <div style='font-family:Helvetica Neue,Arial,sans-serif; text-align:center; margin:15vh auto; max-width:720px; color:#333;'>
                <p style='font-size:24px; font-weight:600;'>We couldn't save your data.</p>
                <p style='font-size:16px; color:#666; line-height:1.5;'>
                    The upload to DataPipe was rejected before it reached OSF.
                    Please do not close this page. Open the browser console and send the error message to the research team.
                </p>
                <p style='font-size:15px; color:#888;'>Failed step: ${label}</p>
            </div>`;
        throw new Error('DataPipe save failed: ' + label);
    }

    // ---- trial objects ----

    var consent = {
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

    var _instrNavHandler = null;
    var instructions = {
        type: jsPsychInstructions,
        pages: getInstructionPagesWaffle(axisOrder),
        show_clickable_nav: true,
        allow_keys: false,
        allow_backward: true,
        on_load: function() {
            lockInstructionsNext(5);
            initInstrGrid(axisOrder, colorMap);  // try on first load (page 0 — no-op)
            _instrNavHandler = function(e) {
                if (e.target && e.target.id === 'jspsych-instructions-next'
                 || e.target && e.target.id === 'jspsych-instructions-back') {
                    setTimeout(function() {
                        lockInstructionsNext(5);
                        initInstrGrid(axisOrder, colorMap);  // init if grid page just loaded
                    }, 50);
                }
            };
            document.addEventListener('click', _instrNavHandler);
        },
        on_finish: function() {
            if (_instrNavHandler) {
                document.removeEventListener('click', _instrNavHandler);
                _instrNavHandler = null;
            }
        }
    };

    var demo = buildWaffleDemo(axisOrder, colorMap, jsPsych);

    var readyToStart = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div class='content-box' style='text-align:center;'>
                <p style='font-size:20px; font-weight:600;'>You're all set!</p>
                <p style='font-size:17px; color:#555;'>Click below when you're ready to start the experiment.</p>
            </div>`,
        choices: ['Start Experiment']
    };

    // main trial block with mid-save
    var mainTrialCount = 0;
    var midpoint = Math.floor(N_TRIALS_PER_PARTICIPANT / 2);
    var trialBlock = [];
    shuffledStimuli.forEach(function(stimulus) {
        mainTrialCount++;
        trialBlock.push(buildWaffleTrial(stimulus, axisOrder, colorMap, mainTrialCount, jsPsych));
        if (mainTrialCount === midpoint) {
            trialBlock.push({
                type: jsPsychPipe,
                action: 'save',
                experiment_id: experimentIdOSF,
                filename: getFilePrefix(jsPsych) + '_waffle_1_half.csv',
                data_string: () => formatFirstHalfWaffle(jsPsych),
                wait_message: saveMsg,
                on_finish: function(data) { handleSaveResult(data, 'first half'); }
            });
        }
    });

    var demographics = {
        type: jsPsychSurveyHtmlForm,
        preamble: "",
        html: getDemographicsHTML(),
        button_label: 'Continue',
        on_finish: function(data) { processDemographics(data, jsPsych); }
    };

    var strategy = {
        type: jsPsychSurveyHtmlForm,
        preamble: "",
        html: getStrategyHTML(),
        button_label: 'Continue',
        on_finish: function(data) { processStrategy(data, jsPsych); }
    };

    var technical = {
        type: jsPsychSurveyHtmlForm,
        preamble: "",
        html: getTechnicalFeedbackHTML(),
        button_label: 'Submit',
        on_finish: function(data) { processTechnicalFeedback(data, jsPsych); }
    };

    var save2half = {
        type: jsPsychPipe,
        action: 'save',
        experiment_id: experimentIdOSF,
        filename: getFilePrefix(jsPsych) + '_waffle_2_half.csv',
        data_string: () => formatSecondHalfWaffle(jsPsych),
        wait_message: saveMsg,
        on_finish: function(data) { handleSaveResult(data, 'second half'); }
    };

    var saveDemographics = {
        type: jsPsychPipe,
        action: 'save',
        experiment_id: experimentIdOSF,
        filename: getFilePrefix(jsPsych) + '_waffle_demographics.csv',
        data_string: () => formatDemographicsWaffle(jsPsych),
        wait_message: saveMsg,
        on_finish: function(data) { handleSaveResult(data, 'demographics'); }
    };

    var completion = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <div class='content-box' style='text-align:center;'>
                <p style='font-size:24px; font-weight:600; margin-bottom:8px;'>Thank you so much!</p>
                <p style='font-size:17px;'>Your responses have been saved and will really help our research.
                We're grateful for your time and careful attention.</p>
                <p style='color:#888; font-size:15px; margin-top:24px;'>
                    You'll be redirected to Prolific automatically in a few seconds.<br>
                    If nothing happens, <a href='${prolificCompletionURL}' style='color:#028090;'>click here</a>.
                </p>
            </div>
        `,
        choices: [],
        response_ends_trial: false,
        on_load: function() {
            window.onbeforeunload = null;
            if (prolificCompletionURL) {
                setTimeout(function() { window.location.href = prolificCompletionURL; }, 3000);
            }
        }
    };

    var timeline =
        [consent, instructions, demo, readyToStart]
        .concat(trialBlock)
        .concat([demographics, strategy, technical, save2half, saveDemographics, completion]);

    jsPsych.run(timeline);
}
