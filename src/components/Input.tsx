import { Text, TextInput, View } from 'react-native';

type InputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?:
    | 'default'
    | 'numeric'
    | 'email-address'
    | 'decimal-pad'
    | 'number-pad'
    | 'phone-pad';
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences';
  secureTextEntry?: boolean;
  autoComplete?:
    | 'off'
    | 'email'
    | 'password'
    | 'new-password'
    | 'username';
  textContentType?: 'none' | 'emailAddress' | 'password' | 'newPassword' | 'username';
  error?: string;
};

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  autoCapitalize = 'none',
  secureTextEntry = false,
  autoComplete = 'off',
  textContentType = 'none',
  error
}: InputProps) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">{label}</Text>
      <TextInput
        className={`rounded-lg border bg-white dark:bg-slate-800 px-3 py-2 text-base text-slate-900 dark:text-slate-100 ${
          error ? 'border-red-500 dark:border-red-600' : 'border-slate-300 dark:border-slate-600'
        }`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        spellCheck={false}
        autoComplete={autoComplete}
        textContentType={textContentType}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        showSoftInputOnFocus
        textAlignVertical={multiline ? 'top' : 'auto'}
        style={multiline ? { minHeight: 96 } : undefined}
      />
      {error ? <Text className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</Text> : null}
    </View>
  );
}
