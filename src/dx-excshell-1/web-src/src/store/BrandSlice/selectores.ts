import { RootState } from "../store";
import { useSelector } from "react-redux";

export const useBrandsList = () => {
  return useSelector((state: RootState) => state.brand.brands);
};

export const useIsBrandListFetched = () => {
  return useSelector((state: RootState) => state.brand.isBrandListFetched);
};
