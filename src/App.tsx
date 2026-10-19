import { App as AntApp, ConfigProvider } from "antd";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { PersistGate } from "redux-persist/integration/react";

import { useAuthListener } from "./hooks/useAuthListener";
import Routing from "./router/Routing";
import { persistor, store } from "./store";

const theme = {
  token: {
    colorPrimary: "#1f4fd8",
    colorInfo: "#1f4fd8",
    borderRadius: 8,
    fontSize: 15,
    fontFamily:
      "'Inter Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    colorText: "#161b26",
    colorTextSecondary: "#586174",
  },
};

function Shell() {
  useAuthListener();
  return (
    <BrowserRouter>
      <Routing />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ConfigProvider theme={theme}>
          {/* AntApp supplies the context that App.useApp() message/modal need. */}
          <AntApp>
            <Shell />
          </AntApp>
        </ConfigProvider>
      </PersistGate>
    </Provider>
  );
}
