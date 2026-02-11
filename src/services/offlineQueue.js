const QUEUE_KEY = "friending_offline_queue_v1";

function loadQueue() {
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function saveQueue(queue) {
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    // ignore
  }
}

export class OfflineQueue {
  constructor() {
    this.queue = loadQueue();
    this._timer = null;
  }

  enqueue(type, payload = {}) {
    const item = {
      id: `q_${Math.random().toString(36).slice(2, 10)}`,
      type,
      payload,
      status: "pending",
      attempts: 0,
      createdAt: Date.now(),
      lastAttemptAt: null,
    };
    this.queue.push(item);
    saveQueue(this.queue);
    return item.id;
  }

  process(handler) {
    let changed = false;
    this.queue = this.queue.map((item) => {
      if (item.status !== "pending") return item;
      const next = { ...item, attempts: item.attempts + 1, lastAttemptAt: Date.now() };
      try {
        const ok = handler ? handler(next) : true;
        if (ok) {
          next.status = "done";
        }
      } catch (error) {
        next.status = "pending";
      }
      changed = true;
      return next;
    });
    if (changed) saveQueue(this.queue);
  }

  prune() {
    this.queue = this.queue.filter((item) => item.status !== "done");
    saveQueue(this.queue);
  }

  start(handler, intervalMs = 15000) {
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      this.process(handler);
      this.prune();
    }, intervalMs);
  }
}
