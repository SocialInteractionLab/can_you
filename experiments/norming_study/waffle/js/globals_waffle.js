// developer toggle: true = person figures, false = colored square regions
const SHOW_FIGURES = false;

// 4 quadrant colors — edit to change the palette
// assignment to quadrants is randomized per participant (see main_waffle.js)
const WAFFLE_COLORS = ['#0077BB', '#009988', '#EE7733', '#CC3311'];

// pill label text per semantic quadrant
function getQuadLabels(axisOrder) {
    if (axisOrder === 'AW') {
        return {
            AW:   'are able and willing',
            ANW:  'are able, but not willing',
            NAW:  'are willing, but not able',
            NANW: 'are not able or willing'
        };
    } else {  // WA: x=willing, y=able
        return {
            AW:   'are willing and able',
            ANW:  'are able, but not willing',
            NAW:  'are willing, but not able',
            NANW: 'are not able or willing'
        };
    }
}
