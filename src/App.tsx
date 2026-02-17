import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/layout/Header";
import { PhoneFrame } from "./components/layout/PhoneFrame";
import { LandingPage } from "./components/home/LandingPage";
import { ChatView } from "./components/chat/ChatView";
import { OnboardingSheet } from "./components/auth/OnboardingSheet";
import { SettingsMenu } from "./components/auth/SettingsMenu";
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
    reconnectSwiggy,
    startOAuth,
    clearChats,
    markTokenExpired,
    selectAddress,
    changeAddress,
    dismissOnboarding,
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
          onSelectAddress={selectAddress}
          onDismiss={dismissOnboarding}
        />

        <Header
          apiKey={apiKey}
          swiggyToken={swiggyToken}
          selectedAddress={selectedAddress}
          connectionActive={!!apiKey && !!swiggyToken && !isTokenStale}
          right={
            <>
              <SettingsMenu
                hasApiKey={!!apiKey}
                hasSwiggyToken={!!swiggyToken}
                hasAddress={!!selectedAddress}
                onChangeApiKey={changeApiKey}
                onConnectSwiggy={reconnectSwiggy}
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
                    onAddressError={changeAddress}
                    selectedAddress={selectedAddress}
                    onSelectAddressFromChat={selectAddress}
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
