import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    addQuestionApi,
    updateQuestionApi,
    getQuestionsApi,
    deleteQuestionApi,
} from "../adminApi/questionsApi";

// ➕ Add Question
export const addQuestion = createAsyncThunk(
    "questions/addQuestion",
    async (payload, { rejectWithValue }) => {
        try {
            return await addQuestionApi(payload);
        } catch (err) {
            return rejectWithValue(err.response?.data || "Error");
        }
    }
);

// ✏️ Update Question
export const updateQuestion = createAsyncThunk(
    "questions/updateQuestion",
    async ({ id, payload }, { rejectWithValue }) => {
        try {
            return await updateQuestionApi(id, payload);
        } catch (err) {
            return rejectWithValue(err.response?.data || "Error");
        }
    }
);

export const fetchQuestions = createAsyncThunk(
    "questions/fetchQuestions",
    async (_, { rejectWithValue }) => {
        try {
            return await getQuestionsApi();
        } catch (err) {
            return rejectWithValue(err.response?.data || "Error");
        }
    }
);

export const deleteQuestion = createAsyncThunk(
    "questions/deleteQuestion",
    async (id, { rejectWithValue }) => {
        try {
            return await deleteQuestionApi(id);
        } catch (err) {
            return rejectWithValue(err.response?.data || "Error");
        }
    }
);

const questionSlice = createSlice({
    name: "questions",
    initialState: {
        loading: false,
        error: null,
        questions: [],
        addLoading: false,
        updateLoading: false,
        deleteLoading: false,
    },
    extraReducers: (builder) => {
        builder
            .addCase(addQuestion.pending, (state) => {
                state.addLoading = true;
            })
            .addCase(addQuestion.fulfilled, (state) => {
                state.addLoading = false;
            })
            .addCase(addQuestion.rejected, (state, action) => {
                state.addLoading = false;
                state.error = action.payload;
            })

            .addCase(updateQuestion.pending, (state) => {
                state.updateLoading = true;
            })
            .addCase(updateQuestion.fulfilled, (state) => {
                state.updateLoading = false;
            })
            .addCase(updateQuestion.rejected, (state, action) => {
                state.updateLoading = false;
                state.error = action.payload;
            })

            .addCase(fetchQuestions.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchQuestions.fulfilled, (state, action) => {
                state.loading = false;

                const data = action.payload.data || [];

                // ✅ New items go to LAST
                state.questions = [...data].reverse();
            })
            .addCase(fetchQuestions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(deleteQuestion.pending, (state) => {
                state.deleteLoading = true;
            })
            .addCase(deleteQuestion.fulfilled, (state, action) => {
                state.deleteLoading = false;

                const deletedId = action.meta.arg;

                // ✅ Remove from UI instantly (NO refetch needed)
                state.questions = state.questions.filter(
                    (q) => q.id !== deletedId
                );
            })
            .addCase(deleteQuestion.rejected, (state, action) => {
                state.deleteLoading = false;
                state.error = action.payload;
            });
    },
});

export default questionSlice.reducer;