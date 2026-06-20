import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../components/Input';
import { ScreenContainer } from '../components/ScreenContainer';
import { signInWithEmail } from '../lib/auth';
import { hapticSuccess, hapticError } from '../lib/haptics';
import { signInSchema, type SignInFormData } from '../lib/schemas/authSchema';
import type { AuthStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignIn'>;

export function SignInScreen({ navigation }: Props) {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFormSubmit(data: SignInFormData) {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmail(data.email, data.password);
      hapticSuccess();
    } catch (err) {
      hapticError();
      const message = err instanceof Error ? err.message : 'Sign in failed';
      if (/rate\s*limit|too many requests|email rate limit/i.test(message)) {
        setError('Too many auth attempts. Please wait a minute, then try again.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="flex-1 justify-center py-8">
            <Text className="mb-6 text-3xl font-bold text-slate-900 dark:text-slate-100">Gloco</Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  placeholder="Your password"
                  autoComplete="password"
                  textContentType="password"
                  error={errors.password?.message}
                />
              )}
            />

            {error ? <Text className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</Text> : null}

            <Pressable
              onPress={handleSubmit(onFormSubmit)}
              disabled={loading}
              className="mb-3 items-center rounded-lg bg-brand-600 px-4 py-3 disabled:opacity-60"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white">Sign In</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('SignUp')}
              disabled={loading}
              className="items-center px-2 py-2"
            >
              <Text className="text-brand-700">{"Don't have an account? Sign Up"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
