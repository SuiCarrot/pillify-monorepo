import type { LifecyclePort } from './LifecyclePort';

export class BrowserLifecycleAdapter implements LifecyclePort {
  onBecameActive(handler: () => void): () => void {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        handler();
      }
    };

    const onFocus = () => {
      handler();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }
}
