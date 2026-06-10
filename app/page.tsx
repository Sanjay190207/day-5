import QuestionsList from "./questions-list";
import { getQuestionsPage } from "@/lib/questions";

// Render on every request
export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function Page() {


  const { questions, hasMore } =
    await getQuestionsPage(0, PAGE_SIZE);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-8 text-3xl font-bold">
        Live Q&A
      </h1>

      <section>
        <h2 className="mb-4 text-2xl font-bold">
          Questions
        </h2>

        <QuestionsList
          initialQuestions={questions}
          initialHasMore={hasMore}
        />
      </section>
    </main>
  );
}