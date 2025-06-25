import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  gender: "male",
  name: "",
  email: "",
  bio: "",
  role: "",
  fields: [], // <-- Add fields here
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action) {
      return { ...state, ...action.payload };
    },
    setGender(state, action) {
      state.gender = action.payload;
    },
    setFields(state, action) { // <-- Add setFields reducer
      state.fields = action.payload;
    },
    resetUser(state) {
      return initialState;
    },
  },
});

export const { setUser, setGender, setFields, resetUser } = userSlice.actions;
export default userSlice.reducer;