import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Submission } from "@/types";

type Cache = { dates: Date[]; ready: boolean };

const emptyCache = (examIds: string[]): Cache => ({
  dates: [],
  ready: examIds.length === 0,
});

export function useSubmissionDates(examIds: string[]) {
  const queryClient = useQueryClient();
  const perExamRef = useRef<Map<string, Date[]>>(new Map());
  const idsKey = examIds.join(",");
  const cacheKey = ["submissionDates", idsKey];

  useEffect(() => {
    const ids = idsKey ? idsKey.split(",") : [];
    if (!ids.length) {
      queryClient.setQueryData(cacheKey, emptyCache(ids));
      return;
    }
    perExamRef.current = new Map();
    const rebuild = () => {
      const dates = ids.flatMap((id) => perExamRef.current.get(id) ?? []);
      queryClient.setQueryData(cacheKey, { dates, ready: true });
    };
    const unsubs = ids.map((id) =>
      onSnapshot(collection(db, "exams", id, "submissions"), (snap) => {
        perExamRef.current.set(
          id,
          snap.docs
            .map((d) => (d.data() as Submission).gradedAt?.toDate?.())
            .filter((d): d is Date => !!d)
        );
        rebuild();
      })
    );
    return () => unsubs.forEach((u) => u());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, idsKey]);

  const { data } = useQuery<Cache>({
    queryKey: cacheKey,
    queryFn: async () => {
      if (!examIds.length) return emptyCache(examIds);
      const snaps = await Promise.all(
        examIds.map((id) => getDocs(collection(db, "exams", id, "submissions")))
      );
      const dates = snaps.flatMap((snap) =>
        snap.docs
          .map((d) => (d.data() as Submission).gradedAt?.toDate?.())
          .filter((d): d is Date => !!d)
      );
      return { dates, ready: true };
    },
    staleTime: Infinity,
    refetchOnMount: false,
  });

  return data ?? emptyCache(examIds);
}
