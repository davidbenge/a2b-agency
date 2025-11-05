import { configureStore, combineSlices } from "@reduxjs/toolkit";
import brandSlice from "./BrandSlice/BrandSlice";
import eventSlice from "./EventsSlice/EventSlice";

export const reducer = combineSlices({
  brand: brandSlice,
  events: eventSlice,
});
export const defaultMiddlewareConfig = {
  serializableCheck: false, // We have non-serializable data (loadPossibleValuesFn in FieldGroup)
};
export const devTools = { name: "A2B-Agency" };

export const store = configureStore({
  reducer,
  devTools,
  middleware: (defaultMiddleware) => defaultMiddleware(defaultMiddlewareConfig),
});

export const getStoreState = () => store.getState();

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
