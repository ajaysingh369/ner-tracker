export const FeatureFlags = {
    // ─── AI Capabilities ──────────────────────────────────────────────────────────
    ENABLE_ZENITH_VOICE: true, // Toggles the Zenith Voice Scan (Vocal Biomarkers) module in the tab bar
    ENABLE_STRIDE_GUARD: true, // Toggles the Acoustic Stride Guard module
    ENABLE_FORM_COACH: true,   // Toggles the AI Form Coach (Markerless Gait Analysis)
    USE_ON_DEVICE_ANOMALY_DETECTION: false, // Toggles local TFLite vs Cloud Bedrock for step verification
};
