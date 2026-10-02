import { Component } from 'react';
import { captureException } from '../lib/sentry';

/**
 * Catches render errors anywhere below it so a bug shows a recoverable
 * message instead of a blank page. The error itself goes to Sentry when it is
 * configured; the user only ever sees the generic copy below.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    captureException(error, { componentStack: info?.componentStack });
    if (import.meta.env.DEV) console.error('[Beatzy] render error', error, info);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-5 text-center text-ink"
      >
        <div className="max-w-md space-y-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-sm leading-relaxed text-ink-muted">
            This part of Beatzy hit an error it couldn't recover from. Reloading usually fixes it; if it keeps
            happening, please let us know.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className="btn-primary text-sm">
            Reload the page
          </button>
          <a href="/" className="btn-secondary inline-flex items-center text-sm" onClick={this.reset}>
            Go to the home page
          </a>
        </div>
      </main>
    );
  }
}
