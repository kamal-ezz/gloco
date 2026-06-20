import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '../components/Input';
import { ScreenContainer } from '../components/ScreenContainer';
import { signUpWithEmail } from '../lib/auth';
import { hapticSuccess, hapticError } from '../lib/haptics';
import { signUpSchema, type SignUpFormData } from '../lib/schemas/authSchema';
import type { AuthStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors }
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFormSubmit(data: SignUpFormData) {
    setLoading(true);
    setError(null);

    try {
      await signUpWithEmail(data.email, data.password);
      hapticSuccess();
      await AsyncStorage.setItem(
        'draft:auth:signin',
        JSON.stringify({ email: data.email, password: '' })
      );

      Alert.alert(
        'Account created',
        'If email confirmation is enabled in Supabase, confirm your email before signing in.'
      );
      navigation.replace('SignIn');
    } catch (err) {
      hapticError();
      const message = err instanceof Error ? err.message : 'Sign up failed';
      if (/rate\s*limit|too many requests|email rate limit/i.test(message)) {
        setError('Too many sign-up attempts. Please wait a minute, then try again.');
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
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 justify-center py-8">
            <Text className="mb-6 text-3xl font-bold text-slate-900 dark:text-slate-100">Create Account</Text>

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
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Confirm Password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  error={errors.confirmPassword?.message}
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
                <Text className="text-white">Create Account</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => navigation.navigate('SignIn')}
              disabled={loading}
              className="items-center px-2 py-2"
            >
              <Text className="text-brand-700">Already have an account? Sign In</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
