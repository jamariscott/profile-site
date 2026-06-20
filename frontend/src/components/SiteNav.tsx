import { useLayout } from "../theme/LayoutProvider";
import PageNav from "./PageNav";
import HuffPostNav from "./HuffPostNav";
import DailyWireNav from "./DailyWireNav";

/** Renders the nav matching the site's current layout — used on every page, not just the homepage. */
export default function SiteNav() {
  const { layout } = useLayout();
  if (layout === "huffpost") return <HuffPostNav />;
  if (layout === "dailywire") return <DailyWireNav />;
  return <PageNav />;
}
