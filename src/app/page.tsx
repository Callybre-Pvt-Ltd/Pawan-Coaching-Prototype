import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { DashboardPreview } from "@/components/dashboard-preview";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDb } from "@/db";
import { centerSettings } from "@/db/schema";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const benefits = [
  {
    icon: GraduationCap,
    title: "Focused teaching",
    body: "Structured classroom learning designed to make every concept easier to understand and apply.",
  },
  {
    icon: Users,
    title: "Personal attention",
    body: "Clear progress visibility helps tutors stay attentive to every learner and every batch.",
  },
  {
    icon: CheckCircle2,
    title: "Consistent progress",
    body: "Attendance, schedules, and fee records stay organized so learning can remain the priority.",
  },
];

export default async function Home() {
  const [center] = process.env.DATABASE_URL
    ? await getDb().select().from(centerSettings).limit(1)
    : [];
  return (
    <main>
      <header className="landing-header">
        <nav
          className="container-shell landing-nav"
          aria-label="Primary navigation"
        >
          <Brand />
          <div className="nav-links">
            <a href="#about">About</a>
            <a href="#subjects">Subjects</a>
            <a href="#contact">Contact</a>
            <ThemeToggle />
            <Link className="btn btn-primary" href="/login">
              Sign in <ArrowRight size={17} />
            </Link>
          </div>
        </nav>
      </header>

      <section className="hero">
        <div className="container-shell hero-grid">
          <div>
            <h1>
              Build a stronger <span>academic foundation.</span>
            </h1>
            <p className="hero-copy">
              Thoughtful coaching in Commerce and English, supported by a
              focused digital experience for students, tutors, and the center.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/login">
                Enter your portal <ArrowRight size={18} />
              </Link>
              <a className="btn btn-secondary" href="#subjects">
                Explore classes
              </a>
            </div>
            <div className="hero-note">
              <span className="dot" /> Dedicated learning. Organized progress.
              One trusted center.
            </div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      <section id="about" className="section alt">
        <div className="container-shell">
          <div className="section-heading">
            <span className="eyebrow">Why learn with us</span>
            <h2>Serious learning, made clear and approachable.</h2>
            <p>
              Final coaching-center copy will replace this approved structural
              placeholder before launch. The experience is designed around
              clarity, consistency, and a warm academic environment.
            </p>
          </div>
          <div className="card-grid">
            {benefits.map(({ icon: Icon, title, body }) => (
              <article className="feature-card" key={title}>
                <span className="feature-icon">
                  <Icon size={21} />
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="subjects" className="section">
        <div className="container-shell">
          <div className="section-heading">
            <span className="eyebrow">What we teach</span>
            <h2>Two disciplines. One standard of excellence.</h2>
            <p>
              Purposeful instruction that builds subject knowledge,
              communication skills, and confidence.
            </p>
          </div>
          <div className="subject-grid">
            <article className="subject-card surface">
              <span className="feature-icon">
                <BookOpen size={22} />
              </span>
              <h3>Commerce</h3>
              <p>
                Concept-led guidance for students who want to understand the
                logic behind accounting, business, and economics.
              </p>
              <span className="subject-index" aria-hidden="true">
                01
              </span>
            </article>
            <article className="subject-card surface">
              <span className="feature-icon">
                <GraduationCap size={22} />
              </span>
              <h3>English</h3>
              <p>
                Supportive English learning focused on comprehension,
                expression, structure, and confident communication.
              </p>
              <span className="subject-index" aria-hidden="true">
                02
              </span>
            </article>
          </div>
        </div>
      </section>

      <section id="contact" className="section">
        <div className="container-shell contact-panel surface">
          <div className="contact-copy">
            <span className="eyebrow">Get in touch</span>
            <h2>Ready to learn with purpose?</h2>
            <p>
              {center?.setupComplete
                ? `Contact ${center.name} to learn more about current programs.`
                : "Contact details will be completed by the administrator during first-time setup."}
            </p>
          </div>
          <div className="contact-details">
            <div className="contact-item">
              <Phone size={21} />
              <div>
                <b>Phone number</b>
                <span>
                  {center?.phone ?? "Center phone number will appear here"}
                </span>
              </div>
            </div>
            <div className="contact-item">
              <MapPin size={21} />
              <div>
                <b>Coaching center address</b>
                <span>
                  {center?.address ?? "Center address will appear here"}
                </span>
              </div>
            </div>
            <Link className="btn btn-primary contact-sign-in" href="/login">
              <span className="contact-sign-in-full">
                Existing student or tutor? Sign in
              </span>
              <span className="contact-sign-in-short">Sign in</span>
            </Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container-shell footer-row">
          <a
            className="footer-powered-by"
            href="https://callybre.com/"
            target="_blank"
            rel="noreferrer"
          >
            Powered by <strong>Callybre</strong>
          </a>
          <span>
            © {new Date().getFullYear()} Pawan Sir Commerce &amp; English
            Classes
          </span>
        </div>
      </footer>
    </main>
  );
}
