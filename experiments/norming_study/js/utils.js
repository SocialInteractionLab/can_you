function logToBrowser(ctx, variable) {
    if (VERBOSE) {
        if (variable) {
            console.log('\t', ctx, ': ', variable);
        } else {
            console.log(ctx);
        }
    }
}

// prolificID when available, else subjectID
function getFilePrefix(jsPsych) {
    var d = jsPsych.data.dataProperties;
    var id = d.prolificID || d.subjectID;
    return (TEST ? 'DEBUG_' : '') + d.sessionTimestamp + '_' + id;
}

// convert array of flat objects to CSV string
function toCSV(rows) {
    if (!rows || rows.length === 0) return '';
    var headers = Object.keys(rows[0]);
    var lines = [headers.join(',')];
    rows.forEach(function(row) {
        var vals = headers.map(function(h) {
            var v = row[h];
            if (v === null || v === undefined) return '';
            var s = String(v);
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                return '"' + s.replace(/"/g, '""') + '"';
            }
            return s;
        });
        lines.push(vals.join(','));
    });
    return lines.join('\n');
}

function getBaseSaveFields(d) {
    return {
        trial_type:  'whyask-trial',
        subjectID:   d.subjectID,
        prolificID:  d.prolificID,
        studyID:     d.studyID,
        sessionID:   d.sessionID,
        DEBUG:       TEST ? 1 : 0,
        sliderOrder: d.sliderOrder
    };
}

function formatFirstHalf(jsPsych) {
    var d = jsPsych.data.dataProperties;
    var trials = d.trialResponses.slice(0, Math.floor(N_TRIALS_PER_PARTICIPANT / 2));
    var rows = trials.map(function(t) {
        return Object.assign(getBaseSaveFields(d), {
            half:        1
        }, t);
    });
    return toCSV(rows);
}

function formatSecondHalf(jsPsych) {
    var d = jsPsych.data.dataProperties;
    var trials = d.trialResponses.slice(Math.floor(N_TRIALS_PER_PARTICIPANT / 2));
    var trialRows = trials.map(function(t) {
        return Object.assign(getBaseSaveFields(d), {
            half:        2,
            targetValue: '',
            passed:      ''
        }, t);
    });
    // append attention check rows
    var attnRows = (d.attentionChecks || []).map(function(c) {
        return Object.assign(getBaseSaveFields(d), {
            half:        'attn',
            trialIndex:  c.checkID,
            itemID:      c.checkID,
            actionPhrase: '',
            abilityResponse:     c.topResponse,
            abilityRT:           '',
            abilityDragged:      c.topDragged,
            willingnessResponse: c.bottomResponse,
            willingnessRT:       '',
            willingnessDragged:  c.bottomDragged,
            trialRT:     '',
            suspicious:  !c.passed,
            targetValue: c.targetValue,
            passed:      c.passed
        });
    });
    return toCSV(trialRows.concat(attnRows));
}

function formatDemographics(jsPsych) {
    var d = jsPsych.data.dataProperties;
    var demo = d.demographics || {};
    var row = Object.assign(getBaseSaveFields(d), {
        half:              'demographics',
        trialIndex:        '',
        itemID:            '',
        actionPhrase:      '',
        abilityResponse:   '',
        abilityRT:         '',
        abilityDragged:    '',
        willingnessResponse: '',
        willingnessRT:     '',
        willingnessDragged: '',
        trialRT:           '',
        suspicious:        '',
        targetValue:       '',
        passed:            '',
        age:               demo.age || '',
        gender:            demo.gender || '',
        race:              (demo.race || []).join(';'),
        education:         demo.education || '',
        strategy:          d.strategy || '',
        technicalIssues:   d.technicalIssues || '',
        feedback:          d.feedback || '',
        visibilityChanges: (d.visibilityChanges || []).length,
        totalDurationMs:   Date.now() - d.startTime
    });
    return toCSV([row]);
}

function updateSliderGradient(slider) {
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.background = `linear-gradient(to right, #028090 0%, #028090 ${pct}%, #e0e0e0 ${pct}%, #e0e0e0 100%)`;
    // position value display under thumb (thumb = 22px wide, so center offset corrects for edge clamping)
    var valEl = slider.parentElement && slider.parentElement.querySelector('.slider-value-display');
    if (valEl) {
        var offset = 11 - (pct / 100) * 22;
        valEl.style.left = `calc(${pct}% + ${offset}px)`;
    }
}
