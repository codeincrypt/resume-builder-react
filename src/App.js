import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import Users from "./page/Users";
import "./App.css";
import Home from "./page/Home";

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Home />
        {/* <Users /> */}
      </BrowserRouter>
    </Provider>
  );
}

export default App;
