import { notFound } from "next/navigation";
import { EXPERIMENTS, findExperiment } from "../experiments";
import { Viewer } from "../_components/Viewer";

export function generateStaticParams() {
  return EXPERIMENTS.map((e) => ({ slug: e.slug }));
}

export const dynamicParams = false;

export default async function ExperimentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (findExperiment(slug) < 0) notFound();
  return <Viewer slug={slug} />;
}
