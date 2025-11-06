import { useMemo } from "react";
import { RootState } from "../store";
import { useSelector } from "react-redux";
import {
  IAppEventDefinition,
  IProductEventDefinition,
} from "../../../../../shared/types";

export const useAppEventsList = () => {
  const appEvents = useSelector((state: RootState) => state.events.appEvents);

  return useMemo(() => {
    return Object.values(appEvents).map((event: IAppEventDefinition) => event);
  }, [appEvents]);
};

export const useProductEventsList = () => {
  const productEvents = useSelector(
    (state: RootState) => state.events.productEvents
  );

  return useMemo(() => {
    return Object.values(productEvents).map(
      (event: IProductEventDefinition) => event
    );
  }, [productEvents]);
};

export const useEventsListMap = () => {
  const appEvents = useAppEventsList();
  const productEvents = useProductEventsList();
  return useMemo(
    () => [
      { list: appEvents, category: "App" },
      { list: productEvents, category: "Product" },
    ],
    [appEvents, productEvents]
  );
};

export const useIsEventsListFetched = () => {
  return useSelector((state: RootState) => state.events.isEventsListFetched);
};
