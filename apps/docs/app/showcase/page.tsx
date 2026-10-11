import type { Metadata } from "next";
import { AssistantScene, CodingAgentScene, SocialCard } from "./scenes";

export const metadata: Metadata = { title: "Showcase · anythic/ui" };

export default function ShowcasePage() {
  return (
    <main className="flex flex-col items-center gap-16 px-4 py-16">
      <CodingAgentScene />
      <AssistantScene />
      <SocialCard />
    </main>
  );
}
