import { apiService } from "../../../services/api";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchEventsList = createAsyncThunk(
  "event/fetchEventsList",
  async () => {
    try {
      const response = await apiService.getEventsList();
      return response.body.data;
    } catch (error) {
      throw new Error("Failed to get events list");
    }
  }
);
