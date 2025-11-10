import { createSlice } from "@reduxjs/toolkit";
import { Brand } from "../../components/rules-manager/CraeteForm";
import { fetchBrandList } from "./asyncThunks/fetchBrandList";

const initialState = {
  brands: [] as Brand[],
  isBrandListFetched: false,
};

export const brandSlice = createSlice({
  name: "brand",
  initialState,
  reducers: {
    updateBrandList: (state, action) => {
      state.brands = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchBrandList.fulfilled, (state, action) => {
      state.brands = action.payload;
      state.isBrandListFetched = true;
    });
    builder.addCase(fetchBrandList.rejected, (state, action) => {
      state.isBrandListFetched = true;
    });
    builder.addCase(fetchBrandList.pending, (state, action) => {
      state.isBrandListFetched = false;
    });
  },
});

export const { updateBrandList } = brandSlice.actions;
export default brandSlice.reducer;
