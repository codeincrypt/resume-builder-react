import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import TemplateGallery from "../components/TemplateGallery";
import { CATEGORIES } from "../resume/registry";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { setCategory } from "../store/slices/templateSlice";

/** `/templates` — the public gallery. Using one needs an account. */
export default function Templates() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [params] = useSearchParams();
  const signedIn = useAppSelector((state) => !!state.auth.user?.emailVerified);

  // Landing-page category links arrive as /templates?category=modern.
  const requested = params.get("category");
  useEffect(() => {
    if (requested && (CATEGORIES as string[]).includes(requested)) {
      dispatch(setCategory(requested as (typeof CATEGORIES)[number]));
    }
  }, [requested, dispatch]);

  const use = (templateId: string) => {
    const target = `/create?template=${templateId}`;
    if (signedIn) navigate(target);
    else navigate("/signup", { state: { from: target } });
  };

  return (
    <div className="container templates-page">
      <header className="templates-page__head">
        <h1>25 capital-city resume templates</h1>
        <p className="muted">
          Every design is named for a capital. Filter by style, or open one to start — your
          content moves between templates without being lost.
        </p>
      </header>
      <TemplateGallery onSelect={use} actionLabel={signedIn ? "Use this template" : "Sign up to use"} />
    </div>
  );
}
