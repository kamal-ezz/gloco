export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

export type AppTabParamList = {
  HomeTab: undefined;
  AddEntryTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  EntryDetails: { id: string };
  Contacts: undefined;
};
