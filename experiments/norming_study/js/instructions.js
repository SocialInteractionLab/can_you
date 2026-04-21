// sliderOrder: "AW" (able on top) or "WA" (willing on top) — bullets match trial order
function getInstructionPages(sliderOrder) {
    var firstDim  = sliderOrder === 'AW' ? 'able'    : 'willing';
    var secondDim = sliderOrder === 'AW' ? 'willing' : 'able';

    // conditional phrasing for slider 2 explanation
    var conditionalClause = sliderOrder === 'AW'
        ? 'Assuming all 100 were able to do it, how many of them would be <em>willing</em> to do it?'
        : 'Assuming all 100 were willing to do it, how many of them would be <em>able</em> to do it?';

    return [
        // page 1 — introduce the task + vignette framing
        `<div class='prevent-select content-box'>
            <p>In this study, you'll see a series of everyday scenarios and a question about each one.</p>
            <p>For each scenario, imagine <b>100 random people</b> are all in that situation.</p>
        </div>`,

        // page 2 — explain the two sliders with conditional framing
        `<div class='prevent-select content-box'>
            <p>For each scenario, you will be asked to answer two questions:</p>
            <p style='margin-top:20px;'>1) How many of the 100 people would be <em>${firstDim}</em> to do it?</p>
            <p style='margin-bottom:20px;'>2) ${conditionalClause}</p>
            <p><b>There are no right or wrong answers</b> — all we're interested in is what you think!</p>
        </div>`,

        // page 3 — clarify that ability and willingness can come apart (order matches condition)
        `<div class='prevent-select content-box'>
            <p>Keep in mind that being <em>${firstDim}</em> and being <em>${secondDim}</em> don't always go together.</p>
            <p>In other words, two answers don't need to match.</p>
        </div>`,

    ];
}

// demo trial HTML — sliderOrder passed so demo matches the real trial layout
function getDemoHTML(sliderOrder) {
    var topDim    = sliderOrder === 'AW' ? 'able'    : 'willing';
    var bottomDim = sliderOrder === 'AW' ? 'willing' : 'able';

    // dimSpan is defined in trials.js — safe to use here since getDemoHTML is called at runtime
    var demoTopQ = `How many of the 100 people would be ${dimSpan(topDim)} to?`;
    var demoBottomQ = sliderOrder === 'AW'
        ? `Assuming all 100 were ${dimSpan('able')} to, how many of them would be ${dimSpan('willing')} to do it?`
        : `Assuming all 100 were ${dimSpan('willing')} to, how many of them would be ${dimSpan('able')} to do it?`;

    return `
        <div class='prevent-select content-box'>
            <p>Here's an example of what each scenario will look like. Try moving the sliders!</p>
            <div class='trial-box' style='margin: 0 auto; box-shadow: none; border: 1px solid #ddd;'>
                <p class='trial-preamble'>Imagine 100 random people are given the following situation:</p>
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
                    <div class='slider-question' id='demo-bottom-wrap' style='display:none; opacity:0; transition:opacity 0.25s ease;'>
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
                <button id='demo-continue-btn' class='jspsych-btn'>Continue</button>
            </div>
        </div>
    `;
}
