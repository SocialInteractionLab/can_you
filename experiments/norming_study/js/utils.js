// match priors_study logToBrowser pattern
function logToBrowser(ctx, variable) {
    if (VERBOSE) {
        if (variable) {
            console.log('\t', ctx, ': ', variable);
        } else {
            console.log(ctx);
        }
    }
}

// format trial data for DataPipe save
function formatTrialResponses(jsPsych) {
    var d = jsPsych.data.dataProperties;
    return JSON.stringify({
        subjectID: d.subjectID,
        prolificID: d.prolificID,
        studyID: d.studyID,
        sessionID: d.sessionID,
        DEBUG: TEST ? 1 : 0,
        sliderOrder: d.sliderOrder,
        trialOrder: d.trialOrder,
        attentionChecks: d.attentionChecks,
        trials: d.trialResponses
    });
}

// format survey data for DataPipe save
function formatSurveyResponses(jsPsych) {
    var d = jsPsych.data.dataProperties;
    return JSON.stringify({
        subjectID: d.subjectID,
        prolificID: d.prolificID,
        DEBUG: TEST ? 1 : 0,
        demographics: d.demographics,
        strategy: d.strategy,
        technicalIssues: d.technicalIssues,
        feedback: d.feedback,
        totalDurationMs: Date.now() - d.startTime
    });
}

// init fill bar gradient for a slider at its current value (called on load + on input)
function updateSliderGradient(slider) {
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(to right, #028090 0%, #028090 ${pct}%, #e0e0e0 ${pct}%, #e0e0e0 100%)`;
}
