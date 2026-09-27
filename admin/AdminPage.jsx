import React, { useState, useRef, useEffect } from "react";
import "./AdminPage.css";
import {
  Bell,
  Zap,
  Camera,
  Settings,
  Sun,
  Moon,
  Plus,
  Upload,
  X,
} from "lucide-react";
const FEED_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAtg6Na3IGRjOI1scZjqBzH5JMVpG2Kl9MfQs-IJvoGsBROG3G9e0xBRORbW15PPumM_9T5EWCtvQgKsOkAt01zpYszjw6Lm3yl2YK7Lvrh61nBXalYbbmH7fPDrGeU7qMMisrNNlWgG5XdvcWMvv5CH_K2q8FaIbiuoeco5758qf-iiqxGoOFgtaQ38STIQUW2xiuskFPZinB-pg8t2oZExerEyjOmfIKQEppU_DcbOOrPxjd2P6P1";

const PRESETS = [
  {
    label: "Red Bag Alert",
    rule: "Alert if someone is carrying a red bag or red backpack into the lobby",
  },
  {
    label: "Bicycle Indoors",
    rule: "Flag any bicycle, scooter, or wheeled vehicle brought indoors",
  },
  {
    label: "Unattended Package >3m",
    rule: "Notify if package or unattended luggage left stationary > 3 minutes",
  },
  {
    label: "Pet Without Leash",
    rule: "Detect any dog or domestic pet entering without a leash",
  },
];

const INCIDENTS = [
  {
    id: "evt_01",
    severity: "critical",
    badge: "MATCH CONFIRMED • 98% AI",
    time: "Just now (10:45:32 AM)",
    title: "Alert: Red backpack carried in lobby",
    description:
      "Individual in dark jacket entered through main sliding doors carrying a high-visibility red backpack in left hand.",
    ruleTag: 'Rule: "red bag or red backpack"',
    image: FEED_IMAGE,
  },
  {
    id: "evt_02",
    severity: "resolved",
    badge: "RESOLVED • 91% CONFIDENCE",
    time: "1h 33m ago (09:12:04 AM)",
    title: "Lobby Courier: Red delivery bag",
    description:
      "Delivery personnel carrying insulated red courier tote near reception desk. Flagged and automatically classified as courier.",
    ruleTag: "Class: Authorized Vendor",
    image: FEED_IMAGE,
  },
];

const FILTERS = ["All (2)", "Critical (1)", "Review Needed"];

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function EdenVisionDashboard() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [ruleText, setRuleText] = useState(
    "Alert if someone is carrying a red bag or red backpack into the lobby",
  );
  const [activeFilter, setActiveFilter] = useState(0);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastShown, setToastShown] = useState(false); // controls mount vs. animation class
  const [updating, setUpdating] = useState(false);
  const [timestampLabel, setTimestampLabel] = useState("Updated 2s ago");

  const toastTimeoutRef = useRef(null);

  const showToast = () => {
    setToastShown(true);
    // allow the element to mount before adding the "visible" class so the
    // CSS transition actually animates in
    requestAnimationFrame(() => setToastVisible(true));

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => setToastShown(false), 300);
    }, 2400);
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const handleUpdateRule = () => {
    if (!ruleText.trim()) {
      setRuleText(
        "Alert if someone is carrying a red bag or red backpack into the lobby",
      );
    }
    setUpdating(true);
    setTimeout(() => {
      setUpdating(false);
      showToast();
    }, 600);
  };

  const handleRefreshFrame = () => {
    setTimestampLabel("Refreshing frame...");
    setTimeout(() => setTimestampLabel("Updated just now"), 500);
  };
  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);
  };
  return (
    <div className={`eden-root ${isDark ? "eden-dark" : "eden-light"}`}>
      {/* ---------------- Header ---------------- */}
      <header className="eden-header">
        <div className="eden-header-row">
          <div className="eden-brand-row">
            <div className="eden-brand-icon-wrap">
              <span className="eden-brand-icon-text">◎</span>
              <span className="eden-brand-beacon" />
            </div>
            <div>
              <div className="eden-brand-title-row">
                <span className="eden-brand-title">Eden Vision</span>
                <span className="eden-pro-pill">PRO</span>
              </div>
              <p className="eden-brand-subtitle">Autonomous Security Edge</p>
            </div>
          </div>

          <div className="eden-header-actions">
            {/* Add image */}
            <button
              type="button"
              className="eden-icon-button"
              onClick={() => setShowUploadModal(true)}
              aria-label="Upload image"
            >
              <Plus size={20} strokeWidth={2} />
            </button>

            {/* Theme */}
            <button
              type="button"
              className="eden-icon-button"
              onClick={() => setIsDark((d) => !d)}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun size={18} strokeWidth={2} />
              ) : (
                <Moon size={18} strokeWidth={2} />
              )}
            </button>

            <button className="eden-cam-switcher" type="button"></button>
          </div>
          {showUploadModal && (
            <div
              className="eden-upload-backdrop"
              onClick={() => setShowUploadModal(false)}
            >
              <div
                className="eden-upload-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="eden-upload-header">
                  <div>
                    <h3 className="eden-upload-title">Upload Image</h3>
                    <p className="eden-upload-subtitle">
                      Add an image for Eden Vision to analyze.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="eden-upload-close"
                    onClick={() => setShowUploadModal(false)}
                    aria-label="Close upload modal"
                  >
                    <X size={20} />
                  </button>
                </div>

                <label className="eden-upload-area">
                  {uploadedImage ? (
                    <img
                      src={uploadedImage}
                      alt="Uploaded preview"
                      className="eden-upload-preview"
                    />
                  ) : (
                    <div className="eden-upload-placeholder">
                      <div className="eden-upload-icon">
                        <Upload size={28} />
                      </div>

                      <p className="eden-upload-main-text">
                        Click to upload an image
                      </p>

                      <p className="eden-upload-help-text">PNG, JPG or WEBP</p>
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    hidden
                  />
                </label>

                {uploadedImage && (
                  <div className="eden-upload-actions">
                    <button
                      type="button"
                      className="eden-secondary-button"
                      onClick={() => setUploadedImage(null)}
                    >
                      Remove
                    </button>

                    <button
                      type="button"
                      className="eden-acknowledge-button"
                      onClick={() => {
                        setShowUploadModal(false);
                        showToast();
                      }}
                    >
                      <Upload size={17} />
                      Use Image
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="eden-status-ribbon">
          <div className="eden-status-left">
            <span className="eden-pulse-dot-outer">
              <span className="eden-pulse-dot-inner" />
            </span>
            <span className="eden-status-text">
              1 Cam Live • Sub-second Latency
            </span>
          </div>
          <div className="eden-engine-pill">
            <span className="eden-engine-pill-label">AI Engine: </span>
            <span className="eden-engine-pill-value">Active</span>
          </div>
        </div>
      </header>

      {/* ---------------- Toast ---------------- */}
      {toastShown && (
        <div
          className={`eden-toast ${toastVisible ? "eden-toast-visible" : ""}`}
        >
          <div className="eden-toast-icon">✓</div>
          <div>
            <p className="eden-toast-title">Vision Rule Deployed</p>
            <p className="eden-toast-subtitle">
              Compiled and synced across edge node in 420ms.
            </p>
          </div>
        </div>
      )}

      <main className="eden-main">
        <div className="eden-content">
          {/* ---------------- Rule editor ---------------- */}
          <section className="eden-card">
            <div className="eden-section-header-row">
              <div className="eden-section-header-left">
                <span className="eden-section-icon-indigo">✦</span>
                <h2 className="eden-section-label">
                  Active Natural Language Rule
                </h2>
              </div>
              <span className="eden-version-pill">v3.2 compiled</span>
            </div>

            <div className="eden-rule-input-wrap">
              <textarea
                className="eden-rule-input"
                rows={3}
                value={ruleText}
                onChange={(e) => setRuleText(e.target.value)}
                placeholder="Describe what Eden Vision should detect in plain words..."
              />
              <div className="eden-rule-input-footer">
                <span className="eden-rule-input-footer-text">
                  Semantic Parsed: OK
                </span>
                <button
                  type="button"
                  className="eden-clear-text"
                  onClick={() => setRuleText("")}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="eden-validation-pill">
              <span className="eden-validation-icon">✓</span>
              <p className="eden-validation-text">
                <strong className="eden-validation-bold">
                  Rule Validated:{" "}
                </strong>
                Target object{" "}
                <span className="eden-underline">bag/backpack</span> &amp;
                attribute <span className="eden-underline">color: red</span>{" "}
                recognized by vision model.
              </p>
            </div>

            <div className="eden-presets-block">
              <div className="eden-presets-header-row">
                <span>Quick Presets:</span>
                <span className="eden-presets-header-hint">Tap to load</span>
              </div>
              <div className="eden-presets-scroll">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    className="eden-preset-pill"
                    onClick={() => {
                      setRuleText(p.rule);
                      showToast();
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="eden-primary-action-block">
              <button
                type="button"
                className={`eden-primary-button ${updating ? "eden-primary-button-busy" : ""}`}
                onClick={handleUpdateRule}
              >
                <span className="eden-primary-button-icon">⟳</span>
                <span>
                  {updating ? "Compiling Rule..." : "Update Camera Rule"}
                </span>
              </button>
              <p className="eden-helper-caption">
                Camera briefly pauses detection for ~1s while the neural model
                compiles.
              </p>
            </div>
          </section>

          {/* ---------------- Live camera preview ---------------- */}
          <section className="eden-card">
            <div className="eden-section-header-row">
              <div className="eden-section-header-left">
                <span className="eden-live-dot-small" />
                <h3 className="eden-section-label">Live Camera Peek</h3>
                <span className="eden-fps-pill">1 FPS Low-BW</span>
              </div>
              <div className="eden-section-header-right">
                <span className="eden-timestamp-text">{timestampLabel}</span>
                <button
                  type="button"
                  className="eden-refresh-button"
                  onClick={handleRefreshFrame}
                  aria-label="Refresh frame"
                >
                  ⟳
                </button>
              </div>
            </div>

            <div className="eden-video-wrap">
              <img
                alt="Live Security Feed Cam 04 Lobby"
                className="eden-video-image"
                src={FEED_IMAGE}
              />
              <span className="eden-video-tag-left">
                CAM 04 : LOBBY MAIN ENT
              </span>
              <span className="eden-video-tag-right">10:45:32 AM</span>
              <div className="eden-bounding-box">
                <span className="eden-bounding-box-label">Red Bag 98%</span>
              </div>
              <button
                type="button"
                className="eden-expand-button"
                onClick={() => setSelectedIncident(INCIDENTS[0])}
              >
                ⤢ Inspect
              </button>
            </div>
          </section>

          {/* ---------------- Incident feed ---------------- */}
          <section className="eden-feed-section">
            <div className="eden-feed-header-row">
              <div className="eden-section-header-left">
                <span className="eden-pulse-dot-outer">
                  <span className="eden-pulse-dot-inner" />
                </span>
                <h3 className="eden-feed-header-title">Incident Feed</h3>
                <span className="eden-live-pill">LIVE</span>
              </div>
              <button
                type="button"
                className="eden-toggle-empty-text"
                onClick={() => setShowEmptyState((v) => !v)}
              >
                {showEmptyState ? "Restore Incidents" : "Toggle Empty State"}
              </button>
            </div>

            <div className="eden-filter-scroll">
              {FILTERS.map((f, i) => (
                <button
                  key={f}
                  type="button"
                  className={`eden-filter-tab ${activeFilter === i ? "eden-filter-tab-active" : ""}`}
                  onClick={() => setActiveFilter(i)}
                >
                  {f}
                </button>
              ))}
            </div>

            {showEmptyState ? (
              <div className="eden-empty-state">
                <div className="eden-empty-state-icon-wrap">🛡</div>
                <h4 className="eden-empty-state-title">
                  All Clear • No Rule Breaches
                </h4>
                <p className="eden-empty-state-subtitle">
                  Camera is actively watching against your prompt. We&apos;ll
                  notify you the moment a match occurs.
                </p>
                <span className="eden-empty-state-pill">
                  0 Active Anomalies
                </span>
              </div>
            ) : (
              <div className="eden-incident-list">
                {INCIDENTS.map((incident) => (
                  <article
                    key={incident.id}
                    className={`eden-incident-card ${
                      incident.severity === "critical"
                        ? "eden-incident-card-critical"
                        : ""
                    }`}
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <div className="eden-incident-top-row">
                      <span
                        className={`eden-incident-badge ${
                          incident.severity === "critical"
                            ? "eden-incident-badge-critical"
                            : "eden-incident-badge-resolved"
                        }`}
                      >
                        {incident.severity === "critical" && (
                          <span className="eden-incident-badge-dot" />
                        )}
                        {incident.badge}
                      </span>
                      <span className="eden-incident-time">
                        {incident.time}
                      </span>
                    </div>

                    <div className="eden-incident-body">
                      <div className="eden-incident-thumb-wrap">
                        <img
                          alt="Detection snapshot"
                          className="eden-incident-thumb"
                          src={incident.image}
                        />
                        <span className="eden-incident-thumb-box" />
                        <span className="eden-incident-thumb-tag">CAM 04</span>
                      </div>
                      <div className="eden-incident-text-wrap">
                        <p className="eden-incident-title">{incident.title}</p>
                        <p className="eden-incident-description">
                          {incident.description}
                        </p>
                        <p className="eden-incident-rule-tag">
                          {incident.ruleTag}
                        </p>
                      </div>
                    </div>

                    <div className="eden-incident-footer">
                      <span className="eden-incident-footer-link">
                        View full AI reasoning breakdown ›
                      </span>
                      {incident.severity === "critical" ? (
                        <button
                          type="button"
                          className="eden-dismiss-button"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Dismiss
                        </button>
                      ) : (
                        <span className="eden-reviewed-pill">Reviewed</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ---------------- Bottom nav ---------------- */}

      {/* ---------------- Incident detail modal ---------------- */}
      {selectedIncident && (
        <div
          className="eden-modal-backdrop"
          onClick={() => setSelectedIncident(null)}
        >
          <div
            className="eden-modal-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="eden-modal-handle-wrap">
              <span className="eden-modal-handle" />
            </div>

            <div className="eden-modal-header">
              <div className="eden-section-header-left">
                <span className="eden-red-dot" />
                <div>
                  <p className="eden-modal-title">
                    Incident Breakdown #EVT-1045
                  </p>
                  <p className="eden-modal-subtitle">
                    Timestamp: 2023/10/24 10:45:32 AM GMT
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="eden-modal-close-button"
                onClick={() => setSelectedIncident(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="eden-modal-body">
              <div className="eden-video-wrap">
                <img
                  alt="High resolution security incident capture"
                  className="eden-video-image"
                  src={selectedIncident.image || FEED_IMAGE}
                />
                <div className="eden-modal-bounding-box">
                  <span className="eden-modal-bounding-box-text">
                    TARGET: 98.4%
                  </span>
                </div>
                <div className="eden-modal-dashed-box">
                  <span className="eden-modal-person-tag">Person ID #4092</span>
                </div>
                <span className="eden-modal-focal-tag">
                  Focal Zoom: 1.0x • Model: Eden-Vision-X1
                </span>
              </div>

              <div className="eden-analysis-card">
                <div className="eden-analysis-header-row">
                  <span className="eden-analysis-header-text">
                    Neural Semantic Breakdown
                  </span>
                  <span className="eden-analysis-header-validated">
                    Validated Rule Match
                  </span>
                </div>

                <MetricBar
                  label="Target Object (Backpack / Bag)"
                  value="99.1% Confidence"
                  pct={99}
                  colorClass="eden-metric-fill-emerald"
                />
                <MetricBar
                  label="Attribute Color Match (Red: #D82626)"
                  value="97.8% Confidence"
                  pct={98}
                  colorClass="eden-metric-fill-red"
                />
                <MetricBar
                  label="Spatial Vector (Entry sliding door towards lift)"
                  value="94.2%"
                  pct={94}
                  colorClass="eden-metric-fill-indigo"
                />
              </div>

              <div>
                <p className="eden-reasoning-title">AI Contextual Reasoning</p>
                <div className="eden-reasoning-box">
                  <p className="eden-reasoning-text">
                    Subject entered lobby at 10:45:28 AM through primary south
                    sliding doors. System observed high chromatic contrast
                    matching active descriptor{" "}
                    <strong className="eden-reasoning-highlight">
                      &quot;red backpack&quot;
                    </strong>{" "}
                    in subject&apos;s left grasp. Subject proceeded past
                    reception stanchion toward lift corridor.
                  </p>
                </div>
              </div>

              <div className="eden-policy-box">
                <p className="eden-policy-title">⚠ Policy Recommendation</p>
                <p className="eden-policy-text">
                  Prompt designated as Priority Check. Confirm if guest is
                  visitor pre-registered on floor 3.
                </p>
              </div>

              <div className="eden-modal-actions-row">
                <button type="button" className="eden-secondary-button">
                  ⭳ Export 10s Clip
                </button>
                <button
                  type="button"
                  className="eden-acknowledge-button"
                  onClick={() => setSelectedIncident(null)}
                >
                  ✓ Acknowledge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small subcomponents                                                */
/* ------------------------------------------------------------------ */

function MetricBar({ label, value, pct, colorClass }) {
  return (
    <div className="eden-metric-block">
      <div className="eden-metric-row">
        <span className="eden-metric-label">{label}</span>
        <span className="eden-metric-value">{value}</span>
      </div>
      <div className="eden-metric-track">
        <div
          className={`eden-metric-fill ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
