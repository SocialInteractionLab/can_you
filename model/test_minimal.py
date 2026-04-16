"""Minimal model: 'can you?' as ability question, indirect request from RSA.

Ingredients (all derived):
  1. CAN literally asks about ability → INFO utility = information gain
  2. IMP directly commands → ACTION utility = compliance, cost = δ
  3. Goal prior: P(g=ACTION) = 0.5 * f_ctx (action goals presuppose feasibility)
  4. Response: ACT entails YES (acting answers the ability question)

Context sensitivity from IG: when ability is common ground,
asking is uninformative → listener infers non-informational motive.

Parameters: δ (constant), α (rationality), f_k (prior concentration).
No question cost, no context-dependent face cost, no action cost.
"""
import numpy as np
import jax
import jax.numpy as jnp
from jax.scipy.stats import beta as jax_beta
from math import exp
from memo import memo

# === SETUP ===
INFO, ACTION = 0, 1
CAN, IMP, NULL = 0, 1, 2
ACT, PASS = 0, 1
goals = [INFO, ACTION]
U = [CAN, IMP, NULL]
R = [ACT, PASS]

delta = 0.7       # face-threat cost of imperative (constant)
alpha = 10        # softmax rationality
f_k = 10          # feasibility prior concentration

f_vals = np.linspace(0.01, 0.99, 50)
theta_vals = np.linspace(0.01, 0.99, 200)

contexts = {
    'benchpress 150': 0.10,
    'drive me home':  0.70,
    'call me later':  0.90,
    'pass the salt':  0.99,
}

# other contexts: "can you lift that?". "can you speak x_language?"


# === DERIVED FROM SEMANTICS ===

@jax.jit
def goal_prior(g, f_ctx):
    """Action goals presuppose feasibility. Given feasibility, max-entropy."""
    p_action = 0.5 * f_ctx
    return jnp.where(g == ACTION, p_action, 1 - p_action)

@jax.jit
def discrete_entropy(probs):
    p_c = jnp.clip(probs, 1e-12, 1.0)
    return -jnp.sum(p_c * jnp.log(p_c))

@jax.jit
def info_gain(f_ctx, t):
    """MI between f and the answer to 'can you?' (f > t)."""
    f_arr = jnp.array(f_vals)
    raw = jax_beta.pdf(jnp.clip(f_arr, .01, .99), f_ctx * f_k, (1 - f_ctx) * f_k)
    pi_f = raw / jnp.sum(raw)             # prior over f, normalized
    p_y = jnp.where(f_arr > t, 1.0, 0.0)            #P(yes|f) = 1 if f > t, else 0
    p_yes_marg = jnp.sum(pi_f * p_y)                #marginal P(yes) = E_π[f>t]
    p_no_marg = 1.0 - p_yes_marg                      #marginal P(no) = 1 - P(yes)
    post_yes = pi_f * p_y / jnp.clip(p_yes_marg, 1e-12)         # posterior over f | yes
    post_no = pi_f * (1 - p_y) / jnp.clip(p_no_marg, 1e-12)         # posterior over f | no
    return discrete_entropy(pi_f) - p_yes_marg * discrete_entropy(post_yes) \
                                  - p_no_marg * discrete_entropy(post_no)

# === S1 UTILITY ===
@jax.jit
def eu_s1(u, g, f, t, f_ctx):
    """Minimal speaker utility.
    ACTION: IMP → compliance - δ, CAN → 0, NULL → 0
    INFO:   CAN → IG,           IMP → -δ,  NULL → 0"""
    comply = jnp.where(f > t, 1.0, 0.0)             # can the addressee do it?
    act = jnp.where(u == IMP, comply, 0.)                # IMP → get compliance if able
    info = jnp.where(u == CAN, info_gain(f_ctx, t), 0.)         # CAN → get information
    social = jnp.where(u == IMP, delta, 0.)             # IMP → pay face cost
    return jnp.where(g == ACTION, act, info) - social

# === RESPONSE UTILITY ===
@jax.jit
def eu_respond(r, g, f, t):
    """ACT entails YES: acting answers the ability question.
    ACT:  can (demonstrates ability or fulfills request)
    PASS: 1 if INFO (truthful verbal answer), 0 if ACTION (missed request)"""
    can = jnp.where(f > t, 1.0, 0.0)                # is the action feasible?
    u_act = can                                 # EU(ACT) = feasibility
    u_pass = jnp.where(g == ACTION, 0., 1.)        # EU(PASS) = 1 if INFO goal, 0 if ACTION goal
    return jnp.where(r == ACT, u_act, u_pass)

# === S1 ===
@memo
def S1[_u: U, _g: goals, _f: f_vals, _t: theta_vals](f_ctx, alpha):
    speaker: knows(_g, _f, _t)
    speaker: chooses(u in U, wpp=exp(alpha * eu_s1(u, _g, _f, _t, f_ctx)))
    return Pr[speaker.u == _u]

# === A1 (with response) ===
@memo
def A1[_r: R, _f: f_vals, _t: theta_vals](f_ctx, alpha):
    a1: knows(_f, _t)
    a1: thinks[
        spk: knows(_f, _t),
        spk: given(g in goals, wpp=goal_prior(g, f_ctx)),
        spk: chooses(u in U, wpp=exp(alpha * eu_s1(u, g, _f, _t, f_ctx)))
    ]
    a1: observes_that[spk.u == 0] # observes u=CAN
    a1: wants(payoff = eu_respond(r, spk.g, _f, _t))
    a1: chooses(r in R, wpp=exp(alpha * EU[payoff]))
    return Pr[a1.r == _r]

# === A1 inline (pure JAX for S2) ===
@jax.jit
def a1_act_inline(f, t, f_ctx):
    """A1's P(ACT | f, t) as pure JAX — for S2's expected compliance."""
    eu_act_g = jnp.array([eu_s1(u, ACTION, f, t, f_ctx) for u in U])
    eu_inf_g = jnp.array([eu_s1(u, INFO, f, t, f_ctx) for u in U])
    def softmax_at(eus, idx):
        logits = alpha * eus
        logits = logits - logits.max()
        p = jnp.exp(logits)
        return p[idx] / p.sum()
    s1_can_act = softmax_at(eu_act_g, CAN)
    s1_can_inf = softmax_at(eu_inf_g, CAN)
    p_act_prior = 0.5 * f_ctx
    p_ga = p_act_prior * s1_can_act / (p_act_prior * s1_can_act + (1 - p_act_prior) * s1_can_inf + 1e-20)
    # EU(ACT) = can, EU(PASS) = 1 - p_ga
    can = jnp.where(f > t, 1.0, 0.0)
    logits = alpha * jnp.array([can, 1.0 - p_ga])
    logits = logits - logits.max()
    p = jnp.exp(logits)
    return p[ACT] / p.sum()

# === S2 UTILITY ===
@jax.jit
def eu_s2(u, g, f, t, f_ctx):
    """S2: CAN+ACTION uses A1's compliance. Everything else same as S1."""
    a1_act = a1_act_inline(f, t, f_ctx)     # what A1 would do at this (f, t)
    comply = jnp.where(f > t, 1.0, 0.0)
    act_can = jnp.where(u == CAN, a1_act, 0.)       #CAN -> get A1's compliance
    act_imp = jnp.where(u == IMP, comply, 0.)       #IMP -> get compliance directly
    act = jnp.where(u == CAN, act_can, act_imp)
    info = jnp.where(u == CAN, info_gain(f_ctx, t), 0.)
    social = jnp.where(u == IMP, delta, 0.)
    return jnp.where(g == ACTION, act, info) - social

# === S2 ===
@memo
def S2[_u: U, _g: goals, _f: f_vals, _t: theta_vals](f_ctx, alpha):
    speaker: knows(_g, _f, _t)
    speaker: chooses(u in U, wpp=exp(alpha * eu_s2(u, _g, _f, _t, f_ctx)))
    return Pr[speaker.u == _u]

# === A2 ===
@memo
def A2[_r: R, _f: f_vals, _t: theta_vals](f_ctx, alpha):
    a2: knows(_f, _t)
    a2: thinks[
        spk: knows(_f, _t),
        spk: given(g in goals, wpp=goal_prior(g, f_ctx)),
        spk: chooses(u in U, wpp=exp(alpha * eu_s2(u, g, _f, _t, f_ctx)))
    ]
    a2: observes_that[spk.u == 0]
    a2: wants(payoff = eu_respond(r, spk.g, _f, _t))
    a2: chooses(r in R, wpp=exp(alpha * EU[payoff]))
    return Pr[a2.r == _r]

# === GOAL INFERENCE ===
@memo
def A1_goal[_g: goals, _f: f_vals, _t: theta_vals](f_ctx, alpha):
    a1: knows(_g, _f, _t)
    a1: thinks[
        spk: knows(_f, _t),
        spk: given(g in goals, wpp=goal_prior(g, f_ctx)),
        spk: chooses(u in U, wpp=exp(alpha * eu_s1(u, g, _f, _t, f_ctx)))
    ]
    a1: observes_that[spk.u == 0]
    return a1[Pr[spk.g == _g]]

@memo
def A2_goal[_g: goals, _f: f_vals, _t: theta_vals](f_ctx, alpha):
    a2: knows(_g, _f, _t)
    a2: thinks[
        spk: knows(_f, _t),
        spk: given(g in goals, wpp=goal_prior(g, f_ctx)),
        spk: chooses(u in U, wpp=exp(alpha * eu_s2(u, g, _f, _t, f_ctx)))
    ]
    a2: observes_that[spk.u == 0]
    return a2[Pr[spk.g == _g]]

# === MARGINALIZATION ===
def marginalize(table, idx, f_ctx):
    """Marginalize table[idx] over f (prior-weighted) and θ (uniform)."""
    f_arr = jnp.array(f_vals)
    raw = jax_beta.pdf(jnp.clip(f_arr, .01, .99), f_ctx * f_k, (1 - f_ctx) * f_k)
    w_f = raw / jnp.sum(raw)
    return float(jnp.mean(jnp.sum(w_f[:, None] * table[idx], axis=0)))

# === RUN ===
print("Compiling S1...")
_ = S1(f_ctx=0.5, alpha=alpha)
print("A1...")
_ = A1(f_ctx=0.5, alpha=alpha)
print("S2...")
_ = S2(f_ctx=0.5, alpha=alpha)
print("A2...")
_ = A2(f_ctx=0.5, alpha=alpha)

print(f"\nMinimal model: α={alpha}, δ={delta}, f_k={f_k}")
print(f"No question cost, no context-dependent δ, no action cost.")
print(f"Response model: ACT entails YES (zero new parameters)")
print(f"\n{'context':<18} {'f_ctx':>5} {'P(g=a|A1)':>10} {'P(act|A1)':>10} {'P(g=a|A2)':>10} {'P(act|A2)':>10}")
for label, f_ctx in contexts.items():
    g1 = marginalize(A1_goal(f_ctx=f_ctx, alpha=alpha), ACTION, f_ctx)
    p_a1 = marginalize(A1(f_ctx=f_ctx, alpha=alpha), ACT, f_ctx)
    g2 = marginalize(A2_goal(f_ctx=f_ctx, alpha=alpha), ACTION, f_ctx)
    p_a2 = marginalize(A2(f_ctx=f_ctx, alpha=alpha), ACT, f_ctx)
    print(f"  {label:<18} {f_ctx:>5.2f} {g1:>10.4f} {p_a1:>10.3f} {g2:>10.4f} {p_a2:>10.3f}")

ga1 = [marginalize(A1_goal(f_ctx=f, alpha=alpha), ACTION, f) for f in contexts.values()]
ga2 = [marginalize(A2_goal(f_ctx=f, alpha=alpha), ACTION, f) for f in contexts.values()]
va1 = [marginalize(A1(f_ctx=f, alpha=alpha), ACT, f) for f in contexts.values()]
va2 = [marginalize(A2(f_ctx=f, alpha=alpha), ACT, f) for f in contexts.values()]
print(f"\nA1 goal mono:       {all(a < b for a, b in zip(ga1, ga1[1:]))}")
print(f"A2 goal mono:       {all(a < b for a, b in zip(ga2, ga2[1:]))}")
print(f"A1 compliance mono: {all(a < b for a, b in zip(va1, va1[1:]))}")
print(f"A2 compliance mono: {all(a < b for a, b in zip(va2, va2[1:]))}")

# IG for interpretability
print(f"\nIG by context (avg over θ):")
ig_vals = []
for label, f_ctx in contexts.items():
    igs = [float(info_gain(f_ctx, t)) for t in theta_vals]
    ig_vals.append(np.mean(igs))
    print(f"  {label:<18} f_ctx={f_ctx:.2f}  avg_IG={np.mean(igs):.4f}")

# === PLOTS ===
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'config'))
from ceride_palettes import PALETTES, PLOT_THEME

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

plt.rcParams.update(PLOT_THEME)

c_a1 = PALETTES['primary'][1]   # #596e6d teal
c_a2 = PALETTES['primary'][3]   # #de6841 orange
c_ig = PALETTES['primary'][0]   # #789769 green

ctx_labels = list(contexts.keys())
x = np.arange(len(ctx_labels))
x_ticks = [f"{l}\n(f={f:.2f})" for l, f in contexts.items()]
out_dir = '/Users/mokeeffe/Documents/GitHub/can_you/results/model/test_minimal'

# --- fig 1: goal inference + compliance ---
fig, axes = plt.subplots(1, 2, figsize=(10, 4))
width = 0.35

ax = axes[0]
ax.bar(x - width/2, ga1, width, color=c_a1, alpha=0.85, edgecolor='#464548', linewidth=0.7, label='A1')
ax.bar(x + width/2, ga2, width, color=c_a2, alpha=0.85, edgecolor='#464548', linewidth=0.7, label='A2')
ax.set_xticks(x); ax.set_xticklabels(x_ticks, fontsize=8)
ax.set_ylabel('P(g = action | u = "can you?")')
ax.set_title('Goal inference'); ax.set_ylim(0, 1); ax.legend()

ax = axes[1]
ax.bar(x - width/2, va1, width, color=c_a1, alpha=0.85, edgecolor='#464548', linewidth=0.7, label='A1')
ax.bar(x + width/2, va2, width, color=c_a2, alpha=0.85, edgecolor='#464548', linewidth=0.7, label='A2')
ax.set_xticks(x); ax.set_xticklabels(x_ticks, fontsize=8)
ax.set_ylabel('P(act | u = "can you?")')
ax.set_title('Compliance'); ax.set_ylim(0, 1); ax.legend()

plt.suptitle(fr'$\alpha$={alpha}, $\delta$={delta}, $f_k$={f_k}', fontsize=10)
plt.tight_layout()
plt.savefig(os.path.join(out_dir, 'goal_compliance.png'), dpi=150, bbox_inches='tight')
plt.close()
print(f"\nsaved → {out_dir}/goal_compliance.png")

# --- fig 2: IG by context ---
fig, ax = plt.subplots(figsize=(6, 4))
bars = ax.bar(x, ig_vals, color=c_ig, alpha=0.85, edgecolor='#464548', linewidth=0.7)
ax.set_xticks(x); ax.set_xticklabels(x_ticks, fontsize=8)
ax.set_ylabel('Avg information gain (nats)')
ax.set_title(fr'Info value of asking "can you?"  ($\alpha$={alpha}, $f_k$={f_k})')
ax.set_ylim(0, max(ig_vals) * 1.25)
for bar, v in zip(bars, ig_vals):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.005,
            f'{v:.3f}', ha='center', va='bottom', fontsize=8)
plt.tight_layout()
plt.savefig(os.path.join(out_dir, 'info_gain.png'), dpi=150, bbox_inches='tight')
plt.close()
print(f"saved → {out_dir}/info_gain.png")

