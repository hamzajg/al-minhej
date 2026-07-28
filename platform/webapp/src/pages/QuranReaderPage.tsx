import { useParams } from "react-router-dom";
import { QuranReaderContent } from "@/components/quran/QuranReaderContent";

export default function QuranReaderPage() {
  const { slug } = useParams();
  return <QuranReaderContent surahSlug={slug ?? "fatiha"} />;
}
