import { useParams } from "react-router-dom";
import HadithReaderContent from "@/components/reader/ReadingContent";

export default function HadithReaderPage() {
  const { slug } = useParams();
  if (!slug) return null;
  return <HadithReaderContent slug={slug} />;
}
