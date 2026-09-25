import { Component, type ReactNode } from 'react';
import { clearWorkingFlow } from './library';

/**
 * The last line of defence: if anything throws while rendering, show a way out
 * instead of a blank page. Saved flows are never touched; "Start fresh" only
 * clears the flow that was open (and the one offered to continue), in case it's
 * what keeps failing.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="crashed" role="alert">
        <h1>Something went wrong</h1>
        <p>Your saved flows are safe. Reload to try again, or start fresh without the flow that was open.</p>
        <div className="crashed-actions">
          <button className="primary" onClick={() => location.reload()}>
            Reload
          </button>
          <button
            onClick={() => {
              clearWorkingFlow();
              location.href = location.pathname + location.search;
            }}
          >
            Start fresh
          </button>
        </div>
      </main>
    );
  }
}
