export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { Metadata } from "next";
import QuizClient from "./client";
import SafeQuizLoader from "@/components/quiz/SafeQuizLoader";
import AuthDebugger from "@/components/debug/AuthDebugger";

// According to Next.js 15.3: dynamic route APIs are asynchronous
type PageProps = {
  params: Promise<{ code: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const { code } = await params;
  // Optional search params, if needed
  const search = searchParams ? await searchParams : undefined;

  return (
    <SafeQuizLoader>
      <Suspense fallback={<div className="p-8 text-center">Loading quiz...</div>}>
        <QuizClient code={code} />
        {/* Example of using search if needed */}
        {search?.ref && (
          <div className="text-sm text-gray-500">Referral: {search.ref}</div>
        )}
        {/* Add auth debugger in development only */}
        {process.env.NODE_ENV === 'development' && <AuthDebugger />}
      </Suspense>
    </SafeQuizLoader>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Quiz ${code} | Ageno Quiz App`,
    description: `Take the quiz with code ${code}`,
  };
}

export async function generateStaticParams() {
  return [];
}
