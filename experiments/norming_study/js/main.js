function applyProductionProtections() {
    document.addEventListener('contextmenu', e => e.preventDefault());

    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12') { e.preventDefault(); return; }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && 'ijcIJC'.includes(e.key)) { e.preventDefault(); return; }
        if ((e.ctrlKey || e.metaKey) && 'uU'.includes(e.key)) { e.preventDefault(); return; }
    });

    ['copy', 'cut', 'paste'].forEach(evt =>
        document.addEventListener(evt, e => e.preventDefault())
    );

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

    var lastActivity = Date.now();
    ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'].forEach(evt =>
        document.addEventListener(evt, function() { lastActivity = Date.now(); }, { passive: true })
    );
    setInterval(function() {
        if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) {
            window.onbeforeunload = null;
            document.body.innerHTML = `
                <div style='font-family:Helvetica Neue,Arial,sans-serif; text-align:center; margin-top:15vh; color:#333;'>
                    <p style='font-size:22px; font-weight:600;'>Your session has timed out.</p>
                    <p style='font-size:16px; color:#666;'>You were inactive for more than 5 minutes.<br>
                    Please return this study on Prolific.</p>
                </div>`;
        }
    }, 30000);
}


function checkMobile() {
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth < 768;
    if (isMobile) {
        document.body.style.fontFamily = 'Helvetica Neue, Arial, sans-serif';
        document.body.innerHTML = `
            <div style='max-width:500px; margin:15vh auto; text-align:center; padding:32px; background:white;
                        border-radius:10px; box-shadow:0 4px 16px rgba(0,0,0,0.1);'>
                <p style='font-size:20px; font-weight:600; color:#333;'>Desktop required</p>
                <p style='font-size:16px; color:#666;'>This study must be completed on a desktop or laptop computer.
                Please return this study on Prolific and complete it on a desktop device.</p>
            </div>`;
        window.onbeforeunload = null;
        return true;
    }
    return false;
}


// greys out next button w/ countdown — re-call on each page nav
function lockInstructionsNext(secs) {
    var btn = document.getElementById('jspsych-instructions-next');
    if (!btn) return;
    btn.disabled = true;
    var remaining = secs;
    btn.textContent = `Next (${remaining}s)`;
    var timer = setInterval(function() {
        remaining--;
        if (remaining > 0) {
            btn.textContent = `Next (${remaining}s)`;
        } else {
            clearInterval(timer);
            btn.disabled = false;
            btn.textContent = 'Next';
        }
    }, 1000);
}


function initStudy(stimuli) {
    if (checkMobile()) return;

    logToBrowser('initializing study', null);
    if (!TESTING_MODE) applyProductionProtections();

    var urlParams = new URLSearchParams(window.location.search);
    var prolificID = urlParams.get('PROLIFIC_PID');
    var studyID    = urlParams.get('STUDY_ID');
    var sessionID  = urlParams.get('SESSION_ID');

    var jsPsych = initJsPsych({
        show_progress_bar: true,
        auto_update_progress_bar: false
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

    // tab visibility — logged w/ timestamp on each hide/show
    jsPsych.data.addProperties({ visibilityChanges: [] });
    document.addEventListener('visibilitychange', function() {
        jsPsych.data.dataProperties.visibilityChanges.push({
            hidden:      document.hidden,
            timestamp:   Date.now(),
            msFromStart: Date.now() - jsPsych.data.dataProperties.startTime
        });
    });

    // randomization
    var sliderOrder = jsPsych.randomization.sampleWithoutReplacement(['AW', 'WA'], 1)[0];
    jsPsych.data.addProperties({ sliderOrder: sliderOrder });

    var attnTargets = jsPsych.randomization.sampleWithoutReplacement(ATTN_TARGET_POOL, 2);
    var attnConfigs = attnTargets.map(function(target, i) {
        return { checkID: `ATTN_${i + 1}`, targetValue: target };
    });
    jsPsych.data.addProperties({ attentionChecks: attnConfigs.map(c => ({
        checkID: c.checkID, targetValue: c.targetValue, passed: null, responseValue: null
    }))});

    var shuffledStimuli = jsPsych.randomization.shuffle([...stimuli]).slice(0, N_TRIALS_PER_PARTICIPANT);

    // var attnPositions = [];
    // while (attnPositions.length < N_ATTENTION_CHECKS) {
    //     var pos = jsPsych.randomization.randomInt(1, shuffledStimuli.length - 1);
    //     if (!attnPositions.includes(pos)) attnPositions.push(pos);
    // }
    // attnPositions.sort((a, b) => a - b);

    var trialSequence = shuffledStimuli.map(s => ({ type: 'stimulus', data: s }));
    // attnPositions.forEach(function(pos, i) {
    //     // pos + i accounts for index shift from prior insertions
    //     trialSequence.splice(pos + i, 0, { type: 'attn', data: attnConfigs[i] });
    // });

    var trialOrder = trialSequence.map(t => t.type === 'attn' ? t.data.checkID : t.data.itemID);
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

    // --- trial objects ---

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

    var instructions = {
        type: jsPsychInstructions,
        pages: getInstructionPages(sliderOrder),
        show_clickable_nav: true,
        allow_keys: false,
        allow_backward: true,
        on_load: function() {
            lockInstructionsNext(8);
            var btn = document.getElementById('jspsych-instructions-next');
            if (btn) btn.addEventListener('click', function() {
                setTimeout(function() { lockInstructionsNext(8); }, 50);
            });
        }
    };

    var demo = {
        type: jsPsychHtmlButtonResponse,
        stimulus: getDemoHTML(sliderOrder),
        choices: [],
        response_ends_trial: false,
        on_load: function() {
            var d1 = document.getElementById('demo-slider-1');
            var d2 = document.getElementById('demo-slider-2');
            var d1touched = false, d2touched = false;
            updateSliderGradient(d1);
            updateSliderGradient(d2);
            d1.addEventListener('mousedown', function() { d1touched = true; });
            d1.addEventListener('touchstart', function() { d1touched = true; });
            d1.addEventListener('keydown',    function() { d1touched = true; });
            d2.addEventListener('mousedown', function() { d2touched = true; });
            d2.addEventListener('touchstart', function() { d2touched = true; });
            d2.addEventListener('keydown',    function() { d2touched = true; });
            d1.addEventListener('input', function() {
                updateSliderGradient(d1);
                if (d1touched) document.getElementById('demo-val-1').textContent = `${d1.value} people`;
            });
            d2.addEventListener('input', function() {
                updateSliderGradient(d2);
                if (d2touched) document.getElementById('demo-val-2').textContent = `${d2.value} people`;
            });
            document.getElementById('demo-continue-btn').addEventListener('click', function() {
                jsPsych.finishTrial();
            });
        }
    };

    // main trials + attn checks + mid-save — built as array so they can stay in one block
    var mainTrialCount = 0;
    var midpoint = Math.floor(N_TRIALS_PER_PARTICIPANT / 2);
    var trialBlock = [];
    trialSequence.forEach(function(item) {
        if (item.type === 'stimulus') {
            mainTrialCount++;
            trialBlock.push(buildMainTrial(item.data, sliderOrder, mainTrialCount, jsPsych));
            if (mainTrialCount === midpoint) {
                trialBlock.push({
                    type: jsPsychPipe,
                    action: 'save',
                    experiment_id: experimentIdOSF,
                    filename: getFilePrefix(jsPsych) + '_1_half.csv',
                    data_string: () => formatFirstHalf(jsPsych),
                    wait_message: saveMsg,
                    on_finish: function(data) { handleSaveResult(data, 'first half'); }
                });
            }
        }
        // else {
        //     trialBlock.push(buildAttentionCheck(item.data, sliderOrder, jsPsych));
        // }
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
        filename: getFilePrefix(jsPsych) + '_2_half.csv',
        data_string: () => formatSecondHalf(jsPsych),
        wait_message: saveMsg,
        on_finish: function(data) { handleSaveResult(data, 'second half'); }
    };

    var saveDemographics = {
        type: jsPsychPipe,
        action: 'save',
        experiment_id: experimentIdOSF,
        filename: getFilePrefix(jsPsych) + '_demographics.csv',
        data_string: () => formatDemographics(jsPsych),
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
                setTimeout(function() {
                    window.location.href = prolificCompletionURL;
                }, 3000);
            }
        }
    };

    // --- timeline (reorder vars here to change order) ---
    var timeline = 
        [consent, instructions, demo]
        .concat(trialBlock)
        .concat([demographics, strategy, technical, save2half, saveDemographics, completion]);

    jsPsych.run(timeline);
}
