# Project memory

## Product intent & audience

- Vite + React web application intended for deployment on Netlify
- User is likely a beginner or non-expert with deployment workflows; needs step-by-step guidance and terminology clarification

## Brand personality & voice

- Supportive, instructional tone
- Plain language; clarify platform-specific terminology when it differs from user expectations

## Visual design & UX direction

- No specific visual/UX context inferred yet

## Decisions, constraints & rationale

- Deployment target: Netlify
- Chosen method: manual drag-and-drop deploy (not Git/CI integration)
- Rationale: user following a guided deployment process; manual method selected at step 3

## Open questions & assumptions

- Actual app purpose, features, and content are unknown
- Source of deployment steps (tutorial, course, internal guide?) is unknown
- Assumption: user has a built `dist/` folder ready to drag-and-drop
- Unknown whether Git-based deployment will be needed later