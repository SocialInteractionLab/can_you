// TESTING_MODE: true = local dev, false = production (protections + required fields on)
const TESTING_MODE = false;

const experimentIdOSF = 'H9cxh2VA14kV';
const prolificCompletionURL = '';  // TODO: fill in after prolific setup
const TEST = false;                // true = prefix saves w/ DEBUG_
const VERBOSE = false;
const SEED = null;

const N_ITEMS = 102;
const N_ATTENTION_CHECKS = 2;
const ESTIMATED_DURATION_MIN = 15;  // UPDATE after pilot
const PAYMENT = 2.50;               // UPDATE after pilot ($)

const LAB_NAME = "Social Interaction Lab";
const PI_NAME = "Robert Hawkins";
const CONTACT_EMAIL = "mokeeffe@stanford.edu";
const INSTITUTION = "Stanford University";
const LAB_LOGO = "🌱";

const STUDY_TITLE = "Thinking About What People Do";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;  // 5 min inactivity

// pool of attn check targets — avoids 50 (default slider pos)
const ATTN_TARGET_POOL = [14, 22, 31, 43, 57, 68, 79, 86];
