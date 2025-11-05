import { useMemo } from "react";
import { RootState } from "../store";
import { useSelector } from "react-redux";

export const useEventsList = () => {
  const eventsDefinitions = useSelector(
    (state: RootState) => state.events.eventsDefinitions
  );

  return useMemo(() => {
    return Object.values(eventsDefinitions).map((event) => event);
  }, [eventsDefinitions]);
};

export const useEventsDefinitions = () => {
  return useSelector((state: RootState) => state.events.eventsDefinitions);
};

export const useIsEventsListFetched = () => {
  return useSelector((state: RootState) => state.events.isEventsListFetched);
};
