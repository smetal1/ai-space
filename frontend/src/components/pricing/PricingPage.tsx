import { useState } from "react";
import { useAppStore } from "@/store/appStore";

type Billing = "monthly" | "yearly";

interface Plan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: Record<string, string>;
  highlighted?: boolean;
  cta: string;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Get started with AI-powered coding and writing",
    monthlyPrice: 0,
    yearlyPrice: 0,
    cta: "Get Started",
    limits: {
      "Chat messages": "50 / day",
      "Canvas generations": "20 / day",
      "Code actions": "20 / day",
      "Agent tasks": "5 / day",
      "Max context": "4K tokens",
    },
    features: [
      "Canvas editor (TipTap)",
      "Code editor (Monaco)",
      "Chat assistant",
      "vLLM open-source models",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For developers who need more power and speed",
    monthlyPrice: 20,
    yearlyPrice: 192,
    cta: "Start Pro Trial",
    highlighted: true,
    limits: {
      "Chat messages": "Unlimited",
      "Canvas generations": "500 / day",
      "Code actions": "500 / day",
      "Agent tasks": "100 / day",
      "Max context": "32K tokens",
    },
    features: [
      "Everything in Free",
      "Claude Sonnet access",
      "Code Agent (autonomous)",
      "Priority streaming",
      "File upload support",
      "Custom system prompts",
      "Email support",
    ],
  },
  {
    id: "team",
    name: "Team",
    description: "Collaborate with your team on AI-powered projects",
    monthlyPrice: 40,
    yearlyPrice: 384,
    cta: "Contact Sales",
    limits: {
      "Chat messages": "Unlimited",
      "Canvas generations": "Unlimited",
      "Code actions": "Unlimited",
      "Agent tasks": "Unlimited",
      "Max context": "128K tokens",
    },
    features: [
      "Everything in Pro",
      "Claude Opus access",
      "Shared workspaces",
      "Team agent workspace",
      "Admin dashboard",
      "SSO / SAML",
      "Audit logs",
      "Dedicated support",
    ],
  },
];

const modelPricing = [
  { model: "Qwen3.5-9B (vLLM)", input: "Free (self-hosted)", output: "Free (self-hosted)", notes: "Requires GPU" },
  { model: "Claude Haiku", input: "$0.25 / 1M tokens", output: "$1.25 / 1M tokens", notes: "Fast, affordable" },
  { model: "Claude Sonnet", input: "$3 / 1M tokens", output: "$15 / 1M tokens", notes: "Best balance" },
  { model: "Claude Opus", input: "$15 / 1M tokens", output: "$75 / 1M tokens", notes: "Most capable" },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const setView = useAppStore((s) => s.setView);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Pricing</h1>
          <p style={styles.subtitle}>
            Start free, scale as you grow. Self-host with vLLM for zero API costs.
          </p>
          <div style={styles.billingToggle}>
            <button
              onClick={() => setBilling("monthly")}
              style={{
                ...styles.billingBtn,
                ...(billing === "monthly" ? styles.billingActive : {}),
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              style={{
                ...styles.billingBtn,
                ...(billing === "yearly" ? styles.billingActive : {}),
              }}
            >
              Yearly
              <span style={styles.saveBadge}>Save 20%</span>
            </button>
          </div>
        </div>

        {/* Plan Cards */}
        <div style={styles.plans}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                ...styles.card,
                ...(plan.highlighted ? styles.cardHighlighted : {}),
              }}
            >
              {plan.highlighted && (
                <div style={styles.popularBadge}>Most Popular</div>
              )}
              <div style={styles.cardHeader}>
                <h3 style={styles.planName}>{plan.name}</h3>
                <p style={styles.planDesc}>{plan.description}</p>
              </div>

              <div style={styles.priceSection}>
                <span style={styles.currency}>$</span>
                <span style={styles.price}>
                  {billing === "monthly"
                    ? plan.monthlyPrice
                    : Math.round(plan.yearlyPrice / 12)}
                </span>
                <span style={styles.period}>/ mo</span>
              </div>
              {billing === "yearly" && plan.yearlyPrice > 0 && (
                <div style={styles.yearlyNote}>
                  ${plan.yearlyPrice} billed yearly
                </div>
              )}

              <button
                onClick={() => setView("split")}
                style={{
                  ...styles.ctaBtn,
                  ...(plan.highlighted ? styles.ctaHighlighted : {}),
                }}
              >
                {plan.cta}
              </button>

              {/* Limits */}
              <div style={styles.limitsSection}>
                <div style={styles.sectionLabel}>Usage Limits</div>
                {Object.entries(plan.limits).map(([key, value]) => (
                  <div key={key} style={styles.limitRow}>
                    <span style={styles.limitKey}>{key}</span>
                    <span style={styles.limitValue}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Features */}
              <div style={styles.featuresSection}>
                <div style={styles.sectionLabel}>Features</div>
                {plan.features.map((f) => (
                  <div key={f} style={styles.featureRow}>
                    <span style={styles.checkmark}>&#10003;</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Model Pricing Table */}
        <div style={styles.modelSection}>
          <h2 style={styles.modelTitle}>AI Model Pricing</h2>
          <p style={styles.modelSubtitle}>
            Pay-per-token for Claude API, or self-host open-source models for free
          </p>
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span style={styles.tableCell}>Model</span>
              <span style={styles.tableCell}>Input</span>
              <span style={styles.tableCell}>Output</span>
              <span style={styles.tableCell}>Notes</span>
            </div>
            {modelPricing.map((row) => (
              <div key={row.model} style={styles.tableRow}>
                <span style={{ ...styles.tableCell, fontWeight: 600 }}>
                  {row.model}
                </span>
                <span style={styles.tableCell}>{row.input}</span>
                <span style={styles.tableCell}>{row.output}</span>
                <span style={{ ...styles.tableCell, color: "var(--text-secondary)" }}>
                  {row.notes}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={styles.faqSection}>
          <h2 style={styles.modelTitle}>FAQ</h2>
          <div style={styles.faqGrid}>
            <FaqItem
              q="Can I use AI Space completely free?"
              a="Yes. Self-host with vLLM + Qwen3.5 and you pay nothing for AI — only your GPU costs. The Free plan with vLLM gives you canvas, code editor, chat, and agent."
            />
            <FaqItem
              q="What's the difference between plans?"
              a="Free uses vLLM (open-source models). Pro adds Claude Sonnet for higher quality. Team adds Claude Opus, shared workspaces, and enterprise features."
            />
            <FaqItem
              q="Do I need a GPU for vLLM?"
              a="Yes. Qwen3.5-9B needs ~18GB VRAM (e.g. 50% of an L40S). For smaller GPUs, use Qwen3.5-4B (~8GB). No GPU? Use the Claude API plans instead."
            />
            <FaqItem
              q="Can I bring my own API key?"
              a="Yes. Set your ANTHROPIC_API_KEY in the .env file and use Claude directly without a plan subscription. You'll be billed by Anthropic per-token."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={styles.faqItem} onClick={() => setOpen(!open)}>
      <div style={styles.faqQuestion}>
        <span>{q}</span>
        <span style={styles.faqToggle}>{open ? "-" : "+"}</span>
      </div>
      {open && <div style={styles.faqAnswer}>{a}</div>}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: "100%",
    overflow: "auto",
    background: "var(--bg-primary)",
  },
  content: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "40px 24px 80px",
  },
  header: {
    textAlign: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "var(--text-secondary)",
    marginBottom: 24,
  },
  billingToggle: {
    display: "inline-flex",
    gap: 4,
    background: "var(--bg-secondary)",
    borderRadius: 8,
    padding: 3,
  },
  billingBtn: {
    padding: "8px 20px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    background: "transparent",
    color: "var(--text-secondary)",
    display: "flex",
    alignItems: "center",
    gap: 6,
    transition: "all 0.15s",
  },
  billingActive: {
    background: "var(--bg-tertiary)",
    color: "var(--text-primary)",
  },
  saveBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: 4,
    background: "var(--success)",
    color: "#fff",
  },
  plans: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 20,
    marginBottom: 60,
  },
  card: {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 28,
    display: "flex",
    flexDirection: "column",
    position: "relative",
  },
  cardHighlighted: {
    border: "2px solid var(--accent)",
    boxShadow: "0 0 30px rgba(124, 92, 252, 0.15)",
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    left: "50%",
    transform: "translateX(-50%)",
    background: "var(--accent)",
    color: "#fff",
    fontSize: 11,
    fontWeight: 700,
    padding: "4px 14px",
    borderRadius: 20,
    whiteSpace: "nowrap",
  },
  cardHeader: {
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 6,
  },
  planDesc: {
    fontSize: 13,
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
  priceSection: {
    display: "flex",
    alignItems: "baseline",
    gap: 2,
    marginBottom: 4,
  },
  currency: {
    fontSize: 20,
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  price: {
    fontSize: 42,
    fontWeight: 700,
    lineHeight: 1,
  },
  period: {
    fontSize: 14,
    color: "var(--text-secondary)",
    marginLeft: 4,
  },
  yearlyNote: {
    fontSize: 12,
    color: "var(--text-secondary)",
    marginBottom: 4,
  },
  ctaBtn: {
    width: "100%",
    padding: "12px 0",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    background: "var(--bg-tertiary)",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
    marginTop: 16,
    marginBottom: 24,
    transition: "all 0.15s",
  },
  ctaHighlighted: {
    background: "var(--accent)",
    color: "#fff",
    border: "1px solid var(--accent)",
  },
  limitsSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottom: "1px solid var(--border)",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: 10,
  },
  limitRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    padding: "4px 0",
  },
  limitKey: {
    color: "var(--text-secondary)",
  },
  limitValue: {
    fontWeight: 600,
  },
  featuresSection: {},
  featureRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    padding: "4px 0",
  },
  checkmark: {
    color: "var(--success)",
    fontWeight: 700,
    fontSize: 14,
  },
  // Model pricing table
  modelSection: {
    marginBottom: 60,
  },
  modelTitle: {
    fontSize: 22,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 8,
  },
  modelSubtitle: {
    fontSize: 14,
    color: "var(--text-secondary)",
    textAlign: "center",
    marginBottom: 24,
  },
  table: {
    border: "1px solid var(--border)",
    borderRadius: 10,
    overflow: "hidden",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
    background: "var(--bg-tertiary)",
    padding: "12px 16px",
    fontSize: 12,
    fontWeight: 700,
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr 1fr 1fr",
    padding: "12px 16px",
    fontSize: 13,
    borderTop: "1px solid var(--border)",
  },
  tableCell: {
    display: "flex",
    alignItems: "center",
  },
  // FAQ
  faqSection: {
    marginBottom: 40,
  },
  faqGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
    marginTop: 20,
  },
  faqItem: {
    background: "var(--bg-secondary)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "14px 18px",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  faqQuestion: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 14,
    fontWeight: 600,
    gap: 12,
  },
  faqToggle: {
    fontSize: 18,
    color: "var(--text-secondary)",
    fontFamily: "monospace",
    flexShrink: 0,
  },
  faqAnswer: {
    marginTop: 10,
    fontSize: 13,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
  },
};
