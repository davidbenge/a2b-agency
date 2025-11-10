import { createAsyncThunk } from "@reduxjs/toolkit";
import { Brand } from "../../../../../../actions/classes/Brand";
import { apiService } from "../../../services/api";

export const fetchBrandList = createAsyncThunk(
  "brand/fetchBrandList",
  async () => {
    try {
      console.debug("BrandManagerView getting brands");
      const response = await apiService.getBrandList();
      console.debug("BrandManager View getting brands response", response);
      console.debug(
        "BrandManager View getting brands response json",
        JSON.stringify(response, null, 2)
      );

      console.debug("response statusCode", response.statusCode);
      console.debug("response body", response.body);
      console.debug("response body.data", response.body.data);
      return response.body.data;
    } catch (error) {
      throw new Error("Failed to get saved brands list");
    }
  }
);
