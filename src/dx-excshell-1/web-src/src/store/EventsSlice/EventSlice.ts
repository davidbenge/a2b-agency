import { createSlice } from "@reduxjs/toolkit";
import { fetchEventsList } from "./asyncThunks/fetchEventsList";

const initialState = {
  appEvents: {},
  productEvents: {},
  isEventsListFetched: false,
};

export const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchEventsList.fulfilled, (state, action) => {
      state.appEvents = action.payload?.appEvents || {};
      state.productEvents = action.payload?.productEvents || {};
      state.isEventsListFetched = true;
    });

    builder.addCase(fetchEventsList.pending, (state) => {
      state.isEventsListFetched = false;
    });
  },
});

export const {} = eventSlice.actions;
export default eventSlice.reducer;
