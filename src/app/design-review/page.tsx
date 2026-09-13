import { notFound } from "next/navigation";
import { DesignReview } from "./DesignReview";

/**
 * The illustration review harness, every asset beside what the character
 * sheet in docs/design/direction.md asks of it. It is not part of the
 * Learner's or the Parent's app and must not be reachable in production, so
 * it answers 404 unless DESIGN_REVIEW is set; `pnpm design:review` sets it
 * on the server it starts, and snapshots this page to docs/design/.
 */
export const dynamic = "force-dynamic";

export default function DesignReviewPage() {
  if (process.env.DESIGN_REVIEW !== "1") notFound();
  return <DesignReview />;
}
