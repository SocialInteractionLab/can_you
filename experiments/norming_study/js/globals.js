// TESTING_MODE: true = local dev, false = production (protections + required fields on)
const TESTING_MODE = false;

const experimentIdOSF = 'H9cxh2VA14kV';
const prolificCompletionURL = 'https://app.prolific.com/submissions/complete?cc=CEPHL0CF';
const TEST = false;                // true = prefix saves w/ DEBUG_
const VERBOSE = false;
const SEED = null;

const N_ITEMS = 153;               // total items in stimulus set
const N_TRIALS_PER_PARTICIPANT = 20;  // how many each participant sees (set lower to subsample)
const N_ATTENTION_CHECKS = 2;
const ESTIMATED_DURATION_MIN = 15;  // TODO: UPDATE after pilot!!
const PAYMENT = 2.50;               // TODO: UPDATE after pilot ($)!

const LAB_NAME = "Social Interaction Lab";
const PI_NAME = "Robert Hawkins";
const CONTACT_EMAIL = "mokeeffe@stanford.edu";
const INSTITUTION = "Stanford University";
const LAB_LOGO = "🌱";

const STUDY_TITLE = "Thinking About What People Do";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;  // 5 min inactivity

// pool of attn check targets — avoids 50 (default slider pos)
const ATTN_TARGET_POOL = [14, 22, 31, 43, 57, 68, 79, 86];
