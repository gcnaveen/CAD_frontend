import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  lang: "en",
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      state.lang = action.payload === "kn" ? "kn" : "en";
    },
    toggleLanguage: (state) => {
      state.lang = state.lang === "kn" ? "en" : "kn";
    },
  },
});

export const { setLanguage, toggleLanguage } = languageSlice.actions;
export default languageSlice.reducer;

