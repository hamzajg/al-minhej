import { useParams } from "react-router-dom";
import ReadingContent from "@/components/reader/ReadingContent";

export default function ReadingPage() {
  const { slug } = useParams();
  if (!slug) return null;
  return <ReadingContent slug={slug} />;
}
