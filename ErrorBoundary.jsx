import { Component } from 'react';

// Shows the error on screen instead of a blank white page
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('App crashed:', error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080c0a', color: '#e8e4d8', padding: 24, fontFamily: 'monospace' }}>
        <div style={{ maxWidth: 560 }}>
          <h2 style={{ color: '#ffaa00', marginBottom: 8 }}>Something went wrong</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#ff6b81' }}>{String(this.state.error && this.state.error.message || this.state.error)}</pre>
          <button onClick={() => location.reload()} style={{ marginTop: 16, padding: '8px 16px', borderRadius: 8, border: '1px solid #00f076', background: 'transparent', color: '#00f076', cursor: 'pointer' }}>Reload</button>
        </div>
      </div>
    );
  }
}
