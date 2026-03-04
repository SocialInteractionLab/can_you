# "Can You X?" Speech Act Ambiguity: Project Overview

## 1. The Phenomenon

"Can you X?" questions are ambiguous between (at least) two speech acts:

- **Ability question:** "Can you code in Python?" at a party → genuinely asking about ability. Expected response: "yes" or "no."
- **Action request:** "Can you pass the salt?" at dinner → asking the addressee to do the thing. Expected response: the addressee does X.

The same utterance can flip between readings depending on context. "Can you do a cartwheel?" is an ability question at a party and a request at a talent show. The goal of this project is to build a computational model of how listeners (answerers) disambiguate — how they figure out what the questioner wants.

## 2. Theoretical Framing

### 2.1 Connection to existing RSA work

This project builds on the Rational Speech Act (RSA) framework (Goodman & Frank, 2016). Two reference papers use "lifted-variable" RSA to model ambiguity resolution:

- **Scontras & Goodman (2017), Cognition:** "The boxes are heavy" is ambiguous between distributive ("each box is heavy") and collective ("the boxes together are heavy") readings. A latent variable $v \in \{\text{distributive}, \text{collective}\}$ is inferred by the pragmatic listener alongside the world state. Context (predictability of the collective property) and speaker knowledge (full access vs. sum-only) drive disambiguation. Formalized in the Bayesian RSA framework with a lifted interpretation variable.

- **Scontras & Pearl (2021), Glossa:** "Every horse didn't jump over the fence" is ambiguous between surface scope ("none jumped") and inverse scope ("not all jumped"). A latent variable $v \in \{\text{surface}, \text{inverse}\}$ is inferred by the pragmatic listener. Context (QUD, world expectations) and processing factors (scope accessibility) drive disambiguation. Also formalized in lifted-variable RSA.

Both models share the same core structure:
1. An ambiguous utterance has a latent interpretation variable $v$
2. The literal listener $L_0$ interprets the utterance given $v$
3. The speaker $S_1$ chooses utterances to communicate effectively to $L_0$
4. The pragmatic listener $L_1$ inverts $S_1$ to jointly infer the world state and $v$

### 2.2 What's different about "Can you X?"

In both reference papers, both interpretations are **assertions** — claims about the world that constrain the world state differently. In "Can you X?", the two interpretations are **different speech acts entirely**:

- Under the ability reading, the speaker is **eliciting information** — they want to learn something from the listener.
- Under the request reading, the speaker is **directing action** — they want the listener to do something.

This is a qualitative difference. The two readings call for completely different responses. Under ability, you answer "yes" or "no." Under request, you go do the thing. This means the standard RSA meaning function (utterance + interpretation → truth conditions over world states) needs careful thought, because questions and requests work differently from assertions.

### 2.3 Connection to Yoon et al. on politeness

Yoon et al.'s work on polite speech models speakers as optimizing a mixture of epistemic utility (be informative) and social utility (be nice). This explains **why** indirect forms like "Can you X?" exist — the question form is less face-threatening than the imperative "Do X."

The key distinction from this project: Yoon et al. explains why speakers produce indirect forms. This project explains how listeners interpret them. In Yoon et al., the utterance has one fixed literal meaning and the speaker may be insincere for social reasons. In this project, the utterance has two genuinely different meanings (ability question vs. request) and the listener must figure out which one was intended.

That said, politeness is relevant to this project as an explanation for why the indirect form is preferred over the imperative for requests. Speakers choose "Can you X?" over "Do X" partly because it's more polite. This could be incorporated into the speaker's utility function, but it's a secondary concern — the main question is about listener disambiguation.

## 3. Why RSA / Bayesian Theory of Mind?

A simpler model might just learn $P(\text{request} \mid \text{context features})$ directly — a classifier. Why do we need RSA?

**1. Utterance alternatives matter.** Consider identical contexts where someone says "Can you pass the salt?" vs. "Pass the salt." A context-only classifier predicts the same interpretation for both. RSA predicts different things because the listener reasons about *why the speaker chose this form over alternatives.* The choice of the indirect form over the imperative is informative.

**2. Speaker knowledge is inferred, not observed.** The listener doesn't directly observe what the questioner knows about them. They infer it from the question itself. "Can you do a cartwheel?" from a stranger simultaneously tells you they probably don't know your abilities (→ ability question). A classifier would need speaker knowledge as an input feature, which isn't available.

**3. Novel contexts.** A generative model derives predictions from first principles — give it priors for a new scenario and it produces predictions without training data for that specific context.

**4. Explaining the indirect form.** RSA can explain why speakers choose "Can you X?" over "Do X" — the indirect form trades off some informativity for politeness, and the speaker expects the listener's pragmatic competence to resolve the ambiguity. A classifier can't explain speaker behavior.

## 4. Evolution of the Model

### 4.1 Version 1: Basic lifted-variable RSA

The most direct analog to the reference papers.

**Variables:**
- $w = (a, n)$: world state — addressee's ability ($a$) and contextual need ($n$)
- $v \in \{\text{ability}, \text{request}\}$: intended speech act (latent)
- $b \in \{\text{knows}, \text{doesn't-know}\}$: questioner's knowledge of $a$ (latent)
- $u \in \{u_{\text{can}}, u_{\text{imp}}, u_{\text{null}}\}$: utterance (observed)

**Meaning function:**
$$\llbracket u_{\text{can}} \rrbracket_v(w) = \begin{cases} \text{true} & \text{if } v = \text{ability} \\ a \wedge n & \text{if } v = \text{request} \end{cases}$$

$$\llbracket u_{\text{imp}} \rrbracket(w) = a \wedge n$$

$$\llbracket u_{\text{null}} \rrbracket(w) = \text{true}$$

Note: "Are you able to X?" was removed as an "unambiguous ability" utterance because it's NOT unambiguously ability — "Are you able to pick me up from the airport?" is clearly a request.

**Literal listener:** $P_{L_0}(w \mid u, v) \propto \llbracket u \rrbracket_v(w) \cdot P(w)$

**Speaker (sampling-based, following Goodman & Stuhlmüller 2013):**
$$P_{S_1}(u \mid v, b) \propto \sum_w P(w \mid b) \cdot \exp\Big(\alpha \cdot [\log P_{L_0}(w \mid u, v) - C(u)]\Big)$$

The sampling-based formulation (exp inside the sum) is used rather than expected utility (exp outside the sum) because the expected utility version gives $-\infty$ utility whenever there's any probability of the utterance being false. This is too strict — people make requests even with some uncertainty about ability (e.g., "Can you return my library book?" when you don't know their schedule).

**Pragmatic listener (the posterior):**
$$P_{L_1}(w, v, b \mid u) \propto P_{S_1}(u \mid v, b) \cdot P(w) \cdot P(v \mid w) \cdot P(b)$$

The key term $P(v \mid w)$ captures "certain intentions are very unlikely in certain worlds" — e.g., requesting a cartwheel at the office is very unlikely.

**Limitations of Version 1:**
- The meaning function for the ability reading is problematic: if true everywhere, $L_0$ learns nothing, giving $S_1$ zero incentive to produce ability questions.
- The model treats the speech act as a primitive binary variable rather than deriving it from deeper goal structure.
- Questions (information elicitation) and requests (action direction) are fundamentally different speech acts, but the RSA framework was built for assertions.
- No notion of sequential planning, backup actions, or non-communicative alternatives.
- The ability reading's felicity conditions are unclear (see Section 4.3).

### 4.2 Version 2: RSA + Politeness (Yoon et al. style)

Adds a politeness weight $\phi$ to explain why speakers prefer "Can you X?" over "Do X."

**Speaker utility becomes:**
$$\tilde{U}_{S_1}(u; w, v, \phi) = (1 - \phi) \cdot [\log P_{L_0}(w \mid u, v) - C(u)] + \phi \cdot F(u)$$

Where $F(u)$ is the face utility: $F(u_{\text{can}}) > F(u_{\text{null}}) > F(u_{\text{imp}})$.

**Pragmatic listener now also infers $\phi$:**
$$P_{L_1}(w, v, b, \phi \mid u) \propto P_{S_1}(u \mid v, b, \phi) \cdot P(w) \cdot P(v \mid w) \cdot P(b) \cdot P(\phi)$$

This derives (rather than stipulates) why "Can you X?" is preferred for requests: the politeness benefit outweighs the informativity cost when the listener can disambiguate from context.

### 4.3 The felicity conditions problem

A fundamental issue with both Versions 1 and 2: what are the truth/felicity conditions of the ability reading?

**Option A: Ability reading is true everywhere.** $\llbracket u_{\text{can}} \rrbracket_{\text{ability}}(w) = \text{true}$. Problem: $L_0$ learns nothing, so $S_1$ has no incentive to produce ability questions. The model predicts speakers never ask ability questions.

**Option B: Ability reading means $a = 1$.** Treats the question as asserting its positive answer (has precedent in Hamblin semantics). Both readings now constrain the world, request is strictly more informative (also requires $n = 1$). Clean parallel to the reference models. Slight weirdness: the ability reading "asserts" something the questioner doesn't know.

**Option C: Ability reading constrains $b$.** $\llbracket u_{\text{can}} \rrbracket_{\text{ability}}(w, b) = (b = \text{doesn't-know})$. Captures speaker ignorance but breaks the clean separation between model levels.

**Option D: Redefine speaker utility under ability reading.** Under ability, the speaker optimizes information gain about $a$ rather than communicating a world state. Most theoretically honest but departs from vanilla RSA — the speaker's goal is different under the two readings.

### 4.4 Version 3: Causal Bayes Net / POMDP (current direction)

The most theoretically ambitious version. Reframes the questioner as a **planning agent** operating under **partial observability**, choosing actions (communicative and non-communicative) to achieve goals.

## 5. The POMDP Framework

### 5.1 Why POMDP over MDP?

An MDP assumes the agent fully observes the state. But the questioner **doesn't know** the addressee's ability, willingness, schedule, etc. This partial observability is the whole reason ability questions exist — you ask because you don't know, and knowing helps you plan.

In an MDP, there's no reason to gather information (you already know the state), so ability questions are unmotivated. The POMDP makes information-gathering actions a natural, rational behavior.

### 5.2 What POMDP adds over RSA

| Feature | RSA | POMDP |
|---|---|---|
| Speaker's purpose | Communicate a world state | Achieve a goal in the world |
| Action space | Utterances only | Utterances + non-communicative actions |
| Information-gathering actions | Unmotivated | First-class (reduce uncertainty for better future decisions) |
| Sequential planning | One-shot | Multi-step with contingencies |
| Dual-purpose questions | Awkward (must pick one reading) | Natural (single plan, multiple functions) |
| Why question is asked at all | To communicate | Instrumental action toward a goal |

### 5.3 The questioner's situation

The questioner is an agent with:
- A **goal** $g$: some desired outcome
- A **belief state** $\beta$: probability distribution over the addressee's state (partial observability)
- An **action set** $U$: communicative and non-communicative actions
- A **causal model** of how actions lead to outcomes through the addressee's response

### 5.4 Action value decomposition

Every action has two kinds of value:

$$U(u) = V_{\text{instrumental}}(u) + V_{\text{information}}(u) - C(u)$$

- **Instrumental value:** Does this action directly achieve my goal?
- **Information value:** Does this action reduce uncertainty in a way that helps me make better future decisions?
- **Cost:** Effort + social cost + risk

Ability questions have high information value and low instrumental value. Requests have high instrumental value. "Can you X?" in dual-purpose contexts has both.

### 5.5 Cost structure

Costs are multi-dimensional:

$$C(u) = c_{\text{effort}}(u, s) + c_{\text{social}}(u, g) + c_{\text{risk}}(u, \beta)$$

- **Effort cost** depends on world state (getting salt yourself costs more if you're far away)
- **Social cost** depends on the goal and action (big favors cost more socially; imperatives cost more than indirect forms)
- **Risk cost** depends on beliefs (requesting something the addressee probably can't do is risky — you'll be refused)

### 5.6 Sequential planning

The questioner plans over a sequence of actions:

```
Ask "Can you X?"
  → positive response → goal achieved (or negotiate details)
  → negative response → update beliefs, pursue backup plan
```

The value of asking includes not just the immediate outcome but the information gained for future decisions. This is standard POMDP lookahead.

### 5.7 Formal POMDP specification

**State space:** $s = (a, w_a)$ — addressee's ability and willingness. Partially observable to the questioner.

**Belief state:** $\beta = P_Q(s)$ — questioner's probability distribution over addressee's state.

**Action space:** $U = \{u_{\text{can}}, u_{\text{imp}}, u_{\text{null}}, d_{\text{self}}, d_{\text{other}}, ...\}$ — communicative and non-communicative actions.

**Observation model:** After acting, the questioner observes the addressee's response $r$ and updates beliefs:
$$\beta' = P_Q(s \mid r, u, \beta) \propto P(r \mid u, s) \cdot \beta(s)$$

**Transition model:** Actions change the world state (e.g., addressee does X → goal state reached).

**Reward:** $R(u, s, g) = V(\text{outcome}(u, s), g) - C(u)$

**Policy:** $\pi^*(\beta, g) = \arg\max_u \big[\text{immediate reward} + \gamma \cdot \text{expected future value}\big]$

### 5.8 The listener's inverse planning

The listener observes $u$ and infers the questioner's goal and beliefs by inverting the policy:

$$P_L(g, \beta \mid u) \propto P(\pi^*(\beta, g) = u) \cdot P(g) \cdot P(\beta)$$

"What goal and belief state would make this question the rational next step in a plan?"

The speech act interpretation falls out of goal inference:
- If inferred $g$ is "learn whether addressee can do X" → ability question
- If inferred $g$ is "get X done" → request
- If both goals are active → dual-purpose (the "Can you do this by Friday?" case)

## 6. Key Insight: Ambiguity as a Feature

The POMDP framework reveals that the ambiguity of "Can you X?" isn't a bug — it's a feature. The ambiguous form is often the optimal action *because* of its ambiguity:

- It's cheaper than the imperative (lower social cost / more polite)
- It can simultaneously check ability and make the request
- It gives the addressee an "out" (they can say "no" without directly refusing a command)
- The questioner free-rides on the listener's pragmatic competence — they know the listener will figure out the intended meaning from context

## 7. Concrete Scenarios

### Common POMDP structure across scenarios

**State:** $s = (a, w_a)$ — addressee's ability, addressee's willingness

**Questioner has:** goal $g$, beliefs $\beta = (\beta_a, \beta_w)$ over $s$, action set $U$

**Each action has:** instrumental value, information value, cost (effort + social)

**Listener infers:** $P_L(g, \beta \mid u)$

### 7.1 Low $P(g_{\text{action}})$: "Can you code in Python?" (party context)

**Context:** Party, getting to know someone in tech. No Python task exists.

**State:** $a$ = knows Python, $w_a$ = irrelevant (no task to do)

**Beliefs:** $\beta_a \approx 0.4$, $\beta_w$ = N/A

**Goal:** $g_{\text{info}}$ (learn about this person). $g_{\text{action}}$ implausible — no Python task exists at a party.

**Key actions:**

| Action | Instrumental | Info | Cost |
|---|---|---|---|
| "Can you code in Python?" | ~0 | High | Low |
| Don't ask | 0 | 0 | 0 |

**Sequential plan:**
```
Ask → "yes" → interesting, follow up ("what do you build?")
    → "no"  → conversation moves on
```

**Why ability:** No instrumental goal → information value is the only reason to ask.

**Key knob values:**

| Knob | Value |
|---|---|
| $\beta_a$ (ability uncertainty) | ~0.4 — genuinely don't know |
| $P(g_{\text{action}})$ | ~0 — no Python task at a party |
| Backup availability | N/A — no action goal to need a backup for |
| Social cost | Low — casual question |
| Power dynamic | None — peers at a party |
| Questioner's knowledge of addressee | Low — just met |

**Note:** The same utterance flips to a request/dual-purpose in a work context where there's a Python task that needs doing. This makes it a clean test case for the instrumental goal plausibility knob.

### 7.2 Moderate $P(g_{\text{action}})$: "Can you do this by Friday?" (workplace)

**Context:** Workplace. Questioner is a manager or colleague. "This" is a task/deliverable. Friday is a deadline.

**State:** $a$ = can realistically complete by Friday, $w_a$ = willing to prioritize this

**Beliefs:** $\beta_a \approx 0.5$, $\beta_w \approx 0.85$

**Goal:** $g_{\text{both}}$ — get it done by Friday if feasible, learn realistic timeline if not. Both $g_{\text{action}}$ and $g_{\text{info}}$ are plausible and hard to distinguish.

**Key actions:**

| Action | Instrumental | Info | Cost |
|---|---|---|---|
| "Can you do this by Friday?" | Moderate | High | Moderate social |
| "Do this by Friday" | Higher (clear directive) | Low (shuts down pushback) | High social |
| "When could you have this done?" | ~0 (no target set) | High | Low social |

**Sequential plan:**
```
Ask → "yes" → deadline set
    → "that's tight" → negotiate scope/support
    → "next Wednesday is more realistic" → adjust plan or reassign
```

**Why genuinely ambiguous:** Both goals are plausible. The directive and the open question are both available alternatives that would unambiguously signal one goal — the questioner chose the form that serves both. Interpretation depends on power dynamic, questioner's knowledge of addressee's workload, and organizational culture.

**Key knob values:**

| Knob | Value |
|---|---|
| $\beta_a$ (ability uncertainty) | ~0.5 — genuinely don't know if Friday is feasible |
| $P(g_{\text{action}})$ | Moderate — they want it by Friday but might be flexible |
| Backup availability | Yes — extend deadline, reassign, reduce scope |
| Social cost | Moderate — setting a deadline has pressure/imposition |
| Power dynamic | Manager → report: shifts toward directive reading |
| Questioner's knowledge of addressee | Moderate — knows their role but maybe not current workload |

### 7.3 High $P(g_{\text{action}})$: "Can you pass the salt?" (dinner table)

**Context:** Dinner table. Questioner's food needs salt. Salt is near the addressee, out of reach.

**State:** $a$ = can reach the salt, $w_a$ = willing to pass it

**Beliefs:** $\beta_a \approx 1.0$, $\beta_w \approx 0.95$

**Goal:** $g_{\text{action}}$ (get salt). $g_{\text{info}}$ implausible — nothing to learn.

**Key actions:**

| Action | Instrumental | Info | Cost |
|---|---|---|---|
| "Can you pass the salt?" | High | ~0 | Low |
| "Pass the salt" | High | ~0 | Moderate social (blunt) |
| Get it yourself | High | 0 | High effort |

**Sequential plan:**
```
Ask → they pass the salt → done
```

One step. No contingency. This is a degenerate POMDP — essentially an MDP because the questioner already knows the state.

**Why request:** $\beta_a \approx 1$ → zero information value → can only be instrumental.

**Key knob values:**

| Knob | Value |
|---|---|
| $\beta_a$ (ability uncertainty) | ~1.0 — trivially certain |
| $P(g_{\text{action}})$ | ~1.0 — clear need, addressee's action directly achieves it |
| Backup availability | Get it yourself (costly) |
| Social cost | Very low — tiny favor |
| Power dynamic | None — peers at dinner |
| Questioner's knowledge of addressee | High — ability is obvious |

## 8. The Knobs (Experimental Variables)

Looking across scenarios, these are the dimensions that drive disambiguation:

| Knob | Variable | Low → | High → |
|---|---|---|---|
| Ability uncertainty | $\beta_a$ | Near 1.0: zero info value → request | Near 0.5: high info value → ability or dual-purpose |
| Instrumental goal plausibility | $P(g_{\text{action}})$ | No need for X → ability question | Clear need → request |
| Backup availability | $\|U_{\text{alternatives}}\|$ | No backup → must request | Good backup exists → might just be checking |
| Social cost of request | $c_{\text{social}}(u)$ | Trivial favor → request is easy | Big imposition → more likely checking first |
| Power dynamic | Modulates $\beta_w$ and $c_{\text{social}}$ | Peer/subordinate → more cautious, checking | Authority → more directive |
| Questioner's knowledge of addressee | Modulates $\beta_a$ | Stranger → high uncertainty → info-seeking plausible | Close relationship → low uncertainty → request |

Additional knob highlighted by scenario analysis:

| Knob | Description |
|---|---|
| Terminal vs. instrumental info goal | Whether the information is wanted for its own sake (terminal → pure ability question) or feeds a downstream decision (instrumental → line between ability and request blurs) |

## 9. Key Theoretical Observations

### 9.1 There may be no context-independent ability questions

Every "Can you X?" can become a request given the right goal structure. "Can you speak Mandarin?" becomes a request if a Chinese tourist needs help. "Can you run a mile?" becomes a request from a PE teacher. What makes something an ability question isn't the utterance — it's the absence of a plausible instrumental goal.

### 9.2 Dual-purpose questions dissolve in the POMDP

In the RSA version, "Can you drive me to the airport?" is awkwardly both ability and request, and the model must pick one. In the POMDP, the questioner has a single goal (get to airport) and the question is one action in a contingent plan that both checks feasibility and makes the request. There's no need to categorize it as one or the other.

### 9.3 The speech act falls out of goal inference

Rather than treating $v \in \{\text{ability}, \text{request}\}$ as a primitive latent variable, the POMDP derives the interpretation from the inferred goal:
- Inferred $g$ = "learn about addressee" → ability question
- Inferred $g$ = "get X done" → request
- Inferred $g$ = "get X done but need to check feasibility first" → dual-purpose

## 10. Implementation Path

### 10.1 Recommended approach: Think POMDP, implement RSA

Use the causal/POMDP analysis to **motivate** the RSA model:
1. Use causal scenario analysis to motivate the goal space ($g_{\text{action}}$ vs. $g_{\text{info}}$ maps onto $v \in \{\text{request}, \text{ability}\}$)
2. Use causal reasoning to motivate the priors ($P(v \mid w)$ is derived from goal plausibility in context)
3. Use causal reasoning to motivate the cost function
4. Implement in RSA/Memo for tractability
5. Frame the full causal POMDP as the theoretical framework in the paper

This is what many RSA papers do — priors are motivated by deeper theory, computational model uses RSA.

### 10.2 Eventual goal: Full POMDP implementation

The full POMDP implementation would:
- Explicitly model the questioner's goal space and causal model
- Include non-communicative actions in the action space
- Derive the preference for indirect forms from the planning problem
- Handle sequential planning and contingent responses
- Make the listener's inference be inverse planning over the questioner's POMDP policy

This is more theoretically satisfying but computationally harder.

## 11. Reference Models (from advisor)

### 11.1 Memo textbook chapters

- **Chapter 2 (Scalar Implicature):** Covers basic RSA, speaker knowledge manipulation, joint inference of world state and speaker competence. The extended Goodman & Stuhlmüller model where the listener infers the speaker's epistemic access is directly analogous to inferring the questioner's knowledge state $b$.

- **Chapter 6 (Plural Predication):** Covers the lifted-variable approach to ambiguity resolution (distributive vs. collective), speaker knowledge manipulation, and collective noise. Directly analogous structure — replace distributive/collective with ability/request.

### 11.2 Papers

- **Scontras & Goodman (2017), Cognition:** Resolving uncertainty in plural predication. Lifted-variable RSA with speaker knowledge. The model for "Can you X?" has the same architecture but with speech act ambiguity instead of predication ambiguity.

- **Scontras & Pearl (2021), Glossa:** Quantifier scope ambiguity in truth-value judgments. Lifted-variable RSA with QUD inference. Uses an $S_2$ layer for modeling truth-value judgment tasks (not needed for "Can you X?" since we're modeling comprehension, not production/endorsement).

### 11.3 Structural correspondence

| Component | Plural Predication (S&G 2017) | Scope Ambiguity (S&P 2021) | This Model |
|---|---|---|---|
| Ambiguous utterance | "The boxes are heavy" | "Every horse didn't jump" | "Can you X?" |
| Latent variable $v$ | Distributive vs. collective | Surface vs. inverse scope | Ability vs. request (or: goal inference) |
| World state $w$ | Object weights | Number of successes | Ability $a$, need $n$ (or: full addressee state) |
| Speaker knowledge | Full access vs. sum-only | N/A | Knows vs. doesn't-know addressee ability |
| Context effect | Noise $P(c)$ on collective property | QUD prior, world expectations | $P(v \mid w)$ / goal plausibility |
| Unambiguous alternatives | "each are heavy" / "together are heavy" | Only null vs. amb | "Do X" (imperative) / null |

## 12. Open Questions

1. **Felicity conditions for the ability reading:** How to handle the meaning function for questions (information elicitation) within a framework designed for assertions? Option B (ability reading means $a = 1$) is the most pragmatic; Option D (redefine speaker utility under ability) is the most theoretically honest.

2. **How much causal structure to make explicit:** Full POMDP vs. RSA with causally-motivated priors. Tradeoff between theoretical depth and tractability.

3. **Experimental design:** What vignettes best test the knobs? The three scenarios (Python/party, Friday/work, salt/dinner) provide a starting point, with context manipulation (e.g., Python at party vs. work) as a within-item factor.

4. **Relationship between ability and request:** Are these really two discrete categories, or endpoints of a continuum? The POMDP suggests the latter — the dual-purpose cases are intermediate points where both information and instrumental value are present.

5. **The role of the addressee's response:** The listener's interpretation determines their response, which feeds back into the questioner's plan. Should the model capture this interactive loop, or is the one-shot listener inference sufficient?

6. **Scope:** This project focuses on "Can you X?" but the framework generalizes to other indirect speech acts ("Do you know anyone hiring?", "Are you using your car tomorrow?", etc.). Scoping to "Can you X?" is motivated by its clean binary ambiguity and deep roots in the speech act literature (Searle). Generalization is a natural follow-up.
