function logToBrowser(ctx, variable) {
    if (VERBOSE) {
        if (variable) {
            console.log('\t', ctx, ': ', variable);
        } else {
            console.log(ctx);
        }
    }
}

// prolificID when available, else subjectID; timestamp generated once at session start
function getFilePrefix(jsPsych) {
    var d = jsPsych.data.dataProperties;
    var id = d.prolificID || d.subjectID;
    return (TEST ? 'DEBUG_' : '') + d.sessionTimestamp + '_' + id;
}

function formatFirstHalf(jsPsych) {
    var d = jsPsych.data.dataProperties;
    return JSON.stringify({
        subjectID:    d.subjectID,
        prolificID:   d.prolificID,
        studyID:      d.studyID,
        sessionID:    d.sessionID,
        DEBUG:        TEST ? 1 : 0,
        sliderOrder:  d.sliderOrder,
        half:         1,
        trials:       d.trialResponses.slice(0, Math.floor(N_TRIALS_PER_PARTICIPANT / 2))
    });
}

function formatSecondHalf(jsPsych) {
    var d = jsPsych.data.dataProperties;
    return JSON.stringify({
        subjectID:       d.subjectID,
        prolificID:      d.prolificID,
        studyID:         d.studyID,
        sessionID:       d.sessionID,
        DEBUG:           TEST ? 1 : 0,
        sliderOrder:     d.sliderOrder,
        trialOrder:      d.trialOrder,
        attentionChecks: d.attentionChecks,
        half:            2,
        trials:          d.trialResponses.slice(Math.floor(N_TRIALS_PER_PARTICIPANT / 2))
    });
}

function formatDemographics(jsPsych) {
    var d = jsPsych.data.dataProperties;
    return JSON.stringify({
        subjectID:         d.subjectID,
        prolificID:        d.prolificID,
        DEBUG:             TEST ? 1 : 0,
        demographics:      d.demographics,
        strategy:          d.strategy,
        technicalIssues:   d.technicalIssues,
        feedback:          d.feedback,
        visibilityChanges: d.visibilityChanges,
        totalDurationMs:   Date.now() - d.startTime
    });
}

function updateSliderGradient(slider) {
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(to right, #028090 0%, #028090 ${pct}%, #e0e0e0 ${pct}%, #e0e0e0 100%)`;
}
