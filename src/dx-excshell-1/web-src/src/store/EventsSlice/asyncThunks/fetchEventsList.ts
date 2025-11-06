import { apiService } from "../../../services/api";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchEventsList = createAsyncThunk(
  "event/fetchEventsList",
  async () => {
    try {
      const [appEventsResponse, productEventsResponse] = await Promise.all([
        apiService.getAppEventsList(),
        apiService.getProductEventsList(),
      ]);
      return {
        appEvents: appEventsResponse.body.data.events,
        productEvents: productEventsResponse.body.data.events,
      };
    } catch (error) {
      console.log("Error fetching app events list:", error);
      return {
        appEvents: null,
        productEvents: null,
      };
    }
  }
);
