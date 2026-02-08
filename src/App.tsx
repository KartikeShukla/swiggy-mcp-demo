import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { LandingPage } from "./components/home/LandingPage";
import { ChatView } from "./components/chat/ChatView";
import { ApiKeyModal } from "./components/auth/ApiKeyModal";
import { SettingsMenu } from "./components/auth/SettingsMenu";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const {
    apiKey,
    swiggyToken,
    showApiKeyModal,
    isTokenStale,
    saveApiKey,
    changeApiKey,
    disconnectSwiggy,
    saveSwiggyToken,
    startOAuth,
    clearChats,
  } = useAuth();

  return (
    <BrowserRouter>
      {showApiKeyModal && <ApiKeyModal onSubmit={saveApiKey} />}

      <Header
        right={
          <SettingsMenu
            hasApiKey={!!apiKey}
            hasSwiggyToken={!!swiggyToken}
            onChangeApiKey={changeApiKey}
            onDisconnectSwiggy={disconnectSwiggy}
            onClearChats={clearChats}
          />
        }
      />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/:verticalId"
          element={
            <ChatView
              apiKey={apiKey}
              swiggyToken={swiggyToken}
              isTokenStale={isTokenStale}
              onConnect={startOAuth}
              onPasteToken={saveSwiggyToken}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
