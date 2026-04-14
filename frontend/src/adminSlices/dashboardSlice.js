import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getDashboardStatsApi, getLeadStatsApi , getActivityLogsApi} from "../adminApi/dashboardApi";

// ==================== THUNKS ====================

export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchDashboardStats",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getDashboardStatsApi();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch dashboard stats"
      );
    }
  }
);

export const fetchLeadStats = createAsyncThunk(
  "dashboard/fetchLeadStats",
  async (period = "monthly", { rejectWithValue }) => {
    try {
      const data = await getLeadStatsApi(period);
      return { data, period };
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch lead stats"
      );
    }
  }
);

export const fetchActivityLogs = createAsyncThunk(
  "dashboard/fetchActivityLogs",
  async (_, { rejectWithValue }) => {
    try {
      const data = await getActivityLogsApi();
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch activity logs"
      );
    }
  }
);

// ==================== SLICE ====================

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    stats: null,
    leadStats: null,
      activities: [], 
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder

      // ================= DASHBOARD =================
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ================= LEAD STATS =================
      .addCase(fetchLeadStats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLeadStats.fulfilled, (state, action) => {
        state.loading = false;

        const { data, period } = action.payload;

        let labels = [];
        let total = [];
        let converted = [];

        // ===== YEARLY =====
        if (period === "yearly" && data.yearly) {
          const sortedYears = Object.keys(data.yearly).sort((a, b) => a - b);

          sortedYears.forEach((year) => {
            labels.push(year);
            total.push(data.yearly[year]?.total || 0);
            converted.push(data.yearly[year]?.converted || 0);
          });
        }

        // ===== MONTHLY =====
        if (period === "monthly" && data.monthly) {
          const monthOrder = [
            "Jan","Feb","Mar","Apr","May","Jun",
            "Jul","Aug","Sep","Oct","Nov","Dec"
          ];

          const sortedMonths = Object.keys(data.monthly).sort((a, b) => {
            const [monthA, yearA] = a.split(" ");
            const [monthB, yearB] = b.split(" ");

            if (yearA !== yearB) return yearA - yearB;

            return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
          });

          sortedMonths.forEach((monthKey) => {
            labels.push(monthKey); // keep "Feb 2026"
            total.push(data.monthly[monthKey]?.total || 0);
            converted.push(data.monthly[monthKey]?.converted || 0);
          });
        }

        // ===== WEEKLY =====
        if (period === "weekly" && data.weekly) {
          const monthKey = Object.keys(data.weekly)[0];
          const weeks = data.weekly[monthKey];

          const sortedWeeks = Object.keys(weeks).sort(
            (a, b) => parseInt(a.replace("week", "")) - parseInt(b.replace("week", ""))
          );

          sortedWeeks.forEach((week) => {
            labels.push(week);
            total.push(weeks[week]?.total || 0);
            converted.push(weeks[week]?.converted || 0);
          });
        }

        state.leadStats = { labels, total, converted };
      })

      .addCase(fetchLeadStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

    
// ================= ACTIVITY LOGS =================
.addCase(fetchActivityLogs.fulfilled, (state, action) => {
  state.loading = false;

  const activityData = action.payload?.data || [];

  // ✅ Sort by latest (newest first)
  const sortedActivities = activityData.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  state.activities = sortedActivities;
})
  },
});

export default dashboardSlice.reducer;