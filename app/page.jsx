"use client";

import { CheckCircle2, ShieldCheck, Bot, BookOpen, Phone, Calendar, MousePointerClick, Star } from "lucide-react";
import { motion } from "framer-motion";
import "./globals.css";

function Badge({ children }){
  return <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">{children}</span>;
}

function Section({ id, className="", children }){
  return <section id={id} className={`w-full py-16 md:py-24 ${className}`}>{children}</section>;
}

function Container({ className="", children }){
  return <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export default function Page(){
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-slate-100">
        <Container className="flex h-16 items-center justify-between">
          <a href="#home" className="text-xl font-semibold tracking-tight">
            <span className="text-slate-900">AI</span>
            <span className="text-emerald-600">Assist</span>
            <span className="text-slate-900">.biz</span>
          </a>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#services" className="text-sm text-slate-600 hover:text-slate-900">Services</a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900">Pricing</a>
            <a href="#results" className="text-sm text-slate-600 hover:text-slate-900">Results</a>
            <a href="#how" className="text-sm text-slate-600 hover:text-slate-900">How it works</a>
            <a href="#contact" className="text-sm text-slate-600 hover:text-slate-900">Contact</a>
            <a href="#book" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800">Book Demo</a>
          </div>
        </Container>
      </nav>

      {/* Hero */}
      <Section id="home" className="bg-gradient-to-b from-white to-slate-50">
        <Container>
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <Badge>14‑day delivery • ADA • AI Receptionist • AI Knowledgebase</Badge>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
                Protect. Automate. <span className="text-emerald-600">Scale</span>.
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                We make small businesses compliant, convert every missed lead with a 24/7 AI receptionist, and turn your documents into an AI expert.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a href="#ada-audit" className="rounded-xl bg-emerald-600 px-6 py-3 text-white shadow-sm hover:bg-emerald-500">Run Free ADA Audit</a>
                <a href="#book" className="rounded-xl border border-slate-200 px-6 py-3 text-slate-900 shadow-sm hover:bg-white/60">Book a Free Demo</a>
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4"/> No code for you</div>
                <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4"/> Cancel anytime</div>
                <div className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4"/> U.S. based</div>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-emerald-100 via-white to-transparent blur-2xl"></div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4 shadow-sm bg-white">
                  <div className="font-semibold flex items-center gap-2 mb-1"><ShieldCheck className="h-5 w-5"/> ADA Shield</div>
                  <div className="text-sm text-slate-600">Automated scan → quick fixes → verification badge for your footer.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 shadow-sm bg-white">
                  <div className="font-semibold flex items-center gap-2 mb-1"><Bot className="h-5 w-5"/> AI Receptionist</div>
                  <div className="text-sm text-slate-600">Answers calls/chats 24/7, qualifies leads, and books meetings.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4 shadow-sm bg-white md:col-span-2">
                  <div className="font-semibold flex items-center gap-2 mb-1"><BookOpen className="h-5 w-5"/> Docs → AI Knowledgebase</div>
                  <div className="text-sm text-slate-600">Upload PDFs, SOPs, FAQs. Your branded AI answers with citations.</div>
                </div>
              </div>
            </motion.div>
          </div>
        </Container>
      </Section>

      {/* Services */}
      <Section id="services">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">How we future‑proof your business</h2>
            <p className="mt-3 text-slate-600">Compliance. Conversion. Intelligence. Delivered fast.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2"><ShieldCheck className="h-5 w-5"/> ADA Web Compliance</div>
              <p className="mt-3 text-slate-600">Scan + fix key issues. Add an accessibility widget. Publish a verification badge.</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> Contrast & headings</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> Keyboard nav & forms</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> Monthly rescan report</li>
              </ul>
              <div className="pt-3"><a href="#ada-audit" className="text-emerald-600 hover:underline">Run free audit →</a></div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2"><Bot className="h-5 w-5"/> AI Receptionist</div>
              <p className="mt-3 text-slate-600">Answer calls/texts/chats 24/7. Qualify, route, and book appointments automatically.</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> CRM + calendar integration</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> Multi‑language support</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> After‑hours capture boost</li>
              </ul>
              <div className="pt-3"><a href="#book" className="text-emerald-600 hover:underline">See live demo →</a></div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2"><BookOpen className="h-5 w-5"/> Docs → AI Knowledgebase</div>
              <p className="mt-3 text-slate-600">Turn PDFs, SOPs, and FAQs into an AI assistant that answers with citations.</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> Embed on site or portal</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> Deflect repetitive tickets</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> Monthly content refresh</li>
              </ul>
              <div className="pt-3"><a href="#kb-demo" className="text-emerald-600 hover:underline">Try it now →</a></div>
            </div>
          </div>
        </Container>
      </Section>

      {/* Pricing */}
      <Section id="pricing" className="bg-slate-50">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Simple, scalable pricing</h2>
            <p className="mt-3 text-slate-600">Start with one, scale to all three. Cancel anytime.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="text-xl font-bold">Launch</div>
              <div className="text-3xl font-bold mt-1">$97<span className="text-base font-medium text-slate-500">/mo</span></div>
              <div className="mt-1 text-sm text-slate-500">+ $497 setup</div>
              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> ADA scan & fix plan</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> Accessibility widget</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> Badge + monthly report</li>
              </ul>
              <a href="#ada-audit" className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-800">Start Free Audit</a>
            </div>
            <div className="rounded-2xl border-2 border-emerald-500 p-6 shadow-sm bg-white">
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold">Automate</div>
                <Badge>Most Popular</Badge>
              </div>
              <div className="text-3xl font-bold mt-1">$197<span className="text-base font-medium text-slate-500">/mo</span></div>
              <div className="mt-1 text-sm text-slate-500">+ $997 setup</div>
              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> Everything in Launch</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> 24/7 receptionist (voice/chat/SMS)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> CRM + calendar booking</li>
              </ul>
              <a href="#book" className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-500">Book a Demo</a>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="text-xl font-bold">Scale</div>
              <div className="text-3xl font-bold mt-1">$497<span className="text-base font-medium text-slate-500">/mo</span></div>
              <div className="mt-1 text-sm text-slate-500">+ $1497 setup</div>
              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> Everything in Automate</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> Docs → AI knowledgebase</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600"/> Custom dashboard + SLAs</li>
              </ul>
              <a href="#apply" className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 hover:bg-white/60">Apply for Onboarding</a>
            </div>
          </div>
        </Container>
      </Section>

      {/* Results */}
      <Section id="results">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Results that speak</h2>
            <p className="mt-3 text-slate-600">Case studies and real outcomes from small businesses like yours.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2"><ShieldCheck className="h-5 w-5"/> Dental Clinic</div>
              <p className="mt-2 text-sm text-slate-700"><strong>ADA Risk → 0</strong> within 72 hours. +12% organic traffic after accessibility fixes.</p>
              <div className="flex items-center gap-1 text-amber-500 mt-2"><Star className="h-4 w-4"/><Star className="h-4 w-4"/><Star className="h-4 w-4"/><Star className="h-4 w-4"/><Star className="h-4 w-4"/></div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2"><Bot className="h-5 w-5"/> Roofing Company</div>
              <p className="mt-2 text-sm text-slate-700"><strong>+42% more booked jobs</strong> with 24/7 AI receptionist catching after‑hours calls.</p>
              <div className="flex items-center gap-1 text-amber-500 mt-2"><Star className="h-4 w-4"/><Star className="h-4 w-4"/><Star className="h-4 w-4"/><Star className="h-4 w-4"/><Star className="h-4 w-4"/></div>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2"><BookOpen className="h-5 w-5"/> B2B Agency</div>
              <p className="mt-2 text-sm text-slate-700"><strong>-55% support time</strong> after docs → AI knowledgebase deflected repetitive Qs.</p>
              <div className="flex items-center gap-1 text-amber-500 mt-2"><Star className="h-4 w-4"/><Star className="h-4 w-4"/><Star className="h-4 w-4"/><Star className="h-4 w-4"/><Star className="h-4 w-4"/></div>
            </div>
          </div>
        </Container>
      </Section>

      {/* How It Works */}
      <Section id="how" className="bg-slate-50">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Plug & play in 3 steps</h2>
            <p className="mt-3 text-slate-600">We handle the heavy lifting. You get results.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2"><MousePointerClick className="h-5 w-5"/> 1) Scan & Audit</div>
              <p className="text-slate-600 mt-2">Run a free ADA audit or book a demo. We record a 90‑sec Loom with findings.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2"><Phone className="h-5 w-5"/> 2) Deploy & Configure</div>
              <p className="text-slate-600 mt-2">We install the widget, AI receptionist, and knowledgebase with your brand.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-6 shadow-sm bg-white">
              <div className="font-semibold flex items-center gap-2"><Calendar className="h-5 w-5"/> 3) Optimize & Scale</div>
              <p className="text-slate-600 mt-2">Monthly reports and tweaks. Add channels and docs as you grow.</p>
            </div>
          </div>
        </Container>
      </Section>

      {/* Contact */}
      <Section id="contact">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Let’s get your systems online</h2>
            <p className="mt-3 text-slate-600">Tell us about your business. We’ll reply with a quick Loom and next steps.</p>
          </div>
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <form onSubmit={(e)=>{e.preventDefault(); alert('Form submitted (demo). Connect to your backend or Zapier).');}} className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-1">
                <label className="text-sm text-slate-700">Name</label>
                <input required placeholder="Jane Doe" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="md:col-span-1">
                <label className="text-sm text-slate-700">Email</label>
                <input type="email" required placeholder="jane@company.com" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-700">Website URL</label>
                <input type="url" required placeholder="https://example.com" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-slate-700">Message</label>
                <textarea rows={4} placeholder="What do you want to achieve in the next 30 days?" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="md:col-span-2 flex items-center justify-between">
                <div className="text-xs text-slate-500">By submitting, you agree to our terms & privacy.</div>
                <button type="submit" className="rounded-xl bg-slate-900 px-6 py-2 text-white">Send</button>
              </div>
            </form>
          </div>
        </Container>
      </Section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <Container className="flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
          <div className="text-sm text-slate-500">© {new Date().getFullYear()} AI Assist — All rights reserved.</div>
          <div className="flex items-center gap-4 text-sm">
            <a href="#" className="text-slate-600 hover:text-slate-900">Terms</a>
            <a href="#" className="text-slate-600 hover:text-slate-900">Privacy</a>
            <a href="#" className="text-slate-600 hover:text-slate-900">Accessibility</a>
          </div>
        </Container>
      </footer>
    </div>
  );
}
