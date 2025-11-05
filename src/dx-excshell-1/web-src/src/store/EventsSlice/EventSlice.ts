import { createSlice } from "@reduxjs/toolkit";
import { fetchEventsList } from "./asyncThunks/fetchEventsList";

const initialState = {
  eventsDefinitions: {},
  summary: {},
  isEventsListFetched: false,
};

export const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchEventsList.fulfilled, (state, action) => {
      state.eventsDefinitions = action.payload?.events || {};
      state.summary = action.payload?.summary || {};
      state.isEventsListFetched = true;
    });

    builder.addCase(fetchEventsList.pending, (state) => {
      state.isEventsListFetched = false;
    });
  },
});

export const {} = eventSlice.actions;
export default eventSlice.reducer;
