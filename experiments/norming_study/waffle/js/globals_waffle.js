// developer toggle: true = person figures, false = colored square regions
const SHOW_FIGURES = false;

// 4 quadrant colors — edit to change the palette
// assignment to quadrants is randomized per participant (see main_waffle.js)
const WAFFLE_COLORS = ['#0077BB', '#009988', '#EE7733', '#CC3311'];

// pill label text per semantic quadrant — x-axis dimension listed first
function getQuadLabels(axisOrder) {
    if (axisOrder === 'AW') {
        return {
            AW:   'able + willing',
            ANW:  'able, not willing',
            NAW:  'not able, willing',
            NANW: 'not able or willing'
        };
    } else {  // WA: x=willing, y=able
        return {
            AW:   'willing + able',
            ANW:  'not willing, able',
            NAW:  'willing, not able',
            NANW: 'not willing or able'
        };
    }
}
