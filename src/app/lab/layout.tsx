import type { Metadata } from "next";
import "./lab.css";

export const metadata: Metadata = {
  title: "Venty Lab",
  description: "Experiments, colour studies and playgrounds for the Venty landing page.",
  robots: { index: false, follow: false },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return <div className="lab">{children}</div>;
}
