//main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider } from "antd";
import App from "./App";
import "antd/dist/reset.css";

import store from "./store.js";
import { Provider } from "react-redux";
import adminTheme from "./theme/adminTheme.js";


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <ConfigProvider theme={adminTheme}>
        <App />

      </ConfigProvider>
    </Provider>
  </React.StrictMode>
);
