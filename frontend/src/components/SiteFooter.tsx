import { useLayout } from "../theme/LayoutProvider";
import Footer from "./Footer";
import HuffPostFooter from "./HuffPostFooter";
import DailyWireFooter from "./DailyWireFooter";

/** Renders the footer matching the site's current layout — same pattern as SiteNav. */
export default function SiteFooter() {
  const { layout } = useLayout();
  if (layout === "huffpost") return <HuffPostFooter />;
  if (layout === "dailywire") return <DailyWireFooter />;
  return <Footer />;
}
