/**
 * Traque en mémoire les IDs des print jobs initiés par CE device.
 * Permet de filtrer les notifications WebSocket : seul l'appareil
 * qui a lancé l'impression voit le banner/toast de succès.
 */

const MAX_TRACKED_JOBS = 200;

const localJobIds = new Set<string>();

export const trackLocalPrintJob = (jobId: string) => {
  // Éviter une croissance illimitée du Set
  if (localJobIds.size >= MAX_TRACKED_JOBS) {
    const oldest = localJobIds.values().next().value;
    if (oldest) localJobIds.delete(oldest);
  }
  localJobIds.add(jobId);
};

export const isLocalPrintJob = (jobId: string): boolean => {
  return localJobIds.has(jobId);
};

export const removeLocalPrintJob = (jobId: string) => {
  localJobIds.delete(jobId);
};
