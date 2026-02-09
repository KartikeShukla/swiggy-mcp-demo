import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { PhoneFrame } from "./components/layout/PhoneFrame";
import { LandingPage } from "./components/home/LandingPage";
import { ChatView } from "./components/chat/ChatView";
import { OnboardingSheet } from "./components/auth/OnboardingSheet";
import { SettingsMenu } from "./components/auth/SettingsMenu";
import { StatusChip } from "./components/auth/SwiggyConnect";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useAuth } from "./hooks/useAuth";

export default function App() {
  const {
    apiKey,
    swiggyToken,
    onboardingStep,
    selectedAddress,
    isTokenStale,
    saveApiKey,
    changeApiKey,
    disconnectSwiggy,
    saveSwiggyToken,
    startOAuth,
    clearChats,
    markTokenExpired,
    selectAddress,
    changeAddress,
  } = useAuth();

  return (
    <BrowserRouter>
      <PhoneFrame>
        <OnboardingSheet
          step={onboardingStep}
          apiKey={apiKey}
          swiggyToken={swiggyToken}
          onSaveApiKey={saveApiKey}
          onStartOAuth={startOAuth}
          onPasteToken={saveSwiggyToken}
          onSelectAddress={selectAddress}
        />

        <Header
          locationLabel={selectedAddress?.label}
          right={
            <>
              <StatusChip
                hasApiKey={!!apiKey}
                hasSwiggyToken={!!swiggyToken}
                isTokenStale={isTokenStale}
              />
              <SettingsMenu
                hasApiKey={!!apiKey}
                hasSwiggyToken={!!swiggyToken}
                hasAddress={!!selectedAddress}
                onChangeApiKey={changeApiKey}
                onDisconnectSwiggy={disconnectSwiggy}
                onClearChats={clearChats}
                onChangeAddress={changeAddress}
              />
            </>
          }
        />

        <ErrorBoundary>
          <main className="flex-1 min-h-0 overflow-hidden">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/:verticalId"
                element={
                  <ChatView
                    apiKey={apiKey}
                    swiggyToken={swiggyToken}
                    onAuthError={markTokenExpired}
                    selectedAddress={selectedAddress}
                  />
                }
              />
            </Routes>
          </main>
        </ErrorBoundary>
      </PhoneFrame>
    </BrowserRouter>
  );
}
