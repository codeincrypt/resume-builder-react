import { useDispatch, useSelector } from "react-redux";

import type { AppDispatch, RootState } from "./index";

/** Typed wrappers so components never need to annotate state or dispatch. */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
