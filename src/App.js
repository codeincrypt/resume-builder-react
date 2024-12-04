import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import Users from "./page/Users";
import "./App.css";

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Users />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
