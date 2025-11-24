# AI Interview Agent Instructions

## Architecture Overview

**AI Interview** is an Angular 20+ standalone application split into two distinct user flows:

1. **Recruiter Mode** (`src/app/recruiter/*`): Admin dashboard for managing candidate interviews
2. **Meeting Mode** (`src/app/meeting/*`): Live interview experience with avatar animations, video recording, speech recognition, and AI-driven questions

Both flows share core services and authentication but are entirely separate features with different styling and guards. See `src/app/app.routes.ts` for separation logic.

## Tech Stack

- **Angular 20.1** (standalone components, functional guards/interceptors)
- **SCSS** for styling (Bootstrap 5.3 integrated)
- **Three.js 0.181** (3D avatar rendering in meeting mode)
- **RxJS 7.8** (reactive services, http observables)
- **FastAPI Backend** (proxied at `/api` → `http://13.127.145.13:8001/`)
- **Bootstrap 5.3** for UI framework
- **ng-angular-popup** for toast notifications
- **GSAP 3.13** for animations

## Key Patterns & Conventions

### Service Architecture

All services are in `src/app/core/_services/` with suffix pattern (e.g., `Interviews.ts`, `Auth.ts`, `Token.ts`):
- Services are **`@Injectable({ providedIn: 'root' })`** for tree-shaking
- **Token management**: `Token` service handles recruiter JWT, `MeetingToken` handles interview session tokens
- **Dynamic headers**: Services like `Interviews` use `getHttpOptions()` to inject auth tokens from `localStorage` (keys: `access_token`, `meet_access_token`)
- **HTTP interception**: `loadingInterceptor` auto-shows/hides preloader on all requests

### Authentication & Route Guards

Located in `src/app/core/guards/`:
- **Functional guards** (not class-based): `authGuard`, `loginGuard` check `Token.isLoggedIn()`
- **Recruiter flow**: `/` → `Login` → `/dashboard` (protected by `authGuard`)
- **Meeting flow**: `/meeting-login` → `/interview` or `/avatar` (protected by `meetAuthGuard`)
- Guards redirect to root (`/`) on failure; catch-all route also redirects to `/`

### Component Structure

- **Standalone components** (no NgModules) with `imports: [...]` array
- **SCSS scoped** to component (not global, except `src/styles.scss`)
- **Reactive forms** (`ReactiveFormsModule`, `FormBuilder`) for user input
- **Template directives**: `*ngIf`, `*ngFor`, async pipe for Observables
- Example: `src/app/meeting/interview/interview.ts` handles speech recognition, video recording, and avatar animations

### Styling Approach

- **Global SCSS variables** in `src/styles.scss` and imported partials:
  - `src/_utilities.scss` — utility classes
  - `src/_ui-kit.scss` — component styles
  - `src/_dark.scss` — dark mode styles
- **Mode switching**: `.recruiter-mode` class on `body` changes background and colors
- **CSS Custom Properties**: `--primary-color: #605DFF`, `--primary-text-color: #020213`, etc. (defined in `:root`)
- **Bootstrap integration**: Bootstrap CSS loaded first in build; custom styles override

### Backend Integration

- **Proxy config** (`proxy.conf.json`): `/api` requests route to FastAPI backend
- **Meeting service endpoints** (in `Interviews.ts`):
  - `POST /generate-questions/` — AI question generation
  - `POST /submit-answer/` — candidate answer submission
  - `POST /analyze_frame/` — face/lip detection (WebRTC frame data)
  - `POST /upload-question-audio/` — question audio processing
  - `POST /upload-full-video/` — final video upload
- **Auth endpoint** (`Auth.ts`): `POST /recruiter/login/`

## Build & Development

```bash
npm start              # ng serve (dev server on :4200)
npm run build          # production build → dist/
npm run watch          # ng build --watch (development)
npm test              # Karma test runner
```

**Build budgets** (from `angular.json`):
- Initial bundle: 5MB warning, 10MB error
- Component styles: 1MB warning, 2MB error

**Development proxy**: Requests to `/api/*` proxy to backend via `proxy.conf.json`. Use `ng serve` with proxy:
```bash
ng serve --proxy-config proxy.conf.json  # automatic in dev server
```

## Important File Locations

| Purpose | Path |
|---------|------|
| Root component & routing | `src/app/app.ts`, `src/app/app.routes.ts` |
| Config (providers, interceptors) | `src/app/app.config.ts` |
| Services | `src/app/core/_services/*.ts` |
| Guards | `src/app/core/guards/*.ts` |
| HTTP interceptor | `src/app/core/interceptors/loading-interceptor.ts` |
| Recruiter UI | `src/app/recruiter/{login,dashboard,profile-search}/` |
| Meeting UI | `src/app/meeting/{interview,avatar-viewer,meeting-login}/` |
| Layout wrappers | `src/app/layouts/{header,menu,recruiter-layout}/` |
| Global styles | `src/styles.scss` and `src/_*.scss` |
| Environment config | `src/environments/environment.ts` (apiBase: '/api') |

## Debugging & Common Issues

- **Preloader stuck**: Check `PreloaderService.show()/hide()` calls; verify interceptor is applied
- **Auth token missing**: Ensure `localStorage.getItem('access_token')` or `meet_access_token` is set before API calls
- **Styles not applying**: Clear Angular cache (`rm -r .angular/`) and rebuild
- **Proxy not working**: Ensure `ng serve` is running (not `ng build`); check `proxy.conf.json` target URL

## Conventions to Follow

1. **File naming**: kebab-case for files (`interview.ts`, `avatar-viewer.ts`), PascalCase for class/component exports (`export class Interview`)
2. **Imports order**: Angular → third-party → local services → styles
3. **Observables**: Unsubscribe in `ngOnDestroy()` or use `takeUntilDestroyed()` (Angular 16+)
4. **Error handling**: Use `HttpErrorResponse` type; pass errors to toast service
5. **Unused imports**: ESLint auto-removes; build will fail if not resolved
