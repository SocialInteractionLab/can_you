// sliderOrder: "AW" (able on top) or "WA" (willing on top) — bullets match trial order
function getInstructionPages(sliderOrder) {
    var firstDim  = sliderOrder === 'AW' ? 'able'    : 'willing';
    var secondDim = sliderOrder === 'AW' ? 'willing' : 'able';

    // conditional phrasing for slider 2 explanation
    var conditionalClause = sliderOrder === 'AW'
        ? 'assuming all 100 <em>were</em> able to, how many of the 100 would be willing to?'
        : 'assuming all 100 <em>were</em> willing to, how many of the 100 would be able to?';

    return [
        // page 1 — introduce the task + vignette framing
        `<div class='prevent-select content-box'>
            <p>In this study, you'll see a series of short everyday scenarios and a question about each one. For example:</p>
            <p style='font-style:italic; font-weight:700; font-size:22px; color:#222; margin: 4px 0 2px;'>You're hanging out with a group of friends. Someone pulls out a scrambled Rubik's cube and passes it around. Eventually they hand it to you and say:</p>
            <p style='font-size:22px; color:#222; margin: 2px 0 12px;'><em><b>"Can you solve the Rubik's cube?"</b></em></p>
            <p>For each one, imagine <b>100 random people</b> are all in that situation — people with all kinds of different backgrounds, skills, and personalities. Your job is to estimate how many of them would be able to do what's being asked — and how many would be willing to.</p>
            <p>The scenario may include details about who's asking or why — that's just to help set the scene. The 100 people you're imagining are always just random people from the general public, not any particular type of person.</p>
        </div>`,

        // page 2 — explain the two sliders with conditional framing
        `<div class='prevent-select content-box'>
            <p>For each question, you will use two sliders:</p>
            <p style='margin-top:20px;'>1) How many of the 100 people would be <em>${firstDim}</em> to?</p>
            <p style='margin-bottom:20px;'>2) And ${conditionalClause}</p>
            <p><b>There are no right or wrong answers</b> — all we're interested in is what you think!</p>
        </div>`
    ];
}

// demo trial HTML — sliderOrder passed so demo matches the real trial layout
function getDemoHTML(sliderOrder) {
    var topDim    = sliderOrder === 'AW' ? 'able'    : 'willing';
    var bottomDim = sliderOrder === 'AW' ? 'willing' : 'able';

    // dimSpan is defined in trials.js — safe to use here since getDemoHTML is called at runtime
    var demoTopQ = `How many of the 100 people would be ${dimSpan(topDim)} to?`;
    var demoBottomQ = sliderOrder === 'AW'
        ? `Assuming all 100 were ${dimSpan('able')} to, how many of the 100 would be ${dimSpan('willing')} to?`
        : `Assuming all 100 were ${dimSpan('willing')} to, how many of the 100 would be ${dimSpan('able')} to?`;

    return `
        <div class='prevent-select content-box'>
            <p>Here's an example of what each trial will look like. Try moving the sliders!</p>
            <div class='trial-box' style='margin: 0 auto; box-shadow: none; border: 1px solid #ddd;'>
                <p class='trial-preamble'>We asked 100 people to imagine the following situation:</p>
                <p class='trial-vignette'>You're hanging out with a group of friends. Someone pulls out a scrambled Rubik's cube and passes it around. Eventually they hand it to you and say:</p>
                <p class='trial-question'><em><b>"Can you solve the Rubik's cube?"</b></em></p>
                <div class='slider-section'>
                    <div class='slider-question'>
                        <p class='question-text'>${demoTopQ}</p>
                        <input type='range' class='demo-slider' id='demo-slider-1' min='0' max='100' step='1' value='50'>
                        <div class='slider-footer'>
                            <span class='slider-label-min'>0 people</span>
                            <span class='slider-value-display' id='demo-val-1'>?</span>
                            <span class='slider-label-max'>100 people</span>
                        </div>
                    </div>
                    <div class='slider-question'>
                        <p class='question-text'>${demoBottomQ}</p>
                        <input type='range' class='demo-slider' id='demo-slider-2' min='0' max='100' step='1' value='50'>
                        <div class='slider-footer'>
                            <span class='slider-label-min'>0 people</span>
                            <span class='slider-value-display' id='demo-val-2'>?</span>
                            <span class='slider-label-max'>100 people</span>
                        </div>
                    </div>
                </div>
            </div>
            <div style='text-align:center; margin-top:20px;'>
                <button id='demo-continue-btn' class='jspsych-btn'>Start Experiment</button>
            </div>
        </div>
    `;
}
