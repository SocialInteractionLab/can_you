// instruction pages (text only) — passed to jsPsychInstructions
// sliderOrder: "AW" (able on top) or "WA" (willing on top) — bullets match trial order
function getInstructionPages(sliderOrder) {
    var firstDim  = sliderOrder === 'AW' ? 'able'    : 'willing';
    var secondDim = sliderOrder === 'AW' ? 'willing' : 'able';

    return [
        // page 1
        `<div class='prevent-select content-box'>
            <p>In this study, we'll show you a series of everyday requests — things like <em>"Can you make a sandwich?"</em> or <em>"Can you drive me to the airport?"</em></p>
            <p>For each question, imagine we asked 100 random people from the general population</p>
            <p>Your job will be to estimate how those 100 people would respond</p>
        </div>`,

        // page 2
        `<div class='prevent-select content-box'>
            <p>For each question, you will be asked to rate two things:</p>
            <ul style='text-align:left; max-width:600px; margin:auto;'>
                <li style='margin-bottom:10px;'>
                    <b>How many of the 100 people said they were <em>${firstDim}</em> to?</b>
                </li>
                <li style='margin-bottom:10px;'>
                    <b>How many of the 100 people said they were <em>${secondDim}</em> to?</b>
                </li>
            </ul>
            <p><strong>There are no right or wrong answers</strong> — all we are interested in is what you think!</p>
        </div>`
    ];
}

// demo trial HTML — sliderOrder passed so demo matches the real trial layout
function getDemoHTML(sliderOrder) {
    var topDim    = sliderOrder === 'AW' ? 'able'    : 'willing';
    var bottomDim = sliderOrder === 'AW' ? 'willing' : 'able';

    return `
        <div class='prevent-select content-box'>
            <p>Here's an example of what each trial will look like. Try moving the sliders!</p>
            <div class='trial-box' style='margin: 0 auto; box-shadow: none; border: 1px solid #ddd;'>
                <p class='trial-preamble'>We asked 100 people:</p>
                <p class='trial-question'><em><b>"Can you make a sandwich?"</b></em></p>
                <div class='slider-section'>
                    <div class='slider-question'>
                        <p class='question-text'>How many of the 100 people said that they were <em>${topDim}</em> to?</p>
                        <input type='range' class='demo-slider' id='demo-slider-1' min='0' max='100' step='1' value='50'>
                        <div class='slider-footer'>
                            <span class='slider-label-min'>0 people</span>
                            <span class='slider-value-display' id='demo-val-1'>50 people</span>
                            <span class='slider-label-max'>100 people</span>
                        </div>
                    </div>
                    <div class='slider-question'>
                        <p class='question-text'>How many of the 100 people said that they were <em>${bottomDim}</em> to?</p>
                        <input type='range' class='demo-slider' id='demo-slider-2' min='0' max='100' step='1' value='50'>
                        <div class='slider-footer'>
                            <span class='slider-label-min'>0 people</span>
                            <span class='slider-value-display' id='demo-val-2'>50 people</span>
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
