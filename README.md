# ATLASCEND — Brain (BETA)

Interactive educational 3D brain atlas based on Itay Inbar's Brain Project, with additional Japanese educational functionality.

## Purpose and limitations
For education only; not intended for medical diagnosis, treatment planning, or surgical navigation. CT/MRI imagery is not rigidly registered to the original brain mesh. Some tract and spinal cord sections are simplified educational representations.

## Running
Serve this folder through an HTTP server (not a local file:// URL). `index.html` is the entry point. The app currently loads Three.js, React, ReactDOM, and Babel from external CDNs, so network access is required.

## Licensing and attribution
The original viewer code is licensed Apache-2.0; the original and derivative brain anatomy assets follow CC BY-SA 4.0; the modified cervical spinal cord uses CC BY-SA 2.1 Japan. Imaging datasets have their own terms. See `credits.html`, `LICENSE`, `MODE1_LICENSE_AND_CREDITS.md`, `MODEL_ATTRIBUTION.md`, `COPYING_ICBM.txt`, and `THIRD_PARTY_NOTICES.txt`. Retain original authorship credits. No endorsement of this derivative by original authors is implied.

## Release status
Pre-release GitHub Pages candidate; not approved for public release. Local Chrome and Safari basic functionality checks were reported on 2026-11-04. Other devices, long-duration GPU stability, and final rights clearance remain open.
