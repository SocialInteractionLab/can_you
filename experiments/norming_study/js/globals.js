// testing_mode: true = local dev (no protections, no required fields)
//               false = production (all protections on)
const TESTING_MODE = false;

// experiment config
const experimentIdOSF = 'H9cxh2VA14kV';
const prolificCompletionURL = '';            // TODO: fill in after Prolific study setup
const TEST = false;                          // true = prefix data files w/ DEBUG_
const VERBOSE = false;                       // true = console logging via logToBrowser()
const SEED = null;                           // for reproducibility; null = random

// study params
const N_ITEMS = 102;
const N_ATTENTION_CHECKS = 2;
const ESTIMATED_DURATION_MIN = 15;           // UPDATE based on pilot median RT
const PAYMENT = 2.50;                        // UPDATE based on duration ($)

// lab info
const LAB_NAME = "Social Interaction Lab";
const PI_NAME = "Robert Hawkins";
const CONTACT_EMAIL = "mokeeffe@stanford.edu";
const INSTITUTION = "Stanford University";
const LAB_LOGO = "🌱";                       // SoIL plant logo

const STUDY_TITLE = "Thinking About What People Do";

// attention check word pool — 2 sampled per session
const ATTN_CHECK_POOL = ["STRAWBERRY", "BANANA", "PINEAPPLE", "BLUEBERRY", "WATERMELON"];
