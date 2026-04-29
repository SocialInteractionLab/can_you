function getBaseSaveFieldsWaffle(d) {
    return {
        trial_type:      'whyask-waffle-trial',
        subjectID:       d.subjectID,
        prolificID:      d.prolificID,
        studyID:         d.studyID,
        sessionID:       d.sessionID,
        DEBUG:           TEST ? 1 : 0,
        axisOrder:       d.axisOrder,
        colorAssignment: d.colorAssignment,
        showFigures:     SHOW_FIGURES ? 1 : 0
    };
}

function formatFirstHalfWaffle(jsPsych) {
    var d = jsPsych.data.dataProperties;
    var trials = d.trialResponses.slice(0, Math.floor(N_TRIALS_PER_PARTICIPANT / 2));
    return toCSV(trials.map(function(t) {
        return Object.assign(getBaseSaveFieldsWaffle(d), { half: 1 }, t);
    }));
}

function formatSecondHalfWaffle(jsPsych) {
    var d = jsPsych.data.dataProperties;
    var trials = d.trialResponses.slice(Math.floor(N_TRIALS_PER_PARTICIPANT / 2));
    return toCSV(trials.map(function(t) {
        return Object.assign(getBaseSaveFieldsWaffle(d), { half: 2 }, t);
    }));
}

// reuse formatDemographics from utils.js — same fields, just different base
function formatDemographicsWaffle(jsPsych) {
    var d = jsPsych.data.dataProperties;
    var demo = d.demographics || {};
    var row = Object.assign(getBaseSaveFieldsWaffle(d), {
        half:            'demographics',
        trialIndex:      '',
        itemID:          '',
        actionPhrase:    '',
        trialRT:         '',
        suspicious:      '',
        age:             demo.age || '',
        gender:          demo.gender || '',
        race:            (demo.race || []).join(';'),
        education:       demo.education || '',
        strategy:        d.strategy || '',
        technicalIssues: d.technicalIssues || '',
        feedback:        d.feedback || '',
        visibilityChanges: (d.visibilityChanges || []).length,
        totalDurationMs: Date.now() - d.startTime
    });
    return toCSV([row]);
}
