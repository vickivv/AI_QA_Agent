import React from "react";
import { Provider } from "react-redux";
import { store } from "./features/fileSystem/index";
import AITestGenIDE from "./pages/AITestGenIDE";

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <div className="h-screen w-screen">
        <AITestGenIDE />
      </div>
    </Provider>
  );
};

export default App;
