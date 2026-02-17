import type { LoadingContext } from "@/lib/intent/runtime-signals";

/** Contextual loading labels that cycle based on elapsed time. */
const LOADING_LABELS: Record<LoadingContext, string[]> = {
  generic: ["Thinking", "Processing", "Working", "Almost Done"],
  cart: ["Updating Cart", "Syncing Cart", "Checking Stock", "Applying Changes"],
  menu: ["Scanning Menu", "Matching Items", "Filtering Dishes", "Ranking Options"],
  restaurant: ["Finding Restaurants", "Checking Places", "Sorting Results", "Comparing Picks"],
  slots: ["Checking Slots", "Finding Times", "Scanning Availability", "Shortlisting Times"],
  booking: ["Preparing Booking", "Confirming Table", "Saving Details", "Finalizing Request"],
  address: ["Fetching Addresses", "Checking Coverage", "Loading Locations", "Saving Address"],
  auth: ["Verifying Login", "Connecting Account", "Syncing Access", "Validating Session"],
  nutrition: ["Matching Meals", "Counting Macros", "Balancing Nutrition", "Planning Intake"],
  style: ["Matching Style", "Building Looks", "Curating Picks", "Refining Outfit"],
  grooming: ["Matching Products", "Curating Routine", "Scanning Essentials", "Refining Picks"],
  order: ["Placing Order", "Confirming Order", "Validating Cart", "Finalizing Checkout"],
};

/** Select a loading label based on context and elapsed time, cycling every 1.8s. */
export function getLoadingLabel(context: LoadingContext, elapsedMs: number): string {
  const labels = LOADING_LABELS[context] ?? LOADING_LABELS.generic;
  const index = Math.floor(elapsedMs / 1800) % labels.length;
  return labels[index];
}
