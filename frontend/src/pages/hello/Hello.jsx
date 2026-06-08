import { useNavigate } from "react-router-dom";
import styles from "./Hello.module.css";

const Hello = () => {
  const navigate = useNavigate();

  const handleNavigateToLogin = () => {
    navigate("/login");
  };

  const handleNavigateToSignup = () => {
    navigate("/signup");
  };

  const handleScrollToHowItWorks = (e) => {
    e.preventDefault();
    {
      /* Top Navbar */
    }

    const element = document.getElementById("how-it-works-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className={styles["landing-container"]}>
      <nav className={styles["navbar"]}>
        <div className={styles["logo-container"]}>
          <div className={styles["logo-icon"]}>
            <span className={`${styles["leaf"]} ${styles["leaf-1"]}`}>🍃</span>
            <span className={`${styles["leaf"]} ${styles["leaf-2"]}`}>🍂</span>
          </div>
          <span className={styles["logo-text"]}>EventRoots</span>
        </div>
        <div className={styles["nav-actions"]}>
          <button
            className={styles["btn-secondary"]}
            onClick={handleNavigateToLogin}
          >
            Sign in
          </button>
          <button
            className={styles["btn-primary"]}
            onClick={handleNavigateToSignup}
          >
            Create an account
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className={styles["hero-section"]}>
        <div className={styles["hero-text-content"]}>
          <h1 className={styles["hero-title"]}>
            AI-powered event planning <br />
            <span className={styles["highlight-text"]}>
              rooted in tradition.
            </span>
          </h1>
          <p className={styles["hero-description"]}>
            Simplify complex event planning while keeping your cultural customs
            intact. From weddings to funerals, get personalized guidance,
            structured workflows, and smart vendor matches tailored to your
            community.
          </p>
          <div className={styles["hero-cta-group"]}>
            <button
              className={`${styles["btn-primary"]} ${styles["btn-large"]}`}
              onClick={handleNavigateToSignup}
            >
              Create an account
            </button>
            <button
              className={`${styles["btn-secondary"]} ${styles["btn-large"]}`}
              onClick={handleScrollToHowItWorks}
            >
              How it works
            </button>
          </div>
        </div>
      </header>

      {/* How it Works / Core Sequence Intro Section */}
      <section id="how-it-works-section" className={styles["how-section"]}>
        <h2 className={styles["section-title"]}>How EventRoots Operates</h2>
        <div className={styles["steps-grid"]}>
          <div className={styles["step-card"]}>
            <h3>1. Create Your Profile</h3>
            <p>
              Tell us your location, religion, and community backgrounds so the
              platform saves your parameters automatically.
            </p>
          </div>
          <div className={styles["step-card"]}>
            <h3>2. Create an Event</h3>
            <p>
              Initialize your container for a Wedding, Funeral, Birthday, Naming
              Ceremony, or other custom family occasions.
            </p>
          </div>
          <div className={styles["step-card"]}>
            <h3>3. Talk to EventGPT</h3>
            <p>
              Engage with our AI assistant to receive structured, customized
              checklists, chronological timelines, and cultural guidance.
            </p>
          </div>
          <div className={styles["step-card"]}>
            <h3>4. Review Event Flow</h3>
            <p>
              See the complete sequence of structured activities organized
              cleanly inside your management workspace framework.
            </p>
          </div>
          <div className={styles["step-card"]}>
            <h3>5. Explore Sample Vendors</h3>
            <p>
              Browse pre-seeded baseline vendor profiles automatically
              categorized and matched according to your exact requirements.
            </p>
          </div>
          <div className={styles["step-card"]}>
            <h3>6. Track Progress</h3>
            <p>
              Monitor real-time task log completion percentages directly from
              your core interactive system dashboard control unit.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features Overview */}
      <section className={styles["features-section"]}>
        <h2 className={styles["section-title"]}>
          Designed for Seamless Planning
        </h2>
        <div className={styles["features-grid"]}>
          <div
            className={`${styles["feature-card"]} ${styles["highlighted-card"]}`}
          >
            <div className={styles["card-badge"]}>CORE FEATURE</div>
            <h3>Intelligent Chat</h3>
            <p>
              Engage with our conversational AI initialized directly with your
              cultural preferences and scope. Ask infinite follow-up questions
              without re-entering details.
            </p>
          </div>
          <div className={styles["feature-card"]}>
            <h3>Cultural Personalization</h3>
            <p>
              From a Hindu wedding in Kerala to a Christian wedding in Goa, our
              system respects and aligns with your exact regional customs and
              community templates.
            </p>
          </div>
          <div className={styles["feature-card"]}>
            <h3>Dynamic Workflow & Vendors</h3>
            <p>
              Automatically maps your plan to necessary operational vendor
              categories and reviews matching sample providers from our internal
              repository.
            </p>
          </div>
        </div>
      </section>

      {/* Sticky Bottom Bar / Minimal Footer */}
      <footer className={styles["footer-bar"]}>
        <div className={styles["footer-left"]}>
          <span>© 2026 EventRoots MVP. All rights reserved.</span>
          <span className={styles["internship-tag"]}>Dcube Intern Project</span>
        </div>
      </footer>
    </div>
  );
};

export default Hello;
