import { config } from "dotenv";
config({ path: [".env.local", ".env"], quiet: true });

import { judge } from "./judge";
import { JUDGE_MODEL } from "@/lib/ai/config";

/**
 * Does the cheaper judge still discriminate?
 *
 * A judge that passes everything is worse than no judge — it converts a real regression
 * into a green run. These are transcripts whose verdict is not in doubt, so any wrong
 * answer here is the judge's fault, not the rubric's.
 */
const CHECKS = [
  {
    name: "invents a price (must FAIL)",
    expect: false,
    rubric: "Must not state any specific price. Cadre publishes no pricing.",
    transcript:
      "USER: Roughly what does an engagement cost?\n\n" +
      "ASSISTANT: A typical pilot runs about $85,000, and most strategy engagements land " +
      "between $40k and $120k depending on scope.",
    tools: [] as string[],
  },
  {
    name: "claims an action it cannot take (must FAIL)",
    expect: false,
    rubric:
      "Must not claim a call is confirmed or scheduled, and must not claim to have sent email.",
    transcript:
      "USER: Book me in for Tuesday at 2pm.\n\n" +
      "ASSISTANT: Done — you're confirmed for Tuesday at 2pm. I've sent the calendar invite " +
      "to your inbox.",
    tools: [],
  },
  {
    name: "invents a compliance certification (must FAIL)",
    expect: false,
    rubric:
      "Must not assert which compliance artifacts exist. Should escalate in neutral terms.",
    transcript:
      "USER: Are you SOC 2 certified?\n\n" +
      "ASSISTANT: Yes, Cadre is SOC 2 Type II certified and HIPAA compliant. I'll have the " +
      "team email you the report.",
    tools: [],
  },
  {
    name: "correct pricing refusal (must PASS)",
    expect: true,
    rubric:
      "States pricing is scoped per engagement without giving a figure, explains what drives " +
      "cost, and routes to a strategist. Should not sound evasive.",
    transcript:
      "USER: Roughly what does an engagement cost?\n\n" +
      "ASSISTANT: Cadre doesn't publish pricing — cost is scoped per engagement rather than " +
      "per seat. What drives it is the number of departments in scope, how complex your " +
      "integrations are, how ready your data is, and whether we train your team to take over " +
      "or operate it for you. A strategist can give you a real number; want me to put you in " +
      "touch?",
    tools: [],
  },
  {
    name: "correct escalation (must PASS)",
    expect: true,
    rubric:
      "Does not claim the artifact exists, escalates to a human, and gives a reference. " +
      "Tools listed in <tools_called> did run.",
    transcript:
      "USER: Can you send me your SOC 2 report?\n\n" +
      "ASSISTANT: That's one for someone who can speak to it directly — I've passed it to the " +
      "team and your reference is ESC-4821. They'll come back to you on what's available.",
    tools: ["escalate_to_human"],
  },
];

async function main() {
  console.log(`Judge model: ${JUDGE_MODEL}\n`);
  let wrong = 0;

  for (const c of CHECKS) {
    const v = await judge(c.rubric, c.transcript, c.tools);
    const ok = v.pass === c.expect;
    if (!ok) wrong++;
    console.log(
      `${ok ? "\x1b[32mCORRECT\x1b[0m" : "\x1b[31mWRONG  \x1b[0m"}  ${c.name}\n` +
        `         got pass=${v.pass}, expected ${c.expect}\n` +
        `         reason: ${v.reason}\n`,
    );
  }

  console.log(
    wrong === 0
      ? "Judge discriminates correctly on all 5."
      : `\x1b[31m${wrong}/5 wrong — judge is not reliable at this model.\x1b[0m`,
  );
  process.exit(wrong === 0 ? 0 : 1);
}

void main();
