// ---- study config ----
const TESTING_MODE = false;      // true = local dev (no protections, no required fields)

const experimentIdOSF       = 'H9cxh2VA14kV';
const prolificCompletionURL = 'https://app.prolific.com/submissions/complete?cc=CEPHL0CF';
const TEST    = false;           // true = prefix saves w/ DEBUG_
const VERBOSE = false;
const SEED    = null;

const N_ITEMS                 = 153;   // total items in stimulus set
const N_TRIALS_PER_PARTICIPANT = 30;   // how many each participant sees
const N_ATTENTION_CHECKS      = 2;
const ESTIMATED_DURATION_MIN  = 15;   // TODO: update after pilot
const PAYMENT                 = 2.50; // TODO: update after pilot ($)

const LAB_NAME      = "Social Interaction Lab";
const PI_NAME       = "Robert Hawkins";
const CONTACT_EMAIL = "mokeeffe@stanford.edu";
const INSTITUTION   = "Stanford University";
const LAB_LOGO      = "🌱";
const STUDY_TITLE   = "Thinking About What People Do";

const IDLE_TIMEOUT_MS  = 5 * 60 * 1000;  // 5 min inactivity → session timeout
const ATTN_TARGET_POOL = [14, 22, 31, 43, 57, 68, 79, 86];  // avoids 50 (default slider pos)

// ---- grid viz config ----
const PALETTE_NAME = 'coastal';
const VIZ_MODE     = 'figures';

const PALETTES = {
    coastal: {
        AW:   '#1F5572',  // deep ocean    — able + willing
        NAW:  '#D69A57',  // dune          — not able, willing
        ANW:  '#5C8FA8',  // shallow water — able, not willing
        NANW: '#A8A096',  // driftwood     — neither
    },
    ink: {
        AW:   '#2A2A2A',
        NAW:  '#8A6A4A',
        ANW:  '#4A6680',
        NANW: '#B5AC9F',
    },
    mineral: {
        AW:   '#506D7A',
        NAW:  '#A88566',
        ANW:  '#7A8B7E',
        NANW: '#B0A89E',
    },
};

// design tokens — mirrored in CSS :root vars
const TOKENS = {
    bg:           '#FBFAF7',
    card:         '#FFFFFF',
    ink:          '#1F1A14',
    muted:        '#6E665C',
    faint:        '#A89E91',
    hairline:     '#E8E2D5',
    accent:       '#1F5572',
    accentBg:     'rgba(31,85,114,0.08)',
    successGreen: '#2E7D5B',
    serif:        "'Source Serif 4', 'Source Serif Pro', Georgia, serif",
    sans:         "'Inter', system-ui, sans-serif",
    mono:         "'JetBrains Mono', monospace",
};

// pill label text per semantic quadrant (fixed regardless of axis order)
function getQuadLabels(axisOrder) {
    return {
        AW:   'able and willing',
        ANW:  'able, not willing',
        NAW:  'willing, not able',
        NANW: 'not able or willing',
    };
}
