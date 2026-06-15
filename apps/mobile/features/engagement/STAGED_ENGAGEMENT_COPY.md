<!--
  STAGED — NOT WIRED. Reference only. Imported / rendered by NOTHING.

  Source: PSYCHAGE_MOBILE_ENGAGEMENT_COPY.md (verbatim). These strings are ADDITIVE
  keys for V1 surfaces that DO NOT EXIST in the build — there is no streak counter,
  no paywall/premium screen, no 30-day history-cap banner, no Trends tab, no
  milestone toasts, and no re-engagement notifications. The engagement deck reverses
  the Phase-2A kills per founder direction and needs founder sign-off (and clinical
  review for any check-in-adjacent surface) before ANY of it ships.

  Held as Markdown (not a .ts module) on purpose:
    1. None of these surfaces exist, so there is no render site to wire (copy-only task).
    2. Not-yet-approved monetization copy should not enter the typed copy layer before
       sign-off.
    3. Keeps it un-importable — it can never be rendered by accident.

  SAFETY (applies the moment any of this is ever built): the paywall gates DEPTH /
  CONVENIENCE only — never crisis, the Symptom Navigator (incl. the severity halt),
  or the daily check-in. No emoji (retained rule). [n]/[name]/[price]/[date]/[state]
  are interpolated values.

  When a surface is built, lift the relevant block into that feature's copy.ts under
  the suggested keys below and delete it here.
-->

# Staged engagement & monetization copy (NOT WIRED)

## §1 — Streaks & grace periods  `streak.*`
- counter: `[n]-day streak`
- day1: `Day 1 — nice start!`
- building: `[n] days in a row. Keep it going!`
- milestone: `[n]-day streak! You're on a roll.`
- atRisk: `Don't lose your [n]-day streak — check in before midnight.`
- broken: `Your [n]-day streak ended. Start a fresh one today.`
- grace.available: `Missed yesterday? Use a grace day to keep your streak alive.`
- grace.used: `Streak saved! You've used [n] of 2 grace days this month.`
- grace.exhausted: `No grace days left this month. Check in today to keep your streak.`
- grace.reset: `Your grace days just reset. You've got 2 again.`

## §2 — Premium / paywall / upgrade  `paywall.* · premium.*`
- headline: `Unlock Psychage Premium`
- subhead: `Go deeper with the tools that help the most.`
- featUnlimited: `Unlimited history — see every check-in you've ever made`
- featInsights: `Advanced insights — patterns, correlations, and trends over time`
- featProviders: `Link up to 3 providers — therapist, psychiatrist, primary care`
- featExports: `Branded multi-week exports — polished summaries for your care team`
- annual: `[price]/year — best value`
- monthly: `[price]/month`
- trialCta: `Start your 7-day free trial`
- trialFine: `7 days free, then [price]/year. Cancel anytime.`
- upgradeNow: `Upgrade now`
- restore: `Restore purchase`
- later: `Maybe later`
- lockLabel: `Premium`
- lockInline: `This is a Premium feature. Upgrade to unlock it.`
- lockCta: `See Premium`
- premium.active: `Psychage Premium — active`
- premium.renews: `Renews [date].`
- premium.cancel: `Cancel subscription`
- premium.lapsed: `Your Premium ended. Renew to get your tools back.`

## §3 — 30-day history cap  `historyCap.*`
- banner: `You're viewing your last 30 days.`
- unlockLine: `Unlock your full history with Premium.`
- beyondLock: `Your older entries are safe — Premium unlocks everything before [date].`
- unlockCta: `Unlock full history`

## §4 — Trends, pattern insights & correlations  `trends.*`
- title: `Your trends`
- empty: `Check in a few more times and your trends will show up here.`
- card.upWeek: `Your mood is trending up this week.`
- card.downWeek: `Your mood has been trending down this week.`
- card.mondayLow: `You tend to feel low on Mondays.`
- card.bestWeekends: `Your best days are usually weekends.`
- card.monthlyAvg: `This month's average: [state] — up from last month.`
- card.sleepCorr: `We noticed a pattern: your mood is lower after nights of poor sleep.`
- card.noteCorr: `On days you mention "work," your mood skews lower.`
- card.streakCorr: `Your longest streaks line up with your steadier weeks.`

## §5 — Milestone celebrations & completion counts  `milestone.*`
- firstCheckin: `First check-in done! Welcome to Psychage.`
- week: `Great work — a full week of check-ins!`
- month: `30 check-ins! One month strong.`
- hundred: `Incredible — 100 check-ins. Congratulations!`
- generic: `Well done! That's [n] check-ins.`
- exerciseDone: `Nice work — that's [n] breathing exercises completed.`
- exerciseCount: `You've completed [n] exercises.`
- weeklyRecap: `Great week! You checked in [n] of 7 days.`

## §6 — Emoji mood anchors: REMOVED (not written; "no emoji" retained).

## §7 — Re-engagement / win-back  `reengage.*`
- push.day1: `How are you doing today? A quick check-in takes 30 seconds.`
- push.day2: `We miss you. Your record is waiting.`
- push.day3: `It's been a few days — everything okay? Check in when you're ready.`
- push.week1: `You haven't checked in this week. Take a moment for yourself today.`
- push.streakWarn: `Don't lose your [n]-day streak! Check in to keep it.`
- push.streakLost: `Your streak ended — but you can start a new one right now.`
- banner.welcomeBack: `Welcome back! Pick up where you left off.`
- banner.winbackOffer: `Come back to Premium — your first month is 50% off.`
