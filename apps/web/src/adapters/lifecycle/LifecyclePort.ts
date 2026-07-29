export interface LifecyclePort {
  /** Subscribe to "app became active" events. Returns unsubscribe. */
  onBecameActive(handler: () => void): () => void;
}
