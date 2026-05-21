import { React, html } from "./lib.js";
import {
  amenities,
  highlights,
  locationCommuteCards,
  locationHighlights,
  nearbyCategories,
  navItems,
  overviewStats,
  project,
} from "./data.js";

const { useEffect, useRef, useState } = React;

const initialFormState = {
  name: "",
  phone: "",
  interest: "Both",
};

function useIsMobileViewport() {
  const getMatches = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(max-width: 760px)").matches
      : false;

  const [isMobileViewport, setIsMobileViewport] = useState(getMatches);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(max-width: 760px)");
    const onChange = (event) => {
      setIsMobileViewport(event.matches);
    };

    setIsMobileViewport(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onChange);
      return () => mediaQuery.removeEventListener("change", onChange);
    }

    mediaQuery.addListener(onChange);
    return () => mediaQuery.removeListener(onChange);
  }, []);

  return isMobileViewport;
}

function tryInlineAutoplay(videoElement, onPlaybackBlockedChange) {
  if (!videoElement) {
    return;
  }

  videoElement.muted = true;
  videoElement.defaultMuted = true;
  videoElement.playsInline = true;
  videoElement.setAttribute("playsinline", "");

  const playAttempt = videoElement.play();
  if (!playAttempt || typeof playAttempt.then !== "function") {
    onPlaybackBlockedChange(false);
    return;
  }

  playAttempt
    .then(() => {
      onPlaybackBlockedChange(false);
    })
    .catch((error) => {
      if (error?.name !== "AbortError") {
        onPlaybackBlockedChange(true);
      }
    });
}

function createCleanLogoDataUrl(sourcePath) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      const baseCanvas = document.createElement("canvas");
      const baseContext = baseCanvas.getContext("2d", { willReadFrequently: true });

      if (!baseContext) {
        resolve(sourcePath);
        return;
      }

      baseCanvas.width = width;
      baseCanvas.height = height;
      baseContext.drawImage(image, 0, 0, width, height);

      const imageData = baseContext.getImageData(0, 0, width, height);
      const { data } = imageData;

      let minX = width;
      let minY = height;
      let maxX = -1;
      let maxY = -1;

      for (let index = 0; index < data.length; index += 4) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const alpha = data[index + 3];

        const brightness = (red + green + blue) / 3;
        const isNeutral =
          Math.abs(red - green) < 16 &&
          Math.abs(green - blue) < 16 &&
          Math.abs(red - blue) < 16;
        const isLightChecker = alpha > 0 && brightness > 185 && isNeutral;

        if (isLightChecker) {
          data[index + 3] = 0;
          continue;
        }

        if (alpha > 24) {
          const pixel = index / 4;
          const x = pixel % width;
          const y = Math.floor(pixel / width);

          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }

      baseContext.putImageData(imageData, 0, 0);

      if (maxX === -1 || maxY === -1) {
        resolve(baseCanvas.toDataURL("image/png"));
        return;
      }

      const padding = 10;
      const cropX = Math.max(0, minX - padding);
      const cropY = Math.max(0, minY - padding);
      const cropWidth = Math.min(width - cropX, maxX - minX + 1 + padding * 2);
      const cropHeight = Math.min(height - cropY, maxY - minY + 1 + padding * 2);

      const outputCanvas = document.createElement("canvas");
      const outputContext = outputCanvas.getContext("2d");

      if (!outputContext) {
        resolve(baseCanvas.toDataURL("image/png"));
        return;
      }

      outputCanvas.width = cropWidth;
      outputCanvas.height = cropHeight;
      outputContext.drawImage(
        baseCanvas,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      );

      resolve(outputCanvas.toDataURL("image/png"));
    };

    image.onerror = reject;
    image.src = sourcePath;
  });
}

function ButtonLink({ href, label, variant = "primary", external = false, onClick }) {
  return html`
    <a
      className=${`button button--${variant}`}
      href=${href}
      onClick=${onClick}
      target=${external ? "_blank" : undefined}
      rel=${external ? "noreferrer" : undefined}
    >
      ${label}
    </a>
  `;
}

function SectionHeading({ eyebrow, title, copy, align = "left" }) {
  return html`
    <div className=${`section-heading section-heading--${align}`}>
      <span className="section-heading__eyebrow">${eyebrow}</span>
      <h2 className="section-heading__title">${title}</h2>
      ${copy ? html`<p className="section-heading__copy">${copy}</p>` : null}
    </div>
  `;
}

function Navbar({
  scrolled,
  mobileMenuOpen,
  onToggleMenu,
  onCloseMenu,
  onOpenEnquiry,
  logoSrc,
}) {
  return html`
    <header className=${`navbar ${scrolled ? "navbar--scrolled" : ""}`}>
      <div className="section-shell navbar__inner">
        <a className="brand" href="#home" onClick=${onCloseMenu}>
          <span className="brand__mark">
            <img className="brand__logo" src=${logoSrc} alt="Chabbra's Heaven Heights logo" />
          </span>

          <span className="brand__copy">
            <strong className="brand__title">Chabbra's Heaven Heights</strong>
            <span className="brand__tag">Early Access Open</span>
          </span>
        </a>

        <nav className="navbar__desktop" aria-label="Primary">
          <div className="navbar__links">
            ${navItems.map(
              (item) => html`
                <a href=${item.href} onClick=${onCloseMenu}>${item.label}</a>
              `,
            )}
          </div>
          <${ButtonLink}
            href="#enquiry"
            label="Book Early Offer"
            variant="secondary"
            onClick=${onOpenEnquiry}
          />
        </nav>

        <button
          className="nav-toggle"
          type="button"
          aria-label="Toggle menu"
          aria-expanded=${mobileMenuOpen}
          onClick=${onToggleMenu}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div className=${`navbar__mobile ${mobileMenuOpen ? "navbar__mobile--open" : ""}`}>
        <div className="section-shell navbar__mobile-inner">
          ${navItems.map(
            (item) => html`
              <a href=${item.href} onClick=${onCloseMenu}>${item.label}</a>
            `,
          )}
          <${ButtonLink}
            href="#enquiry"
            label="Book Early Offer"
            variant="primary"
            onClick=${onOpenEnquiry}
          />
        </div>
      </div>
    </header>
  `;
}

function EnquiryCard({
  formState,
  formErrors,
  submitted,
  onFieldChange,
  onSubmit,
  nameInputRef,
  highlighted,
}) {
  return html`
    <div className=${`enquiry-card ${highlighted ? "enquiry-card--highlighted" : ""}`}>
      <div className="enquiry-card__ornament"></div>
      <span className="enquiry-card__eyebrow">Enquiry</span>
      <h2 className="enquiry-card__title">Get Project Details</h2>
      <p className="enquiry-card__copy">
        Share your details and our team will contact you with pricing, availability, and booking support.
      </p>

      <form className="enquiry-form" onSubmit=${onSubmit} noValidate>
        <label className="field">
          <span>Name</span>
          <input
            ref=${nameInputRef}
            type="text"
            name="name"
            placeholder="Enter your name"
            value=${formState.name}
            onChange=${onFieldChange}
          />
          ${formErrors.name ? html`<small className="field__error">${formErrors.name}</small>` : null}
        </label>

        <label className="field">
          <span>Phone Number</span>
          <input
            type="tel"
            name="phone"
            inputMode="numeric"
            placeholder="Enter your phone number"
            value=${formState.phone}
            onChange=${onFieldChange}
          />
          ${formErrors.phone ? html`<small className="field__error">${formErrors.phone}</small>` : null}
        </label>

        <label className="field">
          <span>Interested In</span>
          <select name="interest" value=${formState.interest} onChange=${onFieldChange}>
            <option value="2 BHK">2 BHK</option>
            <option value="3 BHK">3 BHK</option>
            <option value="Both">Both</option>
          </select>
        </label>

        <button className="button button--primary enquiry-form__submit" type="submit">
          Request Callback
        </button>
      </form>

      ${submitted
        ? html`
            <p className="form-success">
              Thank you. Your enquiry has been captured and forwarded.
            </p>
          `
        : null}
    </div>
  `;
}

function HeroSection({
  formState,
  formErrors,
  submitted,
  onFieldChange,
  onSubmit,
  onOpenEnquiry,
  enquiryRef,
  nameInputRef,
  enquiryHighlighted,
}) {
  const isMobileViewport = useIsMobileViewport();
  const heroVideoRef = useRef(null);
  const [heroVideoAspectRatio, setHeroVideoAspectRatio] = useState(16 / 9);
  const [heroPlaybackBlocked, setHeroPlaybackBlocked] = useState(false);
  const heroVideoSource = isMobileViewport ? "./entrance.mp4" : "./video.mp4";

  const handleHeroVideoMetadata = (event) => {
    const { videoWidth, videoHeight } = event.currentTarget;
    if (videoWidth > 0 && videoHeight > 0) {
      setHeroVideoAspectRatio(videoWidth / videoHeight);
    }
  };

  const handleHeroPlayRequest = () => {
    tryInlineAutoplay(heroVideoRef.current, setHeroPlaybackBlocked);
  };

  useEffect(() => {
    handleHeroPlayRequest();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleHeroPlayRequest();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [heroVideoSource]);

  return html`
    <section className="hero" id="home">
      <div className="section-shell">
        <div className="hero__top">
          <div className="hero__copy">
            <span className="hero__eyebrow">${project.themeLine}</span>
            <h1 className="hero__title">${project.name}</h1>
            <p className="hero__subtitle">${project.subheading}</p>

            <div className="hero__meta">
              <span className="pill pill--offer">${project.offer}</span>
            </div>

            <div className="hero__cta">
              <${ButtonLink}
                href="#enquiry"
                label="Book Early Offer"
                variant="primary"
                onClick=${onOpenEnquiry}
              />
              <${ButtonLink}
                href="#enquiry"
                label="Request Project Details"
                variant="secondary"
                onClick=${onOpenEnquiry}
              />
            </div>

            <div className="hero__contact">
              <span>Call: <strong>${project.contactDisplay}</strong></span>
              <a className="hero__text-link" href=${project.callHref}>Tap to call directly</a>
            </div>

            <p className="hero__note">
              "Premium living, elevated everyday."
            </p>
          </div>

          <div className="hero__form-shell" id="enquiry" ref=${enquiryRef}>
            <${EnquiryCard}
              formState=${formState}
              formErrors=${formErrors}
              submitted=${submitted}
              onFieldChange=${onFieldChange}
              onSubmit=${onSubmit}
              nameInputRef=${nameInputRef}
              highlighted=${enquiryHighlighted}
            />
          </div>
        </div>

        <div className="hero__visual-frame card-frame" style=${{ "--hero-video-ratio": `${heroVideoAspectRatio}` }}>
          <span className="visual-tag">Project Visual</span>
          <video
            ref=${heroVideoRef}
            key=${heroVideoSource}
            className="hero__media"
            autoPlay
            muted
            defaultMuted
            loop
            playsInline
            preload="metadata"
            poster="./apartment.png"
            onLoadedMetadata=${handleHeroVideoMetadata}
            onCanPlay=${handleHeroPlayRequest}
          >
            <source src=${heroVideoSource} type="video/mp4" />
          </video>

          ${heroPlaybackBlocked
            ? html`
                <button className="video-play-fallback" type="button" onClick=${handleHeroPlayRequest}>
                  Tap To Play Video
                </button>
              `
            : null}

          <div className="hero__veil"></div>

          <div className="hero__visual-copy">
            <span className="mini-label">Signature Arrival</span>
            <strong>"A grand welcome to elevated living."</strong>
            <p>
              Designed to create a premium first impression from the moment you enter.
            </p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function HighlightStrip() {
  return html`
    <section className="highlight-strip">
      <div className="section-shell">
        <div className="highlight-strip__rail">
          ${highlights.map(
            (item) => html`
              <div className="highlight-pill">
                <span className="highlight-pill__diamond"></span>
                <span>${item}</span>
              </div>
            `,
          )}
        </div>
      </div>
    </section>
  `;
}

function OverviewSection() {
  const isMobileViewport = useIsMobileViewport();
  const entranceVideo = isMobileViewport ? "./entrance2.mp4" : "./final.mp4";
  const overviewVideoRef = useRef(null);
  const [overviewPlaybackBlocked, setOverviewPlaybackBlocked] = useState(false);
  const [entranceAspectRatio, setEntranceAspectRatio] = useState(16 / 9);

  const handleEntranceVideoMetadata = (event) => {
    const { videoWidth, videoHeight } = event.currentTarget;
    if (videoWidth > 0 && videoHeight > 0) {
      setEntranceAspectRatio(videoWidth / videoHeight);
    }
  };

  const handleOverviewPlayRequest = () => {
    tryInlineAutoplay(overviewVideoRef.current, setOverviewPlaybackBlocked);
  };

  useEffect(() => {
    handleOverviewPlayRequest();
  }, [entranceVideo]);

  return html`
    <section className="section section--overview" id="overview">
      <div className="section-shell">
        <${SectionHeading}
          eyebrow="Project Overview"
          title="A New Landmark Rising in Saheb Nagar"
          copy="Chabbra's Heaven Heights brings together premium planning, quality construction, and practical family living at Saheb Nagar, Vanasthalipuram."
        />

        <div className="overview-layout">
          <div className="overview-showcase card-frame" style=${{ "--overview-video-ratio": `${entranceAspectRatio}` }}>
            <video
              ref=${overviewVideoRef}
              key=${entranceVideo}
              className="overview-showcase__image"
              autoPlay
              muted
              defaultMuted
              loop
              playsInline
              preload="metadata"
              poster="./entrance.png"
              onLoadedMetadata=${handleEntranceVideoMetadata}
              onCanPlay=${handleOverviewPlayRequest}
            >
              <source src=${entranceVideo} type="video/mp4" />
            </video>

            ${overviewPlaybackBlocked
              ? html`
                  <button className="video-play-fallback video-play-fallback--overview" type="button" onClick=${handleOverviewPlayRequest}>
                    Tap To Play Video
                  </button>
                `
              : null}
          </div>

          <div className="stats-grid">
            ${overviewStats.map(
              (item) => html`
                <article className="stat-card">
                  <span className="stat-card__label">${item.label}</span>
                  <strong className="stat-card__value">${item.value}</strong>
                </article>
              `,
            )}
          </div>
        </div>
      </div>
    </section>
  `;
}

function OfferSection({ onOpenEnquiry }) {
  return html`
    <section className="section section--compact">
      <div className="section-shell">
        <div className="offer-band card-frame">
          <div className="offer-band__copy">
            <${SectionHeading}
              eyebrow="Early Offer"
              title="Early Access. Early Advantage."
              copy="Register now to receive pricing, availability, and booking support from our team."
            />
          </div>

          <div className="offer-card">
            <span className="offer-card__eyebrow">Pre-launch pricing</span>
            <strong className="offer-card__value">${project.offerShort}</strong>
            <${ButtonLink}
              href="#enquiry"
              label="Unlock Early Offer"
              variant="primary"
              onClick=${onOpenEnquiry}
            />
          </div>
        </div>
      </div>
    </section>
  `;
}

function AmenitiesSection() {
  return html`
    <section className="section section--tinted" id="amenities">
      <div className="section-shell">
        <${SectionHeading}
          eyebrow="Amenities"
          title="Premium Living, Elevated Everyday"
          copy="A complete gated community lifestyle with recreation, wellness, and family-focused spaces."
        />

        <div className="amenities-layout">
          <div className="amenities-visuals">
            <img src="./pool.png" alt="Swimming pool" className="amenities-visual amenities-visual--hero card-frame" />
            <img
              src="./chabbras_clubhouse_exact_image.png"
              alt="Clubhouse"
              className="amenities-visual amenities-visual--clubhouse card-frame"
            />
          </div>

          <article className="amenities-content card-frame">
            <span className="mini-label">34,000 Sft Amenity Area</span>
            <h3>Designed for leisure, fitness, and everyday comfort</h3>
            <p>
              Every zone is planned to support active living, social connection, and family convenience.
            </p>

            <div className="amenity-list">
              ${amenities.map(
                (item) => html`
                  <div className="amenity-list__item">
                    <span className="amenity-list__dot"></span>
                    <span>${item}</span>
                  </div>
                `,
              )}
            </div>
          </article>
        </div>
      </div>
    </section>
  `;
}

function MasterPlanSection({ onOpenEnquiry }) {
  return html`
    <section className="section" id="master-plan">
      <div className="section-shell">
        <div className="masterplan-layout">
          <div className="masterplan-copy">
            <${SectionHeading}
              eyebrow="Master Plan"
              title="A Thoughtfully Planned Gated Community"
              copy="The master plan organizes towers, open spaces, circulation, and amenities into one efficient community layout."
            />

            <p className="support-copy">
              View the complete layout plan below.
            </p>
            <${ButtonLink}
              href="#enquiry"
              label="View Master Plan"
              variant="secondary"
              onClick=${onOpenEnquiry}
            />
          </div>

          <div className="masterplan-board card-frame" aria-label="Master plan board">
            <img
              src="./master_plan_final_exact.png"
              alt="Master plan layout for Chabbra's Heaven Heights"
              className="masterplan-board__image"
            />
          </div>
        </div>
      </div>
    </section>
  `;
}

function LocationSection() {
  const [activeNearbyKey, setActiveNearbyKey] = useState(nearbyCategories[0]?.key || "education");
  const activeNearbyCategory =
    nearbyCategories.find((category) => category.key === activeNearbyKey) || nearbyCategories[0];

  return html`
    <section className="section section--compact" id="location">
      <div className="section-shell">
        <div className="location-layout">
          <div className="map-panel card-frame">
            <div className="map-frame">
              <iframe
                title="Chabbra's Heaven Heights map location"
                src=${project.mapEmbedHref}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

            <div className="map-panel__footer">
              <span className="mini-label">Exact Site Pin</span>
              <p>Mapped to the exact coordinates you shared for the project location.</p>
              <${ButtonLink}
                href=${project.mapsHref}
                label="Open in Maps"
                variant="secondary"
                external=${true}
              />
            </div>
          </div>

          <div className="location-panel">
            <${SectionHeading}
              eyebrow="Location"
              title="Located at Saheb Nagar, Vanasthalipuram"
              copy="A well-connected residential address for families seeking convenience, comfort, and long-term value."
            />

            <div className="location-card card-frame">
              <span className="mini-label">Residential Address</span>
              <strong>${project.type}</strong>
              <p className="location-card__address">${project.location}</p>

              <div className="feature-list">
                ${locationHighlights.map(
                  (item) => html`
                    <div className="feature-list__item">
                      <span className="feature-list__mark"></span>
                      <span>${item}</span>
                    </div>
                  `,
                )}
              </div>

              <div className="location-actions">
                <${ButtonLink} href=${project.callHref} label="Call Now" variant="primary" />
                <${ButtonLink} href=${project.whatsappHref} label="WhatsApp" variant="secondary" external=${true} />
              </div>
            </div>
          </div>
        </div>

        <div className="connectivity-showcase">
          <div className="connectivity-cards">
            ${locationCommuteCards.map(
              (item) => html`
                <article className="connectivity-card card-frame" key=${item.title}>
                  <span className="connectivity-card__mins">${item.mins}</span>
                  <span className="connectivity-card__unit">Mins</span>
                  <strong>${item.title}</strong>
                  <p>${item.type}</p>
                </article>
              `,
            )}
          </div>

          <div className="nearby-panel card-frame">
            <div className="nearby-tabs" role="tablist" aria-label="Nearby categories">
              ${nearbyCategories.map(
                (category) => html`
                  <button
                    key=${category.key}
                    type="button"
                    role="tab"
                    aria-selected=${activeNearbyKey === category.key}
                    className=${`nearby-tab ${activeNearbyKey === category.key ? "nearby-tab--active" : ""}`}
                    onClick=${() => setActiveNearbyKey(category.key)}
                  >
                    ${category.label}
                  </button>
                `,
              )}
            </div>

            <div className="nearby-grid">
              ${activeNearbyCategory.items.map(
                (item) => html`
                  <article className="nearby-item" key=${item.name}>
                    <span className="nearby-item__name">${item.name}</span>
                    <span className="nearby-item__time">${item.time}</span>
                  </article>
                `,
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function DeveloperSection({ logoSrc }) {
  return html`
    <section className="section section--compact">
      <div className="section-shell">
        <div className="developer-card card-frame">
          <img src=${logoSrc} alt="Chabbra's Group logo" className="developer-card__logo" />
          <div className="developer-card__copy">
            <${SectionHeading}
              eyebrow="Developer"
              title="By Chabbra's Group"
              copy="Chabbra's Group delivers residential and commercial developments with a focus on quality, design, and dependable execution."
            />
          </div>
        </div>
      </div>
    </section>
  `;
}

function FinalCTASection({ onOpenEnquiry }) {
  return html`
    <section className="section" id="contact">
      <div className="section-shell">
        <div className="final-cta card-frame">
          <div className="final-cta__copy">
            <${SectionHeading}
              eyebrow="Contact"
              title="Book Your Early Interest Today"
              copy="Register your interest and our team will share project details, availability, pricing, and booking assistance."
            />
          </div>

          <div className="final-cta__actions">
            <${ButtonLink} href=${project.callHref} label="Call 9490491006" variant="primary" />
            <${ButtonLink} href=${project.whatsappHref} label="WhatsApp Now" variant="secondary" external=${true} />
            <${ButtonLink}
              href="#enquiry"
              label="Get Project Details"
              variant="ghost"
              onClick=${onOpenEnquiry}
            />
          </div>
        </div>
      </div>
    </section>
  `;
}

function Footer() {
  return null;
}

export function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [logoSrc, setLogoSrc] = useState("./injapur_logo.png");
  const [enquiryHighlighted, setEnquiryHighlighted] = useState(false);

  const enquiryRef = useRef(null);
  const nameInputRef = useRef(null);
  const enquiryHighlightTimerRef = useRef(null);

  useEffect(() => {
    createCleanLogoDataUrl("./injapur_logo.png")
      .then((nextLogoSrc) => setLogoSrc(nextLogoSrc))
      .catch(() => setLogoSrc("./injapur_logo.png"));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (enquiryHighlightTimerRef.current) {
        window.clearTimeout(enquiryHighlightTimerRef.current);
      }
    };
  }, []);

  const closeMenu = () => setMobileMenuOpen(false);

  const openEnquiry = (event) => {
    if (event) {
      event.preventDefault();
    }

    closeMenu();
    setSubmitted(false);
    setFormErrors({});
    setEnquiryHighlighted(true);

    if (enquiryHighlightTimerRef.current) {
      window.clearTimeout(enquiryHighlightTimerRef.current);
    }

    enquiryHighlightTimerRef.current = window.setTimeout(() => {
      setEnquiryHighlighted(false);
    }, 1800);

    enquiryRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    window.setTimeout(() => {
      nameInputRef.current?.focus();
    }, 320);
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setFormState((current) => ({
      ...current,
      [name]: value,
    }));

    setFormErrors((current) => ({
      ...current,
      [name]: "",
    }));

    if (submitted) {
      setSubmitted(false);
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formState.name.trim()) {
      nextErrors.name = "Please enter your name.";
    }

    const digitsOnly = formState.phone.replace(/\D/g, "");
    if (!digitsOnly) {
      nextErrors.phone = "Please enter your phone number.";
    } else if (digitsOnly.length < 10) {
      nextErrors.phone = "Phone number must have at least 10 digits.";
    }

    return nextErrors;
  };

  const formatInquiryMessage = (payload) => {
    const submittedOn = new Date(payload.submittedAt).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    return [
      `New enquiry for ${payload.project}`,
      `Name: ${payload.name}`,
      `Phone: ${payload.phone}`,
      `Interested In: ${payload.interest}`,
      `Submitted: ${submittedOn}`,
    ].join("\n");
  };

  const sendWhatsAppLead = (payload) => {
    const cleanPhone = project.phone.replace(/\D/g, "");
    const phoneWithCountryCode = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const whatsappUrl = `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(formatInquiryMessage(payload))}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const sendLeadToEndpoint = async (payload) => {
    if (!project.inquiryEndpoint) {
      return false;
    }

    try {
      const response = await fetch(project.inquiryEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (error) {
      console.error("Lead endpoint delivery failed", error);
      return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      setSubmitted(false);
      return;
    }

    const payload = {
      ...formState,
      project: project.name,
      submittedAt: new Date().toISOString(),
    };

    console.log("Pre-launch enquiry", payload);
    const deliveredToEndpoint = await sendLeadToEndpoint(payload);

    if (!deliveredToEndpoint) {
      sendWhatsAppLead(payload);
    }

    setSubmitted(true);
    setFormErrors({});
    setFormState(initialFormState);
  };

  return html`
    <div className="site-shell">
      <${Navbar}
        scrolled=${navScrolled}
        mobileMenuOpen=${mobileMenuOpen}
        onToggleMenu=${() => setMobileMenuOpen((current) => !current)}
        onCloseMenu=${closeMenu}
        onOpenEnquiry=${openEnquiry}
        logoSrc=${logoSrc}
      />
      <main>
        <${HeroSection}
          formState=${formState}
          formErrors=${formErrors}
          submitted=${submitted}
          onFieldChange=${handleFieldChange}
          onSubmit=${handleSubmit}
          onOpenEnquiry=${openEnquiry}
          enquiryRef=${enquiryRef}
          nameInputRef=${nameInputRef}
          enquiryHighlighted=${enquiryHighlighted}
        />
        <${HighlightStrip} />
        <${OverviewSection} />
        <${OfferSection} onOpenEnquiry=${openEnquiry} />
        <${AmenitiesSection} />
        <${MasterPlanSection} onOpenEnquiry=${openEnquiry} />
        <${LocationSection} />
        <${DeveloperSection} logoSrc=${logoSrc} />
        <${FinalCTASection} onOpenEnquiry=${openEnquiry} />
      </main>
      <${Footer} />
    </div>
  `;
}
