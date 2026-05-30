import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { buildSubmissionStatsByExam } from "@/lib/examStats";
import { queryKeys } from "@/lib/queryKeys";
import type { ExamStats, Submission } from "@/types";

export type SubmissionScoresCache = {
  scores: Pick<Submission, "score" | "studentName">[];
  scoresByExamId: Record<string, Pick<Submission, "score" | "studentName">[]>;
  statsByExamId: Record<string, ExamStats>;
  ready: boolean;
};

const emptyCache = (examIds: string[]): SubmissionScoresCache => ({
  scores: [],
  scoresByExamId: {},
  statsByExamId: buildSubmissionStatsByExam(examIds, {}),
  ready: examIds.length === 0,
});

function pick(d: Submission) {
  return { score: d.score, studentName: d.studentName };
}

export function useSubmissionScores(examIds: string[]) {
  const queryClient = useQueryClient();
  const perExamRef = useRef<Map<string, Pick<Submission, "score" | "studentName">[]>>(new Map());
  const idsKey = examIds.join(",");

  useEffect(() => {
    const ids = idsKey ? idsKey.split(",") : [];

    if (!ids.length) {
      queryClient.setQueryData(queryKeys.submissionScores(ids), emptyCache(ids));
      return;
    }

    perExamRef.current = new Map();

    const rebuild = () => {
      const byExamId = Object.fromEntries(
        ids.map((id) => [id, perExamRef.current.get(id) ?? []])
      ) as Record<string, Pick<Submission, "score" | "studentName">[]>;
      const scores = ids.flatMap((id) => byExamId[id] ?? []);
      queryClient.setQueryData(queryKeys.submissionScores(ids), {
        scores,
        scoresByExamId: byExamId,
        statsByExamId: buildSubmissionStatsByExam(ids, byExamId),
        ready: true,
      });
    };

    const unsubs = ids.map((id) =>
      onSnapshot(collection(db, "exams", id, "submissions"), (snap) => {
        perExamRef.current.set(id, snap.docs.map((d) => pick(d.data() as Submission)));
        rebuild();
      })
    );

    return () => unsubs.forEach((u) => u());
  }, [queryClient, idsKey]);

  const { data } = useQuery({
    queryKey: queryKeys.submissionScores(examIds),
    queryFn: async () => {
      if (!examIds.length) return emptyCache(examIds);
      const snaps = await Promise.all(
        examIds.map((id) => getDocs(collection(db, "exams", id, "submissions")))
      );
      const byExamId = Object.fromEntries(
        examIds.map((id, i) => [
          id,
          snaps[i].docs.map((d) => pick(d.data() as Submission)),
        ])
      ) as Record<string, Pick<Submission, "score" | "studentName">[]>;
      const scores = examIds.flatMap((id) => byExamId[id] ?? []);
      return {
        scores,
        scoresByExamId: byExamId,
        statsByExamId: buildSubmissionStatsByExam(examIds, byExamId),
        ready: true,
      };
    },
    staleTime: Infinity,
    refetchOnMount: false,
  });

  const cache = data ?? emptyCache(examIds);
  return {
    scores: cache.scores,
    scoresByExamId: cache.scoresByExamId,
    statsByExamId: cache.statsByExamId,
    ready: cache.ready,
  };
}
