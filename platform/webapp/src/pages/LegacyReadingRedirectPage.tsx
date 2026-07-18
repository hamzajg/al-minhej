import { Navigate, useParams } from "react-router-dom";
import { hadithReaderPath } from "@/lib/routes";

export default function LegacyReadingRedirectPage() {
  const { slug } = useParams();
  if (!slug) return <Navigate to="/" replace />;
  return <Navigate to={hadithReaderPath(slug)} replace />;
}
